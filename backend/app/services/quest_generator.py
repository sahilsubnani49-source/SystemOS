"""
LangChain + LangGraph powered quest generator for SystemOS.

The Quest Master — a TWO-STAGE AI pipeline that turns a player's GOAL and a
TIMELINE (number of days) into a full campaign of dated quests:

  - Goal           (what the player wants to achieve)
  - Context        (open-ended life context that shapes the quests)
  - Duration days  (the timeline the campaign spans)
  - Player level   (for difficulty calibration)

Pipeline (LangGraph StateGraph):
  Stage 1 (strategize) : ONE LLM call produces a combined strategy + day-by-day
                         blueprint in prose — phases, attribute coverage, difficulty
                         progression, and which days hold roughly how many quests.
  Stage 2 (structure)  : turns that blueprint into strict JSON quests tagged with a
                         `day_index`. To respect the model's token budget AND the
                         provider's rate limit, it runs in a small number of LARGE,
                         SEQUENTIAL batches (never a concurrent fan-out).

Call budget per campaign = 1 (strategize) + ceil(total_quests / _MAX_QUESTS_PER_CALL).
A 30-day @ 2/day campaign is 3 calls; a ≤17-day campaign is 2.

Dungeons (mock-exam checkpoints) are generated separately and on demand — they are
NOT part of the daily campaign because their trigger (21 completed days) depends on
real player behavior weeks into the future.

A deterministic, rule-based fallback guarantees the caller is never handed an empty
result, for both campaign quests and dungeons.
"""

import json
import logging
import math
import os
import uuid
from pathlib import Path
from typing import TypedDict
from dotenv import load_dotenv

_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)
load_dotenv()

from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, FewShotChatMessagePromptTemplate
from langchain_core.runnables import Runnable
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field

from app.services.reward_generator import _get_llm

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Tuning constants
# ---------------------------------------------------------------------------

# Reward tables (difficulty → XP / gold). Kept here so the structuring output can be
# repaired deterministically even if the model mis-scales rewards.
DIFFICULTY_REWARDS: dict[str, tuple[int, int]] = {
    "E": (10, 50),
    "D": (20, 100),
    "C": (30, 200),
    "B": (50, 400),
    "A": (75, 700),
    "S": (100, 1000),
}

DEFAULT_QUESTS_PER_DAY = 2
# Cap quests per structuring call — bounds output tokens AND keeps the number of
# calls (hence rate-limit pressure) low. Batches run sequentially, never concurrently.
_MAX_QUESTS_PER_CALL = 35
_STRUCTURE_MAX_TOKENS = 4096  # ~35 quests of JSON; well under the 512 default
_RETRY_ATTEMPTS = 3  # retry transient errors (e.g. 429 rate limits) with exponential backoff


def _with_retry(runnable: Runnable) -> Runnable:
    """Wrap a chain with exponential-backoff retry for transient errors (e.g. 429).

    Single source of the retry policy — do not inline `.with_retry(...)` elsewhere.
    """
    return runnable.with_retry(wait_exponential_jitter=True, stop_after_attempt=_RETRY_ATTEMPTS)


# ---------------------------------------------------------------------------
# Output schemas
# ---------------------------------------------------------------------------

class GeneratedQuest(BaseModel):
    title: str = Field(description="Short, punchy quest title in Solo Leveling style")
    description: str = Field(description="Specific, actionable instruction — what exactly to do")
    category: str = Field(description="One of: Strength, Agility, Stamina, Intelligence, Perception, Discipline, Creativity, Mindfulness")
    difficulty: str = Field(description="E (1 hr) | D (2 hr) | C (4 hr) | B (6 hr) | A (8 hr) | S (12 hr)")
    xp_reward: int = Field(description="XP scaled to difficulty: E=10, D=20, C=30, B=50, A=75, S=100")
    gold_reward: int = Field(description="Gold scaled to difficulty: E=50, D=100, C=200, B=400, A=700, S=1000")
    day_index: int = Field(description="Which day of the timeline this quest belongs to (1-based, within the requested range)")
    aspiration_tag: str = Field(description="Short label (2-5 words) naming the goal thread this quest serves")
    rationale: str = Field(description="One sentence explaining the direct causal link to the goal")


class QuestGenerationOutput(BaseModel):
    quests: list[GeneratedQuest]


