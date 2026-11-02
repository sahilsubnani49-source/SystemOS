"""
Yotei planner parser: turns a user's planner .md into structured, dated items.

The planner is the ONLY source of truth. The LLM is never allowed to author content:
it only POINTS at text in the planner (verbatim quotes) and says which period the
planner assigns it to. Everything it returns is then checked deterministically here:

  - every item's `quote` must appear in the planner          → else REJECTED
  - every item's `period_quote` must appear in the planner   → else UNSCHEDULED
  - the plan's `boundary_quote` (its time limit) must appear,
    with a readable horizon or end date                      → else 422, no invented limit

The device (apps/yotei/core) re-runs the same checks before saving and does all date
arithmetic itself; the LLM does none. normalize_line() mirrors normalizeLine() in
apps/yotei/core/src/text.ts, and both are tested against the same vectors
(apps/yotei/core/src/__tests__/normalize.vectors.json).

No deterministic fallback: an invented plan is worse than an honest failure (the same
rule as /api/goals/strategy).
"""

from __future__ import annotations

import asyncio
import re
import unicodedata
from datetime import date
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)
load_dotenv()

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from app.services.reward_generator import _get_llm


MAX_MARKDOWN_CHARS = 60_000
MAX_ITEMS = 2_000
CHUNK_CHARS = 8_000
_CONCURRENCY = 4
_MAX_TOKENS = 4_096
UNITS = ("hour", "day", "week", "month", "year")


class PlanNoTimeLimit(ValueError):
    """The planner states no time limit. Yotei never invents one."""


# ---------------------------------------------------------------------------
# Deterministic text rules (mirror of apps/yotei/core/src/text.ts)
# ---------------------------------------------------------------------------

_SMART = {
    "‘": "'", "’": "'", "‚": "'", "‛": "'",
    "“": '"', "”": '"', "„": '"', "‟": '"',
    "–": "-", "—": "-", "−": "-", "…": "...", " ": " ",
}
_SMART_RE = re.compile("[" + "".join(_SMART) + "]")
_TASK_LINE = re.compile(r"^\s*(?:[-*+]|\d{1,3}[.)])\s+\S")
MIN_QUOTE_CHARS = 3


def normalize_line(line: str) -> str:
    s = unicodedata.normalize("NFC", line)
    s = _SMART_RE.sub(lambda m: _SMART[m.group(0)], s)
    s = re.sub(r"^\s*(?:>\s*)*", "", s)
    s = re.sub(r"^\s*#{1,6}\s+", "", s)
    s = re.sub(r"^\s*(?:[-*+]|\d{1,3}[.)])\s+", "", s)
    s = re.sub(r"^\s*\[[ xX]\]\s+", "", s)
    s = re.sub(r"(\*\*|__|\*|_|`|~~)", "", s)
    s = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", s)
    return re.sub(r"\s+", " ", s).strip()


def normalize_doc(md: str) -> str:
    return "\n".join(l for l in (normalize_line(x) for x in re.split(r"\r?\n", md)) if l)


def quote_in_doc(quote: str, normalized_doc: str) -> bool:
    q = normalize_line(quote or "")
    if len(q) < MIN_QUOTE_CHARS:
        return False
    return q in normalized_doc or q in normalized_doc.replace("\n", " ")


def task_lines(md: str) -> list[str]:
    out = []
    for raw in re.split(r"\r?\n", md):
        if _TASK_LINE.match(raw):
            line = normalize_line(raw)
            if len(line) >= MIN_QUOTE_CHARS:
                out.append(line)
    return out


# ---------------------------------------------------------------------------
# LLM output schemas
# ---------------------------------------------------------------------------

class PeriodOut(BaseModel):
    unit: str = Field(description="hour | day | week | month | year")
    index: Optional[int] = Field(default=None, description="1-based relative position: 'Week 3' -> 3")
    weekday: Optional[int] = Field(default=None, description="1=Monday..7=Sunday within a relative week")
    date: Optional[str] = Field(default=None, description="Absolute start date written in the planner, YYYY-MM-DD")
    end_date: Optional[str] = Field(default=None, description="Absolute end date written in the planner, YYYY-MM-DD")
    time_start: Optional[str] = Field(default=None, description="Clock time written in the planner, 24h HH:MM")
    time_end: Optional[str] = Field(default=None, description="Clock time written in the planner, 24h HH:MM")


