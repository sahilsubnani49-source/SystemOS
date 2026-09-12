"""
LangChain-powered nutrition advisor for SystemOS.

The Architect, wearing its nutritionist hat — an AI agent that turns a player's body
metrics and current training load into a concrete daily PROTEIN target:

  - height_cm / weight_kg  → body metrics (BMI is computed in Python, never by the LLM)
  - exercises              → the player's active training routine (drives intensity)

Output is always a strictly validated JSON object carrying a daily protein target, a
sensible range around it, the computed BMI + category, and a one-sentence rationale and
tip. Falls back to a rule-based generator if the LLM call fails or is misconfigured.
"""

import os
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
# Output schema (mirrors the nutrition payload the mobile app expects)
# ---------------------------------------------------------------------------

class NutritionOutput(BaseModel):
    daily_protein_g: int = Field(description="Recommended daily protein target in grams")
    range_min_g: int = Field(description="Lower bound of the acceptable daily protein range, in grams")
    range_max_g: int = Field(description="Upper bound of the acceptable daily protein range, in grams")
    bmi: float = Field(description="Body Mass Index (recomputed server-side; value here is advisory)")
    bmi_category: str = Field(description="One of: UNDERWEIGHT, NORMAL, OVERWEIGHT, OBESE")
    rationale: str = Field(description="ONE sentence explaining why this protein target fits the player")
    tip: str = Field(description="ONE actionable sentence to help the player hit the target")


# ---------------------------------------------------------------------------
# BMI + protein tuning
# ---------------------------------------------------------------------------

# Baseline protein anchor per BMI category, in grams per kg of bodyweight.
# A lower BMI leans higher (build), a higher BMI leans lower (lean-mass preservation).
_PROTEIN_BASE_GKG = {
    "UNDERWEIGHT": 2.0,
    "NORMAL": 1.8,
    "OVERWEIGHT": 1.6,
    "OBESE": 1.4,
}
# Extra g/kg granted at full training intensity (everything trained today).
_INTENSITY_BONUS_GKG = 0.2


def compute_bmi(height_cm: float, weight_kg: float) -> tuple[float, str]:
    """
    Compute BMI and its category from height (cm) and weight (kg).

    BMI is ALWAYS computed here in Python — never trusted from the LLM. Returns
    (bmi rounded to 1 decimal, category) where category is one of
    UNDERWEIGHT (<18.5), NORMAL (<25), OVERWEIGHT (<30), OBESE (otherwise).
    """
    bmi = round(weight_kg / (height_cm / 100) ** 2, 1)
    if bmi < 18.5:
        category = "UNDERWEIGHT"
    elif bmi < 25:
        category = "NORMAL"
    elif bmi < 30:
        category = "OVERWEIGHT"
    else:
        category = "OBESE"
    return bmi, category


# ---------------------------------------------------------------------------
# Prompt engineering
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are the Architect, the system coordinator for SystemOS — a privacy-first personal \
growth operating system inspired by Solo Leveling.

Your purpose in THIS step is to set the player's DAILY PROTEIN target (in grams) based \
on their body metrics and current training load. You are given the player's height, \
weight, a PRECOMPUTED BMI and its category, and a compact summary of the routine they \
are training.

### Anchor the protein target to grams per kg of bodyweight by BMI category:
- UNDERWEIGHT : ~2.0 g/kg  (support building mass)
- NORMAL      : ~1.8 g/kg
- OVERWEIGHT  : ~1.6 g/kg
- OBESE       : ~1.4 g/kg  (preserve lean mass while cutting)
Add up to +0.2 g/kg when the player trained hard today (most exercises completed).

### Design principles:
1. Multiply the chosen g/kg by the player's weight in kg to get the daily target.
2. Give a sensible range around the target (roughly ±10%).
3. rationale: ONE sentence tying the target to the player's BMI category and training.
4. tip: ONE actionable sentence to help them hit the target.
5. Speak in the calm, motivating System tone — earned, practical, never preachy.