class DungeonChallenge(BaseModel):
    title: str = Field(description="Ominous, boss-like name for the mock-test gate")
    description: str = Field(description="Solo Leveling style flavor framing this as a Gate/Dungeon")
    instructions: str = Field(description="Exactly what real-world mock test / benchmark the player must perform")
    success_criteria: str = Field(description="The concrete, self-verifiable bar that counts as a PASS")
    xp_reward: int = Field(description="XP for clearing — large (A=75 or S=100)")
    gold_reward: int = Field(description="Gold for clearing — large (A=700 or S=1000)")
    loot_rarity: str = Field(description="Epic or Legendary — dungeons always drop high-tier loot")


# ---------------------------------------------------------------------------
# Prompt engineering
# ---------------------------------------------------------------------------

# --- Stage 1: strategy + day-by-day blueprint (prose, ONE call) ------------

STRATEGY_SYSTEM_PROMPT = """\
You are the Quest Master's strategist for SystemOS — a privacy-first personal growth \
RPG inspired by Solo Leveling.

Your job in THIS step is NOT to write the quests. It is to produce a STRATEGY and a \
DAY-BY-DAY BLUEPRINT, in natural-language prose, for how this player will achieve a \
specific GOAL over a fixed TIMELINE of {duration_days} days.

### Player Context:
- Goal: {goal}
- Context: {context}
- Current Level: {level}
- Timeline: {duration_days} days
- Target quests per day: about {quests_per_day}

### Cover, in order:
1. Phases — break the {duration_days} days into 2–4 phases (e.g. foundation → build → \
   peak → taper), naming the day range each phase covers.
2. Themes & attribute coverage — the distinct threads of work, and which of the 8 \
   attributes (Strength, Agility, Stamina, Intelligence, Perception, Discipline, \
   Creativity, Mindfulness) each trains, spreading across multiple attributes.
3. Difficulty progression — the FULL rank range E–S is available to EVERY player \
   regardless of level; there is NO level cap on quest rank (even a level-1 player may \
   receive an S-rank quest). Ranks now map to time commitment: E ≈ 1 hr, D ≈ 2 hrs, \
   C ≈ 4 hrs, B ≈ 6 hrs, A ≈ 8 hrs, S ≈ 12 hrs. Open gentler and ramp up across the \
   timeline for pacing, and include a spread of ranks — reserve the highest ranks \
   (A/S) for the campaign's most pivotal, momentous days.
4. Day-by-day blueprint — using explicit day numbers from 1 to {duration_days}, state \
   which themes/attributes are active on which days, roughly {quests_per_day} quests per \
   day, and which days are lighter / rest days.

Write focused prose (a strategy paragraph followed by the day-range blueprint). Do NOT \
output JSON or quest objects — just the strategy and blueprint that the next step will \
turn into quests.\
"""


# --- Stage 1 (revision): rewrite an existing draft from player feedback ----
# Reuses STRATEGY_SYSTEM_PROMPT verbatim and appends the previous draft + feedback.
# {previous_plan} and {feedback} become extra template input variables; the rest of
# the base prompt's variables ({goal}, {context}, {level}, {duration_days},
# {quests_per_day}) still apply.

STRATEGY_REVISION_SYSTEM_PROMPT = STRATEGY_SYSTEM_PROMPT + """

### Previous strategy draft:
{previous_plan}

### Player feedback:
{feedback}

Rewrite the FULL strategy and day-by-day blueprint applying the feedback. Output the \
complete revised prose, not a diff or commentary.\
"""


# --- Stage 2: structuring (strict JSON, one batch of days at a time) -------