class ItemOut(BaseModel):
    quote: str = Field(description="The task, copied EXACTLY from the planner, character for character")
    period_quote: str = Field(description="The planner's own words that say WHEN, copied EXACTLY ('' if none)")
    period: Optional[PeriodOut] = None


class ItemsOut(BaseModel):
    items: list[ItemOut]


class MetaOut(BaseModel):
    title_quote: str = Field(description="The plan's title, copied EXACTLY from the planner")
    boundary_quote: str = Field(description="The planner's own words stating its time limit, EXACTLY ('' if none)")
    horizon_unit: Optional[str] = Field(default=None, description="hour | day | week | month | year")
    horizon_length: Optional[int] = Field(default=None, description="How many units the plan lasts")
    start_date: Optional[str] = Field(default=None, description="Start date the planner states, YYYY-MM-DD")
    end_date: Optional[str] = Field(default=None, description="End date the planner states, YYYY-MM-DD")


_RULES = """You extract structure from a user's planner. You are a copier, not a writer.

Hard rules:
1. Copy text EXACTLY as it appears in the planner. Never rephrase, summarize, correct,
   soften, translate, merge or split sentences. If you cannot copy it exactly, omit it.
2. Never add anything the planner does not say: no tips, no motivation, no extra tasks,
   no estimated dates, no assumed durations.
3. If the planner does not state something, return an empty string or null for it.
   Leaving a field empty is always correct; guessing is always wrong.
4. Dates: convert a date the planner writes into YYYY-MM-DD only if the planner gives
   the year or it is unambiguous; otherwise leave it null. Times: 24h HH:MM.
5. Output JSON only.

{format_instructions}"""

_META_PROMPT = ChatPromptTemplate.from_messages([
    ("system", _RULES),
    ("human", """From this planner, extract:
- title_quote: the plan's title, copied exactly (usually the first heading).
- boundary_quote: the exact words that state how long the plan lasts or when it ends
  (e.g. "12-week plan", "Day 1 - Day 30", "by 31 December 2026"). '' if it never says.
- horizon_unit + horizon_length: only if the planner states a length ("12 weeks" -> week, 12).
- start_date / end_date: only if the planner states calendar dates for its start / end.

Planner headings and opening:
<<<
{excerpt}
>>>"""),
])

_ITEMS_PROMPT = ChatPromptTemplate.from_messages([
    ("system", _RULES),
    ("human", """List every actionable item in this part of the planner.

For each item:
- quote: the item's text copied exactly (a bullet's text, without the bullet marker).
- period_quote: the exact words in the planner that say when it happens, usually the
  heading it sits under ("Week 3", "Day 12", "Monday 09:00-11:00", "March 2026").
  '' if the planner does not say when.
- period: that timing as data. unit is the granularity the planner uses
  (hour/day/week/month/year); index is the number the planner gives ("Week 3" -> 3);
  weekday only if the planner names a day inside a numbered week; date/end_date only
  for calendar dates the planner writes; time_start/time_end only for clock times
  the planner writes. null if the planner does not say when.

Planner section:
<<<
{chunk}
>>>"""),
])


# ---------------------------------------------------------------------------
# Chunking: split at headings so each item travels with the heading that dates it
# ---------------------------------------------------------------------------

_HEADING = re.compile(r"^\s*#{1,6}\s+\S")


def _chunks(md: str) -> list[str]:
    lines = re.split(r"\r?\n", md)
    chunks: list[str] = []
    current: list[str] = []
    size = 0
    last_heading = ""
    for line in lines:
        is_heading = bool(_HEADING.match(line))
        if size + len(line) > CHUNK_CHARS and current:
            chunks.append("\n".join(current))
            # A long section split mid-way keeps its heading for context.
            current = [last_heading] if last_heading and not is_heading else []
            size = len(last_heading) if current else 0
        if is_heading:
            last_heading = line
        current.append(line)
        size += len(line) + 1
    if current:
        chunks.append("\n".join(current))
    return chunks


def _excerpt(md: str) -> str:
    headings = [l for l in re.split(r"\r?\n", md) if _HEADING.match(l)]
    return md[:6_000] + "\n\n[All headings]\n" + "\n".join(headings[:300])


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

def _valid_date(s: Optional[str]) -> bool:
    if not s:
        return False
    try:
        date.fromisoformat(s)
        return len(s) == 10
    except ValueError:
        return False


_TIME = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


