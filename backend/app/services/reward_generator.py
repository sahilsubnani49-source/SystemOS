"""
LangChain-powered reward generator for SystemOS.

The Architect — an AI agent that generates personalized RPG items based on:
  - Player biography (open-ended life context)
  - Quest category (Stamina, Intelligence, Mindfulness, etc.)
  - Item rarity (Common / Rare / Epic / Legendary)

Output is always a strictly validated JSON object matching the DynamicItem schema.
Falls back to the rule-based generator if the LLM call fails or is misconfigured.
"""

import json
import os
import random
import uuid
from typing import Optional

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate, FewShotChatMessagePromptTemplate
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Output schema (mirrors ApiDynamicItem in the React Native app)
# ---------------------------------------------------------------------------

class SpecialEffect(BaseModel):
    name: str = Field(description="Name of the unique passive or active ability")
    trigger: str = Field(description="The real-world or in-game action that activates the effect")
    description: str = Field(description="What gameplay benefit the effect provides")


class DynamicItemOutput(BaseModel):
    name: str = Field(description="Unique, contextually-relevant item name")
    description: str = Field(description="RPG-style lore or flavor text")
    rarity: str = Field(description="One of: Common, Rare, Epic, Legendary")
    stat_modifiers: dict[str, int] = Field(
        description="Key-value map of stat boosts. Keys must be from the 8 attributes pool."
    )
    special_effect: Optional[SpecialEffect] = Field(
        default=None,
        description="Only present for Epic and Legendary items"
    )


# ---------------------------------------------------------------------------
# Prompt engineering
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are the Architect, the system coordinator for SystemOS — a privacy-first personal growth \
operating system inspired by Solo Leveling.

Your sole purpose is to design a single, highly personalized RPG reward item for a player \
based on the context they have provided.

### Attributes Pool (only use these exact keys in stat_modifiers):
strength, agility, stamina, intelligence, perception, discipline, creativity, mindfulness

### Rarity → Stat Budget:
- Common    : +1 to +3  total stat points, NO special_effect (set to null)
- Rare      : +4 to +7  total stat points, NO special_effect (set to null)
- Epic      : +8 to +12 total stat points, WITH special_effect
- Legendary : +13 to +20 total stat points, WITH special_effect (must be powerful and meaningful)

### Design Principles:
1. Context-Aware Fit — reflect the player's real life in the item name, description, and stats. \
   If they travel, theme the item around exploration. If they have a partner, weave in connection \
   and communication. If they code, use technology metaphors.
2. Lore & Flavor — write high-quality, inspiring flavor text in the style of Solo Leveling or \
   Elden Ring. Dark, cinematic, immersive.
3. Stat Balance — distribute stat points across 1–3 attributes that make thematic sense. \
   Do not dump all points into one stat.
4. Special Effects (Epic/Legendary only) — must have a real-world trigger tied to player behavior \
   (e.g. "Maintaining a 3-day streak", "Completing quests away from home").