STRUCTURING_SYSTEM_PROMPT = """\
You are the Quest Master for SystemOS — a privacy-first personal growth RPG inspired by \
Solo Leveling. A strategist produced the STRATEGY + BLUEPRINT below. Your job is to write \
the concrete quests for ONE slice of the timeline.

### Goal: {goal}
### Context: {context}
### Current Level: {level}
### Full Timeline: {duration_days} days
### Strategy & Day-by-day Blueprint:
{strategy}

### YOUR TASK NOW:
Write quests ONLY for days {day_start} through {day_end} (inclusive). Aim for about \
{quests_per_day} quests on each of those days.

### Design Rules:
1. Every quest's day_index MUST be an integer between {day_start} and {day_end}.
2. Category must be exactly one of: Strength, Agility, Stamina, Intelligence, Perception, \
   Discipline, Creativity, Mindfulness.
3. Difficulty scales with time commitment: E = 1 hour, D = 2 hours, C = 4 hours, \
   B = 6 hours, A = 8 hours, S = 12 hours. Any rank may appear regardless of the \
   player's level — there is NO level cap on quest rank. Honor the blueprint's progression.
4. XP and gold MUST match difficulty exactly:
   E → xp=10, gold=50 | D → xp=20, gold=100 | C → xp=30, gold=200
   B → xp=50, gold=400 | A → xp=75, gold=700 | S → xp=100, gold=1000
5. description must be concrete and actionable.
   Bad: "Exercise today." Good: "Complete a 30-minute run and log distance in a fitness app."
6. rationale explains the direct causal link to the goal in one sentence.
7. Spread quests across different categories — do not stack all on one attribute.

### Output Format (CRITICAL):
Return a single raw JSON object. No markdown, no code fences, no explanation text.
{{
  "quests": [
    {{
      "title": "string",
      "description": "string",
      "category": "string",
      "difficulty": "E|D|C|B|A|S",
      "xp_reward": integer,
      "gold_reward": integer,
      "day_index": integer,
      "aspiration_tag": "string",
      "rationale": "string"
    }}
  ]
}}\
"""

STRUCTURING_FEW_SHOT = [
    {
        "goal": "Run a 5k without stopping",
        "context": "Software engineer who sits 12 hours a day and is currently sedentary.",
        "level": "2",
        "duration_days": "30",
        "day_start": "1",
        "day_end": "3",
        "quests_per_day": "2",
        "output": json.dumps({
            "quests": [
                {
                    "title": "Foundation Walk",
                    "description": "Walk briskly for 20 minutes outdoors and log the distance in a fitness app.",
                    "category": "Stamina",
                    "difficulty": "D",
                    "xp_reward": 20,
                    "gold_reward": 100,
                    "day_index": 1,
                    "aspiration_tag": "Run a 5k",
                    "rationale": "Easy aerobic base-building prevents early injury for a sedentary body.",
                },
                {
                    "title": "Desk Reset Stretch",
                    "description": "After work, complete a 10-minute stretch targeting hips, hamstrings, and calves.",
                    "category": "Agility",
                    "difficulty": "E",
                    "xp_reward": 10,
                    "gold_reward": 50,
                    "day_index": 1,
                    "aspiration_tag": "Run a 5k",
                    "rationale": "Mobility work counters sitting-induced stiffness that derails running.",
                },
                {
                    "title": "Interval Primer",
                    "description": "Do 25 minutes of 1-min jog / 2-min walk intervals. Log it.",
                    "category": "Stamina",
                    "difficulty": "C",
                    "xp_reward": 30,
                    "gold_reward": 200,
                    "day_index": 2,
                    "aspiration_tag": "Run a 5k",
                    "rationale": "Run/walk intervals raise aerobic capacity without overwhelming a beginner.",
                },
                {
                    "title": "Recovery Day Walk",
                    "description": "Take a gentle 15-minute walk and hydrate well. No intensity.",
                    "category": "Mindfulness",
                    "difficulty": "E",
                    "xp_reward": 10,
                    "gold_reward": 50,
                    "day_index": 3,
                    "aspiration_tag": "Run a 5k",
                    "rationale": "Active recovery lets adaptation happen and reinforces the daily habit.",
                },
            ]
        }),
    },
]

# Shared human-turn template (used for both the few-shot examples and the live call).
_STRUCTURING_HUMAN = (
    "Goal: {goal}\nContext: {context}\nLevel: {level}\nTimeline: {duration_days} days\n"
    "Write quests for days {day_start}-{day_end} (~{quests_per_day}/day)."
)


# --- Dungeon (mock-exam) prompt --------------------------------------------

DUNGEON_SYSTEM_PROMPT = """\
You are the Gatekeeper for SystemOS — a privacy-first personal growth RPG inspired by \
Solo Leveling. The player has earned a DUNGEON KEY through weeks of consistent effort. \
A Dungeon is NOT a routine task — it is a MOCK TEST / BENCHMARK CHALLENGE that measures \
the player's real progress toward their goal.

### Goal: {goal}
### Context: {context}
### Current Level: {level}

### Design a single Dungeon the player can perform in the real world and SELF-REPORT the \
result of (pass/fail or a score). It must:
1. Be a genuine assessment of progress toward the goal (a practice exam, a timed benchmark, \
   a graded checkpoint — whatever fits the goal type).
2. Be concrete and self-verifiable: the player must be able to tell, alone and offline, \
   whether they passed.
3. Be appropriately hard — this is a boss gate, not a daily quest.

### Output Format (CRITICAL):
Return a single raw JSON object. No markdown, no code fences, no explanation text.
{{
  "title": "string",
  "description": "string",
  "instructions": "string",
  "success_criteria": "string",
  "xp_reward": integer,
  "gold_reward": integer,
  "loot_rarity": "Epic|Legendary"
}}\
"""


