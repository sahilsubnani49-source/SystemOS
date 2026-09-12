# AI System Prompts

SystemOS runs five AI agents, all in `backend/app/services/`. Every prompt is defined in
code — this document describes what each one does, its inputs, and its output schema.
The code is the source of truth; when they disagree, the code wins.

> This document previously covered only a single "Architect" reward agent that produced
> stat-boosting gear. That model was retired — see [`REWARD_SYSTEM.md`](REWARD_SYSTEM.md).

---

## Agents at a glance

| Agent | Service | Route | Purpose |
|---|---|---|---|
| **Quest Master — Strategist** | `quest_generator.py` | `POST /api/goals/strategy` | Draft/revise a campaign strategy in prose |
| **Quest Master — Structurer** | `quest_generator.py` | `POST /api/goals/plan` | Turn the strategy into dated JSON quests |
| **Gatekeeper** | `quest_generator.py` | `POST /api/dungeons/generate` | Design one mock-exam dungeon |
| **Architect — Reward** | `reward_generator.py` | `POST /api/quests/{id}/complete` | Grant a real-world reward coupon |
| **Architect — Nutritionist** | `nutrition_advisor.py` | `POST /api/nutrition/protein` | Set a daily protein target |
| **Architect — Task line** | `task_describer.py` | `POST /api/tasks/describe` | Name the work on a running focus timer |

## Shared conventions

All chains follow the same LangChain LCEL shape:

```python
ChatPromptTemplate (system + few-shot examples)
  | _get_llm(model_preference)          # shared provider factory
  | JsonOutputParser(pydantic_object=OutputSchema)
```

- **`_get_llm()` lives only in `reward_generator.py`.** Every other service imports it.
  Do not define a second copy.
- **Provider priority** (cloud mode, first key present wins): Groq → xAI Grok → Gemini →
  Anthropic → OpenAI. Local mode uses Ollama.
- **Raw JSON only.** Every prompt ends with an explicit "no markdown, no code fences, no
  explanation" instruction. Braces in prompt templates are escaped as `{{` / `}}`.
- **Invariants are enforced in Python, never left to the prompt.** Models drift, so
  rarity, type, day ranges, and character limits are all clamped after parsing.
- **Every route except `/api/goals/strategy` has a deterministic fallback** and returns
  HTTP 200 even when the LLM fails, flagged by `ai_generated: false`.

---

## Quest Master — Stage 1: Strategist

`STRATEGY_SYSTEM_PROMPT` in `quest_generator.py`. Returns **prose**, not JSON — the plan
the player previews and approves before any quests are written.

**Inputs:** `goal`, `context`, `level`, `duration_days`, `quests_per_day`

The prompt asks for four sections in order:

1. **Phases** — break the timeline into 2–4 phases (foundation → build → peak → taper),
   naming the day range each covers.
2. **Themes & attribute coverage** — the distinct threads of work and which of the eight
   attributes each trains, spread across multiple attributes.
3. **Difficulty progression** — ranks map to time commitment (E ≈ 1 hr, D ≈ 2, C ≈ 4,
   B ≈ 6, A ≈ 8, S ≈ 12). The full E–S range is available to **every** player regardless
   of level; there is no level cap on quest rank. Open gentler and ramp up, reserving
   A/S for the campaign's pivotal days.
4. **Day-by-day blueprint** — explicit day numbers from 1 to N, which themes are active
   on which days, and which days are lighter or rest days.

### Revision mode

`STRATEGY_REVISION_SYSTEM_PROMPT` reuses the base prompt verbatim and appends the
previous draft plus the player's feedback, adding `{previous_plan}` and `{feedback}` as
template variables. It asks for the **complete revised prose**, not a diff.

This is the one route with **no fallback**. On failure it returns `{"plan": "",
"ai_generated": false}` and the client treats that as "Architect unreachable" — a
fabricated strategy would be worse than none.

---

## Quest Master — Stage 2: Structurer

`STRUCTURING_SYSTEM_PROMPT` in `quest_generator.py`. Converts the approved strategy into
concrete quests, **one slice of the timeline per call** so long campaigns don't blow the
output limit.

**Inputs:** `goal`, `context`, `level`, `duration_days`, `strategy`, `day_start`,
`day_end`, `quests_per_day`

Key rules: every `day_index` must fall between `day_start` and `day_end` (clamped in
Python afterward), and `category` must be exactly one of the eight attributes.

### Output schema

```python
class GeneratedQuest(BaseModel):
    title: str            # short, punchy, Solo Leveling style
    description: str      # specific, actionable — what exactly to do
    category: str         # one of the 8 attributes
    difficulty: str       # E (1hr) | D (2hr) | C (4hr) | B (6hr) | A (8hr) | S (12hr)
    xp_reward: int        # E=10, D=20, C=30, B=50, A=75, S=100
    gold_reward: int      # E=50, D=100, C=200, B=400, A=700, S=1000
    day_index: int        # 1-based, within the requested range
    aspiration_tag: str   # 2-5 words naming the goal thread this serves
    rationale: str        # one sentence on the causal link to the goal

class QuestGenerationOutput(BaseModel):
    quests: list[GeneratedQuest]
```

`aspiration_tag` and `rationale` are returned for display context and are **not** stored
in SQLite.

### Pipeline

The two stages run as a LangGraph pipeline (`CampaignState`): strategize → structure in
weekly batches. `synthesize_fallback_quests()` produces a deterministic rule-based
campaign if the chain fails, so `/api/goals/plan` always returns a full dated quest set.
An empty `plan` string in the response means the fallback was used.

---

