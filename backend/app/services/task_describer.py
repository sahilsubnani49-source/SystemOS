"""
LangChain-powered task describer for SystemOS.

The Architect, narrating the work — an AI agent that turns a campaign plus the quests
scheduled for today into ONE concrete task line for the Army tab's focus timer:

  - goal_title / context / plan_excerpt  → what the campaign is actually for
  - quests                               → today's scheduled work, including the one
                                           the Hunter has already ACCEPTED

Output is a strictly validated JSON object carrying the task line, a short focus tag,
and a one-sentence rationale. Falls back to a deterministic template — the same rule the
mobile app applies offline in CampaignTaskService.ts — whenever the LLM is unavailable.

This runs AFTER the timer has already started on the device, so the description it
returns is an upgrade to an existing line, never a blocker on starting work.
"""

from pathlib import Path
from dotenv import load_dotenv

_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)
load_dotenv()

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate, FewShotChatMessagePromptTemplate
from pydantic import BaseModel, Field

from app.services.reward_generator import _get_llm


# ---------------------------------------------------------------------------
# Output schema (mirrors the task-describe payload the mobile app expects)
# ---------------------------------------------------------------------------

class TaskDescriptionOutput(BaseModel):
    description: str = Field(description="ONE concrete task line, at most 80 characters")
    focus: str = Field(description="A 1-3 word focus tag, e.g. 'deep work' or 'revision'")
    rationale: str = Field(description="ONE sentence tying the task to the campaign plan")


# ---------------------------------------------------------------------------
# Deterministic limits (enforced in Python, never left to the prompt)
# ---------------------------------------------------------------------------

# Must match MAX_DESCRIPTION_CHARS in mobile/src/data/services/CampaignTaskService.ts —
# the device stores whatever comes back, and PressStart2P is a very wide pixel face.
MAX_DESCRIPTION_CHARS = 80
# ASCII on purpose: the pixel font has a narrow glyph set and an em-dash risks tofu.
SEPARATOR = " - "
_MAX_TOKENS = 256


def _truncate_words(text: str, max_chars: int) -> str:
    """Truncate on a word boundary, falling back to a hard cut when the last space is
    so early that honouring it would throw away most of the budget."""
    trimmed = text.strip()
    if len(trimmed) <= max_chars:
        return trimmed
    cut = trimmed[: max(0, max_chars - 3)]
    last_space = cut.rfind(" ")
    body = cut[:last_space] if last_space > max_chars * 0.5 else cut
    return f"{body.rstrip()}..."


def _context_clause(context: str) -> str | None:
    """First clause of the free-form campaign context, or None when unusable."""
    trimmed = (context or "").strip()
    if not trimmed:
        return None
    clause = trimmed
    for stop in ".!?,;\n":
        idx = clause.find(stop)
        if idx > 0:
            clause = clause[:idx]
    clause = clause.strip()
    return clause if len(clause) >= 3 else None


# ---------------------------------------------------------------------------
# Prompt engineering
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are the Architect, the system coordinator for SystemOS — a privacy-first personal \
growth operating system inspired by Solo Leveling.

Your purpose in THIS step is to name the work. The Hunter has just started a focus timer \
against one of their campaigns. Given the campaign, an excerpt of its plan, and the \
quests scheduled for today, write the ONE task line that should sit on that running \
timer.

### Design principles:
1. description: ONE concrete, specific line of AT MOST 80 characters. Name the actual \
work, not the campaign's ambition. Prefer the quest marked ACCEPTED — that is what the \
Hunter is on right now.
2. Lead with the campaign so the line is recognisable in a list, then the work: \
"<campaign> - <the work>".
3. No trailing period. No quotes. No markdown.
4. focus: a 1-3 word tag for the mode of work (e.g. "deep work", "revision", "drills").
5. rationale: ONE sentence tying the task to the campaign plan.
6. Speak in the calm System tone — concrete, earned, never grandiose.