def _build_strategy_prompt() -> ChatPromptTemplate:
    """Stage 1: one prose call for strategy + day-by-day blueprint."""
    return ChatPromptTemplate.from_messages([
        ("system", STRATEGY_SYSTEM_PROMPT),
        ("human", "Produce the strategy and day-by-day blueprint for this campaign now."),
    ])


def _build_strategy_revision_prompt() -> ChatPromptTemplate:
    """Stage 1 (revision): rewrite an existing draft using the player's feedback."""
    return ChatPromptTemplate.from_messages([
        ("system", STRATEGY_REVISION_SYSTEM_PROMPT),
        ("human", "Produce the revised strategy and day-by-day blueprint now."),
    ])


def _build_structuring_prompt() -> ChatPromptTemplate:
    """Stage 2: convert the strategy/blueprint into strict JSON quests for a day-range."""
    example_template = ChatPromptTemplate.from_messages([
        ("human", _STRUCTURING_HUMAN),
        ("ai", "{output}"),
    ])
    few_shot_prompt = FewShotChatMessagePromptTemplate(
        example_prompt=example_template,
        examples=STRUCTURING_FEW_SHOT,
    )
    return ChatPromptTemplate.from_messages([
        ("system", STRUCTURING_SYSTEM_PROMPT),
        few_shot_prompt,
        ("human", _STRUCTURING_HUMAN),
    ])


def _build_dungeon_prompt() -> ChatPromptTemplate:
    return ChatPromptTemplate.from_messages([
        ("system", DUNGEON_SYSTEM_PROMPT),
        ("human", "Design the Dungeon now."),
    ])


# Build prompt templates once at module load (not per request).
_STRATEGY_PROMPT = _build_strategy_prompt()
_STRATEGY_REVISION_PROMPT = _build_strategy_revision_prompt()
_STRUCTURING_PROMPT = _build_structuring_prompt()
_DUNGEON_PROMPT = _build_dungeon_prompt()
_JSON_PARSER = JsonOutputParser(pydantic_object=QuestGenerationOutput)
_DUNGEON_PARSER = JsonOutputParser(pydantic_object=DungeonChallenge)


# ---------------------------------------------------------------------------
# Reward repair — enforce difficulty → XP/gold invariants
# ---------------------------------------------------------------------------

def _repair_quest(quest: dict, day_start: int, day_end: int) -> dict:
    """Clamp difficulty/day_index and force XP/gold to match difficulty exactly."""
    difficulty = str(quest.get("difficulty", "E")).upper()
    if difficulty not in DIFFICULTY_REWARDS:
        difficulty = "E"
    quest["difficulty"] = difficulty
    xp, gold = DIFFICULTY_REWARDS[difficulty]
    quest["xp_reward"] = xp
    quest["gold_reward"] = gold

    # Keep day_index inside the requested batch window.
    try:
        di = int(quest.get("day_index", day_start))
    except (TypeError, ValueError):
        di = day_start
    quest["day_index"] = min(max(di, day_start), day_end)
    return quest


# ---------------------------------------------------------------------------
# Two-stage LangGraph pipeline: strategize → structure
# ---------------------------------------------------------------------------

class CampaignState(TypedDict):
    """State flowing through the campaign graph (constructed per request)."""
    goal: str
    context: str
    duration_days: str
    level: str
    quests_per_day: str
    model_preference: str
    strategy: str  # Stage 1 output
    quests: list[dict]  # Stage 2 output


async def _run_strategy_chain(
    goal: str,
    context: str,
    level,
    duration_days,
    quests_per_day,
    model_preference: str,
) -> str:
    """Run the Stage-1 strategy chain and return the prose strategy + blueprint.

    Single definition of the fresh-strategy chain, shared by the graph's
    `_strategize_node` and the public `generate_campaign_strategy`, so the chain
    is never duplicated. Values are stringified for the prompt template.
    """
    llm = _get_llm(model_preference)
    chain = _with_retry(_STRATEGY_PROMPT | llm | StrOutputParser())
    strategy: str = await chain.ainvoke({
        "goal": goal,
        "context": context,
        "duration_days": str(duration_days),
        "level": str(level),
        "quests_per_day": str(quests_per_day),
    })
    return strategy