def _clean_period(p: Optional[PeriodOut]) -> Optional[dict]:
    """Shape the period for the device; None when the planner gave no usable timing."""
    if p is None or p.unit not in UNITS:
        return None
    has_index = isinstance(p.index, int) and p.index >= 1
    if not has_index and not _valid_date(p.date):
        return None
    return {
        "unit": p.unit,
        "index": p.index if has_index else None,
        "weekday": p.weekday if isinstance(p.weekday, int) and 1 <= p.weekday <= 7 else None,
        "date": p.date if _valid_date(p.date) else None,
        "end_date": p.end_date if _valid_date(p.end_date) else None,
        "time_start": p.time_start if p.time_start and _TIME.match(p.time_start) else None,
        "time_end": p.time_end if p.time_end and _TIME.match(p.time_end) else None,
    }


def verify(md: str, meta: dict, raw_items: list[dict]) -> dict:
    """Deterministic gate between the LLM and the user. Pure: unit-testable without an LLM."""
    doc = normalize_doc(md)

    boundary = meta.get("boundary_quote") or ""
    unit = meta.get("horizon_unit")
    length = meta.get("horizon_length")
    horizon = {"unit": unit, "length": length} if unit in UNITS and isinstance(length, int) and length >= 1 else None
    start_date = meta.get("start_date") if _valid_date(meta.get("start_date")) else None
    end_date = meta.get("end_date") if _valid_date(meta.get("end_date")) else None
    if not quote_in_doc(boundary, doc) or (horizon is None and end_date is None):
        raise PlanNoTimeLimit(
            "This planner has no time limit. Add one (for example \"12-week plan\" or "
            "\"by 2026-12-31\") and import it again."
        )

    title = meta.get("title_quote") or ""
    if not quote_in_doc(title, doc):
        first_heading = next((normalize_line(l) for l in re.split(r"\r?\n", md) if _HEADING.match(l)), "")
        title = first_heading or "Untitled plan"

    kept, rejected, unscheduled = [], [], []
    seen = set()
    for raw in raw_items[:MAX_ITEMS]:
        try:
            item = ItemOut.model_validate(raw)
        except Exception:
            continue
        quote = normalize_line(item.quote)
        if not quote_in_doc(item.quote, doc):
            rejected.append({"quote": item.quote, "reason": "Not found in the planner"})
            continue
        period = _clean_period(item.period)
        if period is None or not quote_in_doc(item.period_quote, doc):
            unscheduled.append({"quote": quote, "reason": "Its timing is not written in the planner"})
            continue
        key = (quote, normalize_line(item.period_quote))
        if key in seen:
            rejected.append({"quote": quote, "reason": "Duplicate"})
            continue
        seen.add(key)
        kept.append({"quote": quote, "period_quote": normalize_line(item.period_quote), "period": period})

    covered = [k["quote"] for k in kept] + [u["quote"] for u in unscheduled]
    unassigned = [l for l in task_lines(md) if not any(q in l or l in q for q in covered)]

    return {
        "plan": {
            "title": normalize_line(title),
            "boundary_quote": normalize_line(boundary),
            "horizon": horizon,
            "start_date": start_date,
            "end_date": end_date,
        },
        "items": kept,
        "rejected": rejected,
        "unscheduled": unscheduled,
        "unassigned_lines": unassigned,
    }


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

async def parse_planner(markdown: str, model_preference: str = "cloud") -> dict:
    """LLM structuring + deterministic verification. Raises PlanNoTimeLimit, or the LLM's error."""
    llm = _get_llm(model_preference, max_tokens=_MAX_TOKENS, temperature=0)

    meta_parser = JsonOutputParser(pydantic_object=MetaOut)
    items_parser = JsonOutputParser(pydantic_object=ItemsOut)
    meta_chain = _META_PROMPT | llm | meta_parser
    items_chain = _ITEMS_PROMPT | llm | items_parser

    sem = asyncio.Semaphore(_CONCURRENCY)

    async def items_for(chunk: str) -> list[dict]:
        async with sem:
            out = await items_chain.ainvoke({
                "chunk": chunk,
                "format_instructions": items_parser.get_format_instructions(),
            })
        return list((out or {}).get("items") or [])

    meta_task = meta_chain.ainvoke({
        "excerpt": _excerpt(markdown),
        "format_instructions": meta_parser.get_format_instructions(),
    })
    meta, *chunk_items = await asyncio.gather(meta_task, *(items_for(c) for c in _chunks(markdown)))
    raw_items = [it for batch in chunk_items for it in batch]
    return verify(markdown, meta or {}, raw_items)