### Output Format (CRITICAL):
You MUST return a single raw JSON object with NO markdown, NO code fences, NO explanation. \
The JSON must match this exact schema:
{{
  "name": "string",
  "description": "string",
  "rarity": "string",
  "stat_modifiers": {{ "attribute": integer }},
  "special_effect": {{ "name": "string", "trigger": "string", "description": "string" }} | null
}}\
"""

# Few-shot examples (from docs/AI_PROMPTS.md)
FEW_SHOT_EXAMPLES = [
    {
        "bio": "I travel frequently for work but struggle with being long-distance from my girlfriend. I want to build habits to stay connected.",
        "category": "Travel / Outdoor",
        "rarity": "Epic",
        "output": json.dumps({
            "name": "Tethered Compass",
            "description": "An ornate brass compass whose needle doesn't point north, but vibrates gently when aligning with the direction of your home.",
            "rarity": "Epic",
            "stat_modifiers": {"perception": 6, "mindfulness": 4},
            "special_effect": {
                "name": "Resonance Loop",
                "trigger": "Completing a travel or call-home habit check-in",
                "description": "Reduces fatigue stats by 15% and increases relationship dungeon gains for 24 hours."
            }
        })
    },
    {
        "bio": "I am a software engineer who spends 12 hours a day sitting. I want to build a routine of running and stretching.",
        "category": "Fitness / Health",
        "rarity": "Legendary",
        "output": json.dumps({
            "name": "Aegis of the Sedentary Sage",
            "description": "A lightweight glowing wristband that hums with kinetic energy, converting real-world steps into virtual defense metrics.",
            "rarity": "Legendary",
            "stat_modifiers": {"stamina": 8, "agility": 5, "discipline": 3},
            "special_effect": {
                "name": "Ergonomic Aura",
                "trigger": "Maintaining a 5-day stretching streak",
                "description": "Cleanses all Burnout status effects and increases experience gains by 10% on your next coding quest."
            }
        })
    },
    {
        "bio": "I am trying to meditate every morning and journal at night to improve my mental clarity.",
        "category": "Mindfulness",
        "rarity": "Rare",
        "output": json.dumps({
            "name": "Lens of Still Waters",
            "description": "A simple glass lens ground from a frozen lake at dawn. Those who peer through it see only the present moment.",
            "rarity": "Rare",
            "stat_modifiers": {"mindfulness": 4, "discipline": 2},
            "special_effect": None
        })
    },
]


def _build_prompt() -> ChatPromptTemplate:
    """Constructs the few-shot chat prompt template."""
    example_template = ChatPromptTemplate.from_messages([
        ("human", "Bio: {bio}\nCategory: {category}\nRarity: {rarity}"),
        ("ai", "{output}"),
    ])

    few_shot_prompt = FewShotChatMessagePromptTemplate(
        example_prompt=example_template,
        examples=FEW_SHOT_EXAMPLES,
    )

    return ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        few_shot_prompt,
        ("human", "Bio: {bio}\nCategory: {category}\nRarity: {rarity}"),
    ])


# ---------------------------------------------------------------------------
# Provider factory
# ---------------------------------------------------------------------------

def _get_llm(model_preference: str):
    """
    Returns the appropriate LangChain chat model based on model_preference.
    model_preference: "local" → Ollama, "cloud" → tries Anthropic → OpenAI → Gemini
    """
    if model_preference == "local":
        try:
            from langchain_community.chat_models import ChatOllama
            return ChatOllama(
                model=os.getenv("OLLAMA_MODEL", "llama3"),
                base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
                temperature=0.8,
            )
        except Exception as e:
            raise RuntimeError(f"Ollama not available: {e}")

    # Cloud mode — try providers in priority order based on available API keys
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    google_key = os.getenv("GOOGLE_API_KEY")

    if anthropic_key:
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(
            model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
            api_key=anthropic_key,
            temperature=0.9,
            max_tokens=512,
        )

    if openai_key:
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            api_key=openai_key,
            temperature=0.9,
            max_tokens=512,
        )

    if google_key:
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=os.getenv("GOOGLE_MODEL", "gemini-1.5-flash"),
            google_api_key=google_key,
            temperature=0.9,
            max_output_tokens=512,
        )

    raise RuntimeError(
        "No AI provider configured. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY "
        "in your .env file (or OLLAMA_BASE_URL for local mode)."
    )


# ---------------------------------------------------------------------------
# Rarity selection
# ---------------------------------------------------------------------------

def _pick_rarity() -> str:
    """
    Rolls item rarity:
      15% Legendary | 35% Epic | 35% Rare | 15% Common
    """
    roll = random.random()
    if roll < 0.15:
        return "Legendary"
    elif roll < 0.50:
        return "Epic"
    elif roll < 0.85:
        return "Rare"
    return "Common"


# ---------------------------------------------------------------------------
# Main public function
# ---------------------------------------------------------------------------

def synthesize_fallback_reward(bio: str, category: str) -> dict:
    """
    Rule-based fallback reward generator.
    Used when the LLM is unavailable or misconfigured.
    Mirrors the original synthesize_dynamic_reward() logic from main.py.
    """
    import random

    bio_lower = bio.lower()
    has_relationship = any(w in bio_lower for w in ["girlfriend", "partner", "relationship"])
    likes_travel = any(w in bio_lower for w in ["travel", "cities", "exploration", "wandering"])
    likes_coding = any(w in bio_lower for w in ["code", "programming", "engineer"])

    roll = random.random()
    rarity = "Legendary" if roll < 0.15 else "Epic" if roll < 0.50 else "Rare"

    if likes_travel and category in ("Perception", "Stamina"):
        name = "Amulet of the Remote Horizon" if has_relationship else "Vagabond's Wayfinder"
        description = "A floating mechanical compass whose lens projects holographic warmth of your distant loved one." if has_relationship else "A glowing kinetic gyroscope that spins faster in unfamiliar territory."
        stat_modifiers = {"perception": 6, "mindfulness": 4} if has_relationship else {"perception": 7, "agility": 3}
        effect = {"name": "Tethered Pulse", "trigger": "When completing quests far from home", "description": "Gain +10% XP on physical and mental categories."} if has_relationship else {"name": "Wandering Sight", "trigger": "Entering a new city", "description": "Increases passive gold acquisition by 15%."}
    elif has_relationship and category == "Mindfulness":
        name, description = "Locket of Heartsbound Resonance", "A warm crystal pendant pulsing in harmony with your partner's breathing."
        stat_modifiers = {"mindfulness": 8, "discipline": 2}
        effect = {"name": "Sympathy Shield", "trigger": "Maintaining a 3-day communication streak", "description": "Prevents fatigue from dropping below baseline."}
    elif likes_coding and category == "Intelligence":
        name, description = "Sigil of Compile-Time Flow", "A circuit-etched obsidian ring that hums during deep analytical states."
        stat_modifiers = {"intelligence": 8, "discipline": 4}
        effect = {"name": "Logic Loop", "trigger": "Completing consecutive coding challenges", "description": "Increases creativity stats by +5 during optimization windows."}
    else:
        pool = [("Shadow Dagger", "A dark steel blade forged in shadow flames.", "strength"), ("Elixir of Mana Flow", "A cyan vial shimmering with clean energy.", "intelligence"), ("Steel Boots of Discipline", "Heavy plate boots enforcing step tracking.", "stamina")]
        base = random.choice(pool)
        name, description = f"Ascendant {base[0]}", base[1]
        stat_modifiers = {base[2]: 5}
        effect = {"name": "Ascendancy Boost", "trigger": "Equipping this item", "description": f"Provides +5 to {base[2]}."}

    if rarity == "Rare":
        effect = None
        stat_modifiers = {k: max(1, v - 2) for k, v in stat_modifiers.items()}

    return {
        "item_id": str(uuid.uuid4()),
        "name": name,
        "description": description,
        "rarity": rarity,
        "stat_modifiers": stat_modifiers,
        "special_effect": effect,
    }


async def generate_reward(
    bio: str,
    category: str,
    model_preference: str = "cloud",
    rarity: Optional[str] = None,
) -> dict:
    """
    Generates a personalized DynamicItem using LangChain.

    Returns a dict matching the DynamicItem schema (with item_id added).
    Raises RuntimeError on failure — caller should catch and fall back.
    """
    chosen_rarity = rarity or _pick_rarity()

    llm = _get_llm(model_preference)
    prompt = _build_prompt()
    parser = JsonOutputParser(pydantic_object=DynamicItemOutput)

    chain = prompt | llm | parser

    result: dict = await chain.ainvoke({
        "bio": bio or "A motivated individual seeking personal growth.",
        "category": category,
        "rarity": chosen_rarity,
    })

    # Enforce rarity consistency (model may ignore the instruction)
    result["rarity"] = chosen_rarity

    # Remove special_effect for Common/Rare even if model hallucinated one
    if chosen_rarity in ("Common", "Rare"):
        result["special_effect"] = None

    # Ensure special_effect exists for Epic/Legendary
    if chosen_rarity in ("Epic", "Legendary") and not result.get("special_effect"):
        result["special_effect"] = {
            "name": "Ascendant Surge",
            "trigger": "Equipping this item",
            "description": f"Grants a passive boost to all stats associated with {category}."
        }

    result["item_id"] = str(uuid.uuid4())
    return result