### Output Format (CRITICAL):
Return a single raw JSON object. No markdown, no code fences, no explanation.
{{
  "description": "string",
  "focus": "string",
  "rationale": "string"
}}\
"""

FEW_SHOT_EXAMPLES = [
    {
        "goal_title": "Kaggle Grandmaster",
        "context": "Reach Kaggle Expert tier within 90 days, focusing on tabular competitions",
        "plan_excerpt": "Weeks 1-2 build the EDA and feature-engineering habit before touching models.",
        "quest_summary": "Finish the EDA notebook for the housing dataset [C] ACCEPTED\nRead one winning solution write-up [E] pending",
        "output": '{"description": "Kaggle Grandmaster - Finish the housing EDA notebook", "focus": "deep work", "rationale": "Week-1 of the plan is about building the EDA habit before any modelling."}',
    },
    {
        "goal_title": "Ship the iOS app",
        "context": "Launch v1 on the App Store by the end of the quarter",
        "plan_excerpt": "Phase 2 is the onboarding flow and the paywall; polish comes last.",
        "quest_summary": "No quests scheduled today",
        "output": '{"description": "Ship the iOS app - Build the onboarding flow", "focus": "building", "rationale": "Phase 2 of the plan puts onboarding ahead of any polish work."}',
    },
]


def _format_quests(quests: list[dict]) -> str:
    """Render today's quests as a compact summary, flagging the accepted one.

    e.g. "Finish the EDA notebook [C] ACCEPTED". Keeps raw objects out of the prompt
    while still surfacing the signal that matters: what the Hunter committed to.
    """
    pending = [q for q in quests if not q.get("is_completed")]
    if not pending:
        return "No quests scheduled today"

    lines: list[str] = []
    for q in pending:
        title = q.get("title", "Untitled")
        difficulty = q.get("difficulty", "E")
        state = "ACCEPTED" if q.get("is_accepted") else "pending"
        lines.append(f"{title} [{difficulty}] {state}")
    return "\n".join(lines)


def _build_prompt() -> ChatPromptTemplate:
    """Constructs the few-shot chat prompt template."""
    human_template = (
        "Campaign: {goal_title}\nContext: {context}\n"
        "Plan excerpt: {plan_excerpt}\nToday's quests:\n{quest_summary}"
    )

    example_template = ChatPromptTemplate.from_messages([
        ("human", human_template),
        ("ai", "{output}"),
    ])

    few_shot_prompt = FewShotChatMessagePromptTemplate(
        example_prompt=example_template,
        examples=FEW_SHOT_EXAMPLES,
    )

    return ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        few_shot_prompt,
        ("human", human_template),
    ])


# Build the prompt + parser once at module load (not per request).
_TASK_PROMPT = _build_prompt()
_TASK_PARSER = JsonOutputParser(pydantic_object=TaskDescriptionOutput)


# ---------------------------------------------------------------------------
# Rule-based fallback
# ---------------------------------------------------------------------------

def synthesize_fallback_task_description(
    goal_title: str,
    context: str,
    quests: list[dict],
) -> dict:
    """
    Deterministic task line when the LLM is unavailable.

    Canonical rule — mirrored exactly by composeTaskDescription() in
    mobile/src/data/services/CampaignTaskService.ts, which is the offline path:
      with a quest    ->  "<goal title> - <quest title>"
      without a quest ->  "<goal title> - <first clause of context, or 'campaign work'>"

    Quest selection: the quest ACCEPTED today and unfinished, else the first pending
    one (the caller sends them ordered by difficulty).
    """
    pending = [q for q in quests if not q.get("is_completed")]
    accepted = next((q for q in pending if q.get("is_accepted")), None)
    quest = accepted or (pending[0] if pending else None)
    quest_title = (quest.get("title") or "").strip() if quest else ""

    goal = (goal_title or "").strip() or "Campaign"
    if len(goal) >= MAX_DESCRIPTION_CHARS:
        description = _truncate_words(goal, MAX_DESCRIPTION_CHARS)
    else:
        budget = MAX_DESCRIPTION_CHARS - len(goal) - len(SEPARATOR)
        if budget < 8:
            description = goal
        else:
            tail = quest_title or _context_clause(context) or "campaign work"
            description = f"{goal}{SEPARATOR}{_truncate_words(tail, budget)}"

    return {
        "description": description,
        "focus": "focus",
        "rationale": f"Drawn from your {goal} campaign.",
    }


# ---------------------------------------------------------------------------
# Main public function
# ---------------------------------------------------------------------------

async def generate_task_description(
    goal_title: str,
    context: str,
    plan_excerpt: str,
    quests: list[dict],
    model_preference: str = "cloud",
) -> dict:
    """
    Generate a task line for a running focus timer using LangChain.

    Returns a dict matching the task-describe schema. The 80-character ceiling is
    re-asserted in Python after parsing — the model is advisory, the limit is not.
    Raises on chain failure; the caller should catch and fall back.
    """
    llm = _get_llm(model_preference, max_tokens=_MAX_TOKENS)
    chain = _TASK_PROMPT | llm | _TASK_PARSER

    result: dict = await chain.ainvoke({
        "goal_title": goal_title,
        "context": context or "(none given)",
        "plan_excerpt": plan_excerpt or "(none given)",
        "quest_summary": _format_quests(quests),
    })

    # Length and presence are server-authoritative — the device stores this verbatim.
    description = str(result.get("description") or "").strip()
    if not description:
        description = synthesize_fallback_task_description(goal_title, context, quests)["description"]
    result["description"] = _truncate_words(description, MAX_DESCRIPTION_CHARS)

    focus = str(result.get("focus") or "").strip()
    result["focus"] = (focus or "focus")[:24]

    if not result.get("rationale"):
        result["rationale"] = f"Drawn from your {goal_title} campaign."

    return result