async def _strategize_node(state: CampaignState) -> dict:
    """Stage 1 — one LLM call produces the strategy + day-by-day blueprint (prose)."""
    strategy = await _run_strategy_chain(
        goal=state["goal"],
        context=state["context"],
        level=state["level"],
        duration_days=state["duration_days"],
        quests_per_day=state["quests_per_day"],
        model_preference=state["model_preference"],
    )
    logger.info("[Quest Master] Stage 1 strategy produced (%d chars).", len(strategy))
    return {"strategy": strategy}


async def _structure_batch(
    *,
    goal: str,
    context: str,
    level: str,
    duration_days: str,
    strategy: str,
    day_start: int,
    day_end: int,
    quests_per_day: int,
    model_preference: str,
) -> list[dict]:
    """Emit strict JSON quests for the day window [day_start, day_end]."""
    llm = _get_llm(model_preference, max_tokens=_STRUCTURE_MAX_TOKENS)
    chain = _with_retry(_STRUCTURING_PROMPT | llm | _JSON_PARSER)
    result: dict = await chain.ainvoke({
        "goal": goal,
        "context": context,
        "level": level,
        "duration_days": duration_days,
        "strategy": strategy,
        "day_start": str(day_start),
        "day_end": str(day_end),
        "quests_per_day": str(quests_per_day),
    })
    quests = result.get("quests", []) or []
    return [_repair_quest(q, day_start, day_end) for q in quests]