## Gatekeeper — Dungeons

`DUNGEON_SYSTEM_PROMPT` in `quest_generator.py`. Called when the device awards a dungeon
key (21 completed days).

**Inputs:** `goal`, `context`, `level`

A dungeon is **not** a routine task — it is a mock test or benchmark that measures real
progress. The prompt requires it to be:

1. A genuine assessment of progress toward the goal (practice exam, timed benchmark,
   graded checkpoint — whatever fits the goal type).
2. Concrete and **self-verifiable** — the player must be able to tell, alone and offline,
   whether they passed.
3. Appropriately hard. This is a boss gate, not a daily quest.

```python
class DungeonChallenge(BaseModel):
    title: str              # ominous, boss-like name
    description: str        # flavor framing this as a Gate
    instructions: str       # the real-world benchmark to perform
    success_criteria: str   # the concrete bar that counts as a PASS
    xp_reward: int          # large — A=75 or S=100
    gold_reward: int        # large — A=700 or S=1000
    loot_rarity: str        # Epic or Legendary — dungeons always drop high tier
```

Falls back to `synthesize_fallback_dungeon()`.

---

## Architect — Rewards

`SYSTEM_PROMPT` in `reward_generator.py`. Grants one real-world indulgence the player has
earned. **Never stat items or gear.**

**Inputs:** `bio`, `category`, `rarity` (rolled by the device)

Two reward classes: `token` (active leisure/social) and `potion` (rest/self-care). Rarity
scales how generous the indulgence is — Common ~10 min, Rare ~20 min, Epic ~30–40 min,
Legendary ~60 min or a full night's rest. The description must name the real activity
**and** its concrete amount in one warm, cinematic sentence.

```python
class RewardOutput(BaseModel):
    type: str          # "token" | "potion"
    name: str          # e.g. "Token of Gaming", "Potion of Sleep"
    description: str   # the indulgence AND its amount/duration
    rarity: str        # Common | Rare | Epic | Legendary
```

Example:

```json
{
  "type": "token",
  "name": "Token of Gaming",
  "description": "You have earned forty uninterrupted minutes in the game you have been putting off — no guilt, no clock-watching.",
  "rarity": "Epic"
}
```

`type` and `rarity` are re-coerced in Python after parsing. Full drop odds and the
fallback table are in [`REWARD_SYSTEM.md`](REWARD_SYSTEM.md).

---

## Architect — Nutritionist

`SYSTEM_PROMPT` in `nutrition_advisor.py`. Sets a daily protein target from body metrics
and current training load.

**Inputs:** `height_cm`, `weight_kg`, a precomputed BMI and category, and a compact
summary of the exercises being trained.

Anchors by BMI category, in grams per kg of bodyweight — lower BMI leans higher (build),
higher BMI leans lower (preserve lean mass while cutting):

| BMI category | Anchor |
|---|---|
| UNDERWEIGHT | ~2.0 g/kg |
| NORMAL | ~1.8 g/kg |
| OVERWEIGHT | ~1.6 g/kg |
| OBESE | ~1.4 g/kg |

Up to **+0.2 g/kg** is added when the player trained hard today (most exercises
completed). The range is roughly ±10% around the target.

```python
class NutritionOutput(BaseModel):
    daily_protein_g: int
    range_min_g: int
    range_max_g: int
    bmi: float          # recomputed server-side; the model's value is advisory
    bmi_category: str   # UNDERWEIGHT | NORMAL | OVERWEIGHT | OBESE
    rationale: str      # ONE sentence tying the target to BMI + training
    tip: str            # ONE actionable sentence
```

BMI is computed in Python and passed *into* the prompt rather than trusted from the
model. Falls back to `synthesize_fallback_nutrition()`, the same rule-based math.

---

## Architect — Task line

`SYSTEM_PROMPT` in `task_describer.py`. Names the work sitting on a running focus timer.

**Inputs:** `goal_title`, `context`, `plan_excerpt`, today's `quests` (each with a
`is_accepted` flag)

Rules: one concrete line of **at most 80 characters**, leading with the campaign so it's
recognizable in a list — `"<campaign> - <the work>"`. Prefer the quest marked ACCEPTED,
since that's what the Hunter is on right now. No trailing period, no quotes, no markdown.

```python
class TaskDescriptionOutput(BaseModel):
    description: str   # ONE concrete task line, ≤ 80 chars
    focus: str         # 1-3 word tag: "deep work", "revision", "drills"
    rationale: str     # ONE sentence tying the task to the campaign plan
```

`MAX_DESCRIPTION_CHARS = 80` is enforced in Python and **must stay in sync** with the
same constant in `mobile/src/data/services/CampaignTaskService.ts` — the device stores
whatever comes back, and Press Start 2P is a very wide pixel face. Output is kept ASCII
on purpose: the pixel font has a narrow glyph set and an em-dash risks tofu.

The device starts the timer *before* calling this, so a slow or failed response only
forgoes an upgrade to the line. Falls back to
`synthesize_fallback_task_description()` — the same deterministic template the device
uses offline.

---

## Adding an agent

1. Put the service in `backend/app/services/`, importing `_get_llm` from
   `reward_generator.py`.
2. Define a Pydantic output schema and parse with `JsonOutputParser(pydantic_object=…)`.
3. Write a `synthesize_fallback_*()` that produces a usable result with no LLM.
4. Clamp every invariant in Python after parsing — never rely on the prompt alone.
5. Return HTTP 200 with `ai_generated: false` on failure rather than an error, unless a
   fabricated answer would be worse than none (as with the strategy route).
6. Document the agent here.