### Output Format (CRITICAL):
Return a single raw JSON object. No markdown, no code fences, no explanation.
{{
  "daily_protein_g": integer,
  "range_min_g": integer,
  "range_max_g": integer,
  "bmi": number,
  "bmi_category": "UNDERWEIGHT|NORMAL|OVERWEIGHT|OBESE",
  "rationale": "string",
  "tip": "string"
}}\
"""

FEW_SHOT_EXAMPLES = [
    {
        "height_cm": "178",
        "weight_kg": "72",
        "bmi": "22.7",
        "bmi_category": "NORMAL",
        "training_summary": "Push-ups: 25 reps target, day 12, done today\nPlank: 60 seconds target, day 12, done today",
        "output": '{"daily_protein_g": 137, "range_min_g": 123, "range_max_g": 151, "bmi": 22.7, "bmi_category": "NORMAL", "rationale": "Your NORMAL-range BMI and a fully-trained day put you near 1.9 g/kg to fuel steady strength gains.", "tip": "Anchor each of your three main meals with a palm-sized protein source to reach the target without thinking about it."}',
    },
    {
        "height_cm": "170",
        "weight_kg": "82",
        "bmi": "28.4",
        "bmi_category": "OVERWEIGHT",
        "training_summary": "Squats: 20 reps target, day 8, not done today\nWall-sit: 45 seconds target, day 8, done today",
        "output": '{"daily_protein_g": 135, "range_min_g": 122, "range_max_g": 149, "bmi": 28.4, "bmi_category": "OVERWEIGHT", "rationale": "An OVERWEIGHT-range BMI favors ~1.6 g/kg to preserve lean mass while you lean out.", "tip": "Front-load protein at breakfast to curb later cravings and stay inside your range."}',
    },
]


def _format_exercises(exercises: list[dict]) -> str:
    """Render the training routine as a compact, human-readable summary.

    e.g. "Push-ups: 25 reps target, day 12, done today". Used to give the model a
    lightweight view of intensity without dumping raw objects into the prompt.
    """
    if not exercises:
        return "No exercises logged yet."

    lines: list[str] = []
    for ex in exercises:
        name = ex.get("name", "Exercise")
        unit = "reps" if ex.get("mode") == "reps" else "seconds"
        target = ex.get("current_target", 0)
        days = ex.get("days_trained", 0)
        done = "done today" if ex.get("completed_today") else "not done today"
        lines.append(f"{name}: {target} {unit} target, day {days}, {done}")
    return "\n".join(lines)


def _build_prompt() -> ChatPromptTemplate:
    """Constructs the few-shot chat prompt template."""
    human_template = (
        "Height: {height_cm} cm\nWeight: {weight_kg} kg\n"
        "BMI: {bmi} ({bmi_category})\nTraining:\n{training_summary}"
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
_NUTRITION_PROMPT = _build_prompt()
_NUTRITION_PARSER = JsonOutputParser(pydantic_object=NutritionOutput)


# ---------------------------------------------------------------------------
# Rule-based fallback
# ---------------------------------------------------------------------------

def synthesize_fallback_nutrition(height_cm: float, weight_kg: float, exercises: list[dict]) -> dict:
    """
    Rule-based nutrition advice when the LLM is unavailable.

    Canonical formula: base g/kg by BMI category plus an intensity bonus scaled by the
    fraction of exercises completed today; daily target = weight_kg * (base + bonus),
    with a ±10% range. rationale/tip are templated one-liners.
    """
    bmi, category = compute_bmi(height_cm, weight_kg)
    base = _PROTEIN_BASE_GKG[category]

    completed = sum(1 for ex in exercises if ex.get("completed_today"))
    bonus = _INTENSITY_BONUS_GKG * (completed / max(1, len(exercises)))
    gkg = base + bonus

    daily = round(weight_kg * gkg)
    range_min = round(daily * 0.9)
    range_max = round(daily * 1.1)

    rationale = (
        f"Your BMI of {bmi} places you in the {category} range, so about {gkg:.2f} g/kg "
        f"of bodyweight supports your current training and recovery."
    )
    tip = (
        "Spread your protein across 3-4 meals, with a palm-sized protein source at each, "
        "to hit the daily target consistently."
    )

    return {
        "daily_protein_g": daily,
        "range_min_g": range_min,
        "range_max_g": range_max,
        "bmi": bmi,
        "bmi_category": category,
        "rationale": rationale,
        "tip": tip,
    }


# ---------------------------------------------------------------------------
# Main public function
# ---------------------------------------------------------------------------

async def generate_nutrition_advice(
    height_cm: float,
    weight_kg: float,
    exercises: list[dict],
    model_preference: str = "cloud",
) -> dict:
    """
    Generate a personalized daily protein target using LangChain.

    Returns a dict matching the nutrition schema. BMI is always recomputed in Python,
    and protein/range invariants are re-asserted after parsing — the LLM is advisory.
    Raises on chain failure — caller should catch and fall back.
    """
    bmi, category = compute_bmi(height_cm, weight_kg)

    # 512 leaves no margin once a reasoning model spends 300-400 tokens before
    # emitting JSON — the seven-field payload then truncates into the fallback.
    llm = _get_llm(model_preference, max_tokens=1024)
    chain = _NUTRITION_PROMPT | llm | _NUTRITION_PARSER

    result: dict = await chain.ainvoke({
        "height_cm": height_cm,
        "weight_kg": weight_kg,
        "bmi": bmi,
        "bmi_category": category,
        "training_summary": _format_exercises(exercises),
    })

    # BMI is server-authoritative — overwrite whatever the model returned.
    result["bmi"] = bmi
    result["bmi_category"] = category

    # Coerce daily protein to int and clamp into a physiologically sane band.
    try:
        daily = int(round(float(result.get("daily_protein_g"))))
    except (TypeError, ValueError):
        daily = round(weight_kg * _PROTEIN_BASE_GKG[category])
    lo = round(weight_kg * 1.0)
    hi = round(weight_kg * 3.0)
    daily = min(max(daily, lo), hi)
    result["daily_protein_g"] = daily

    # Rebuild the range if it is missing, non-int, or inverted.
    rmin = result.get("range_min_g")
    rmax = result.get("range_max_g")
    if not (isinstance(rmin, int) and isinstance(rmax, int) and rmin <= rmax):
        result["range_min_g"] = round(daily * 0.9)
        result["range_max_g"] = round(daily * 1.1)

    if not result.get("rationale"):
        result["rationale"] = (
            f"Your BMI of {bmi} ({category}) guides a protein target that supports your "
            f"current training load."
        )
    if not result.get("tip"):
        result["tip"] = "Include a protein source at every meal to hit your daily target consistently."

    return result