def _batch_windows(duration_days: int, quests_per_day: int) -> list[tuple[int, int]]:
    """Split the timeline into the FEWEST day-windows that stay within the per-call
    quest budget. Larger windows → fewer LLM calls → less rate-limit pressure."""
    batch_days = max(1, _MAX_QUESTS_PER_CALL // max(1, quests_per_day))
    return [
        (start, min(start + batch_days - 1, duration_days))
        for start in range(1, duration_days + 1, batch_days)
    ]


async def _structure_node(state: CampaignState) -> dict:
    """Stage 2 — turn the strategy into JSON quests across the timeline.

    Runs the day-windows SEQUENTIALLY (never a concurrent fan-out) so we don't burst
    the provider's rate limit. Each window degrades to the rule-based slice on failure,
    so a single bad batch never empties the campaign.
    """
    goal = state["goal"]
    duration_days = int(state["duration_days"])
    quests_per_day = int(state["quests_per_day"])

    all_quests: list[dict] = []
    for day_start, day_end in _batch_windows(duration_days, quests_per_day):
        try:
            batch = await _structure_batch(
                goal=goal,
                context=state["context"],
                level=state["level"],
                duration_days=state["duration_days"],
                strategy=state["strategy"],
                day_start=day_start,
                day_end=day_end,
                quests_per_day=quests_per_day,
                model_preference=state["model_preference"],
            )
        except Exception as batch_err:
            logger.warning(
                "[Quest Master] Batch days %d-%d failed (%s). Using fallback for this window.",
                day_start, day_end, batch_err,
            )
            batch = [
                q for q in synthesize_fallback_quests(goal, duration_days, quests_per_day)
                if day_start <= q["day_index"] <= day_end
            ]
        all_quests.extend(batch)

    return {"quests": all_quests}


def _build_graph():
    """Compile the strategize → structure graph once at module load."""
    graph = StateGraph(CampaignState)
    graph.add_node("strategize", _strategize_node)
    graph.add_node("structure", _structure_node)
    graph.add_edge(START, "strategize")
    graph.add_edge("strategize", "structure")
    graph.add_edge("structure", END)
    return graph.compile()


_CAMPAIGN_GRAPH = _build_graph()


# ---------------------------------------------------------------------------
# Fallback generators (rule-based, deterministic)
# ---------------------------------------------------------------------------

_FALLBACK_TEMPLATES = [
    {
        "title": "Daily Drive Block",
        "description": "Spend 30 focused minutes on the single most important action toward your goal. No distractions.",
        "category": "Discipline",
        "difficulty": "D",
    },
    {
        "title": "Skill Reps",
        "description": "Practice the core skill your goal depends on for 20 minutes and note one thing you improved.",
        "category": "Intelligence",
        "difficulty": "D",
    },
    {
        "title": "Reflection Log",
        "description": "Write 3 sentences reviewing today's progress toward your goal before sleep.",
        "category": "Mindfulness",
        "difficulty": "E",
    },
]


def synthesize_fallback_quests(goal: str, duration_days: int, quests_per_day: int = DEFAULT_QUESTS_PER_DAY) -> list[dict]:
    """Rule-based campaign fallback — spreads template quests across every day."""
    import copy

    quests: list[dict] = []
    tag = (goal or "Your goal").strip()[:40]
    for day in range(1, max(1, duration_days) + 1):
        for i in range(max(1, quests_per_day)):
            template = copy.deepcopy(_FALLBACK_TEMPLATES[(day + i) % len(_FALLBACK_TEMPLATES)])
            xp, gold = DIFFICULTY_REWARDS[template["difficulty"]]
            quests.append({
                **template,
                "xp_reward": xp,
                "gold_reward": gold,
                "day_index": day,
                "aspiration_tag": tag,
                "rationale": "Consistent daily action compounds into goal achievement.",
                "id": str(uuid.uuid4()),
                "is_completed": False,
            })
    return quests


def synthesize_fallback_dungeon(goal: str) -> dict:
    """Rule-based mock-exam dungeon when the LLM is unavailable."""
    tag = (goal or "your goal").strip()
    return {
        "title": "The Proving Gate",
        "description": f"A shadowed gate materializes. To pass, you must prove real progress toward: {tag}.",
        "instructions": f"Take a full, honest mock test or timed benchmark that measures your current ability at '{tag}'. Do it in one sitting under realistic conditions.",
        "success_criteria": "You complete the benchmark and meet the standard you set when you started this campaign.",
        "xp_reward": DIFFICULTY_REWARDS["S"][0],
        "gold_reward": DIFFICULTY_REWARDS["S"][1],
        "loot_rarity": "Legendary",
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def generate_campaign_strategy(
    goal: str,
    context: str,
    duration_days: int,
    level: int,
    model_preference: str = "cloud",
    quests_per_day: int = DEFAULT_QUESTS_PER_DAY,
    previous_plan: str | None = None,
    feedback: str | None = None,
) -> str:
    """
    Produce (or revise) the Stage-1 strategy + day-by-day blueprint prose on its own.

    This exposes the strategizing step so a route can show the plan to the player and
    let them approve or refine it before the (more expensive) structuring step runs.

    - Without `previous_plan`: run the fresh Stage-1 strategy chain.
    - With `previous_plan`: run the revision chain, rewriting the FULL blueprint to
      apply `feedback` (defaults to "Improve and tighten the plan." when empty/None).

    NO internal fallback — exceptions propagate so the calling route decides how to
    react (retry, surface an error, etc.). Returns the raw strategy string.
    """
    goal = goal or "Achieve meaningful personal growth."
    context = context or "A motivated individual seeking personal growth."
    duration_days = max(1, int(duration_days))
    quests_per_day = max(1, int(quests_per_day))

    if not previous_plan:
        return await _run_strategy_chain(
            goal=goal,
            context=context,
            level=level,
            duration_days=duration_days,
            quests_per_day=quests_per_day,
            model_preference=model_preference,
        )

    llm = _get_llm(model_preference)
    chain = _with_retry(_STRATEGY_REVISION_PROMPT | llm | StrOutputParser())
    return await chain.ainvoke({
        "goal": goal,
        "context": context,
        "duration_days": str(duration_days),
        "level": str(level),
        "quests_per_day": str(quests_per_day),
        "previous_plan": previous_plan,
        "feedback": feedback or "Improve and tighten the plan.",
    })


async def generate_goal_campaign(
    goal: str,
    context: str,
    duration_days: int,
    level: int,
    model_preference: str = "cloud",
    quests_per_day: int = DEFAULT_QUESTS_PER_DAY,
    approved_plan: str | None = None,
) -> dict:
    """
    Generate a full campaign of dated quests for a goal over `duration_days`.

    Two-stage graph: one strategy call, then sequential large structuring batches.
    Returns: { "plan": str, "schedule": str, "quests": [ {.., day_index, id, is_completed} ] }
    (`plan` carries the strategy prose; `schedule` is kept for API compatibility.)

    When `approved_plan` is supplied and non-empty, the Stage-1 graph node is skipped
    entirely: the given plan is fed straight into the structuring step. This lets a
    route reuse a strategy the player already reviewed (see generate_campaign_strategy)
    without paying for a second strategize call.

    Fallback guarantee: any failure (graph, structuring, or empty output) degrades to
    the deterministic rule-based campaign so the caller always receives a full timeline.
    This holds for the approved-plan bypass too.
    """
    goal = goal or "Achieve meaningful personal growth."
    context = context or "A motivated individual seeking personal growth."
    duration_days = max(1, int(duration_days))
    quests_per_day = max(1, int(quests_per_day))

    expected_calls = 1 + math.ceil((duration_days * quests_per_day) / _MAX_QUESTS_PER_CALL)
    logger.info(
        "[Quest Master] Campaign: %d days @ %d/day → ~%d sequential LLM call(s)%s.",
        duration_days, quests_per_day, expected_calls,
        " (approved plan: Stage 1 skipped)" if approved_plan else "",
    )

    try:
        if approved_plan:
            # Skip the graph; run the structuring node directly on the approved plan.
            structure_result: dict = await _structure_node({
                "goal": goal,
                "context": context,
                "duration_days": str(duration_days),
                "level": str(level),
                "quests_per_day": str(quests_per_day),
                "model_preference": model_preference,
                "strategy": approved_plan,
            })
            approved_quests: list[dict] = structure_result.get("quests") or []
            if not approved_quests:
                raise RuntimeError("Campaign produced no quests.")

            for quest in approved_quests:
                quest["id"] = str(uuid.uuid4())
                quest.setdefault("is_completed", False)

            return {"plan": approved_plan, "schedule": "", "quests": approved_quests}

        final_state: CampaignState = await _CAMPAIGN_GRAPH.ainvoke({
            "goal": goal,
            "context": context,
            "duration_days": str(duration_days),
            "level": str(level),
            "quests_per_day": str(quests_per_day),
            "model_preference": model_preference,
        })

        all_quests: list[dict] = final_state.get("quests") or []
        if not all_quests:
            raise RuntimeError("Campaign produced no quests.")

        for quest in all_quests:
            quest["id"] = str(uuid.uuid4())
            quest.setdefault("is_completed", False)

        return {"plan": final_state.get("strategy", ""), "schedule": "", "quests": all_quests}

    except Exception as e:
        logger.warning(
            "[Quest Master] Campaign pipeline failed (%s). Falling back to rule-based campaign.",
            e,
        )
        return {
            "plan": "",
            "schedule": "",
            "quests": synthesize_fallback_quests(goal, duration_days, quests_per_day),
        }


async def generate_dungeon(
    goal: str,
    context: str,
    level: int,
    model_preference: str = "cloud",
) -> dict:
    """
    Generate a single mock-exam Dungeon for the player's goal.

    Returns a dict matching DungeonChallenge (with `dungeon_id` added).
    Falls back to a deterministic dungeon if the LLM call fails.
    """
    goal = goal or "Achieve meaningful personal growth."
    context = context or "A motivated individual seeking personal growth."

    try:
        llm = _get_llm(model_preference)
        chain = _with_retry(_DUNGEON_PROMPT | llm | _DUNGEON_PARSER)
        result: dict = await chain.ainvoke({
            "goal": goal,
            "context": context,
            "level": str(level),
        })

        # Enforce invariants — the model may omit fields; mobile expects them all.
        defaults = synthesize_fallback_dungeon(goal)
        for field in ("title", "description", "instructions", "success_criteria"):
            if not result.get(field):
                result[field] = defaults[field]
        if str(result.get("loot_rarity")) not in ("Epic", "Legendary"):
            result["loot_rarity"] = "Epic"
        if not result.get("xp_reward"):
            result["xp_reward"] = DIFFICULTY_REWARDS["A"][0]
        if not result.get("gold_reward"):
            result["gold_reward"] = DIFFICULTY_REWARDS["A"][1]
        result["dungeon_id"] = str(uuid.uuid4())
        return result

    except Exception as e:
        logger.warning(
            "[Gatekeeper] Dungeon generation failed (%s). Falling back to deterministic dungeon.",
            e,
        )
        fallback = synthesize_fallback_dungeon(goal)
        fallback["dungeon_id"] = str(uuid.uuid4())
        return fallback
