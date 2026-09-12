"""
LangChain-powered reward generator for SystemOS.

The Architect — an AI agent that grants a personalized REAL-WORLD REWARD when a
player completes a quest. Rewards are NOT stat items; they are guilt-free real-life
indulgences the player has earned:

  - token  → an ACTIVE leisure / social permission (gaming, friends, an outing, a treat)
  - potion → REST & self-care (a long sleep, a nap, a relaxing unplug)

Rarity (Common → Legendary) scales how generous the indulgence is. Output is always a
strictly validated JSON object. Falls back to a rule-based generator if the LLM call
fails or is misconfigured.
"""

import json
import os
import random
import uuid
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)
load_dotenv()

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate, FewShotChatMessagePromptTemplate
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Output schema (mirrors ApiDynamicItem in the React Native app)
# ---------------------------------------------------------------------------

class RewardOutput(BaseModel):
    type: str = Field(description='"token" (active leisure/social permission) or "potion" (rest & self-care)')
    name: str = Field(description='Reward name in System style, e.g. "Token of Gaming", "Potion of Sleep"')
    description: str = Field(
        description="One cinematic sentence naming the real-world indulgence AND its concrete amount/duration"
    )
    rarity: str = Field(description="One of: Common, Rare, Epic, Legendary")


# ---------------------------------------------------------------------------
# Prompt engineering
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are the Architect, the system coordinator for SystemOS — a privacy-first personal \
growth operating system inspired by Solo Leveling.

Your purpose is to grant ONE real-world REWARD the player has earned by completing a \
quest. Rewards are guilt-free real-life indulgences — NEVER stat items or gear.

### Two reward classes (choose the one that fits):
- token  → an ACTIVE leisure or social permission: play video games, call or meet a \
  friend, watch an episode, enjoy a favorite snack, a short outing, a hobby session.
- potion → REST & self-care: a long peaceful sleep, a nap, a relaxing bath, a quiet \
  unplug, a meditation break.

### Rarity scales how GENEROUS the indulgence is — put a concrete amount/duration in the \
description. Rewards must feel EARNED, not free — keep them lean:
- Common    : tiny      (~10 minutes, or one small treat)
- Rare      : small     (~20 minutes)
- Epic      : moderate  (~30–40 minutes)
- Legendary : generous  (~60 minutes, or one full night's unbroken rest)

### Design principles:
1. Personalize to the player's life (their bio). A gamer earns a Token of Gaming; someone \
   stressed or sleep-deprived earns a Potion of Sleep; a lonely traveler earns a Token of \
   Friendship.
2. The description MUST name the real activity AND its amount/duration in ONE warm, \
   cinematic sentence.
3. System-style, wholesome, motivating. The reward is permission to enjoy life — earned.

### Output Format (CRITICAL):
Return a single raw JSON object. No markdown, no code fences, no explanation.
{{
  "type": "token|potion",
  "name": "string",
  "description": "string",
  "rarity": "string"
}}\
"""

FEW_SHOT_EXAMPLES = [
    {
        "bio": "I'm a software engineer who unwinds with video games but feels guilty taking breaks.",
        "category": "Discipline",
        "rarity": "Epic",
        "output": json.dumps({
            "type": "token",
            "name": "Token of Gaming",
            "description": "Boot up your favorite game and play, entirely guilt-free, for 40 minutes — you earned this run.",
            "rarity": "Epic",
        }),
    },
    {
        "bio": "I'm exhausted and constantly sleep-deprived from overwork. I want to rest better.",
        "category": "Mindfulness",
        "rarity": "Legendary",
        "output": json.dumps({
            "type": "potion",
            "name": "Potion of Deep Slumber",
            "description": "Tonight you sleep without alarms or guilt — a full, unbroken rest to restore body and mind.",
            "rarity": "Legendary",
        }),
    },
    {
        "bio": "I travel for work and miss my friends and partner back home.",
        "category": "Perception",
        "rarity": "Rare",
        "output": json.dumps({
            "type": "token",
            "name": "Token of Friendship",
            "description": "Call a friend or your partner and talk about anything you like for 20 unhurried minutes.",
            "rarity": "Rare",
        }),
    },
]


def _build_prompt() -> ChatPromptTemplate:
    """Constructs the few-shot chat prompt template."""
    example_template = ChatPromptTemplate.from_messages([
        ("human", "Bio: {bio}\nRecent effort: {category}\nRarity: {rarity}"),
        ("ai", "{output}"),
    ])

    few_shot_prompt = FewShotChatMessagePromptTemplate(
        example_prompt=example_template,
        examples=FEW_SHOT_EXAMPLES,
    )

    return ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        few_shot_prompt,
        ("human", "Bio: {bio}\nRecent effort: {category}\nRarity: {rarity}"),
    ])


# ---------------------------------------------------------------------------
# Provider factory
# ---------------------------------------------------------------------------

def _get_llm(model_preference: str, max_tokens: int = 512):
    """
    Returns the appropriate LangChain chat model based on model_preference.
    model_preference: "local" → Ollama, "cloud" → first available cloud key wins,
    in priority order: Groq → Grok (xAI) → Gemini → Anthropic → OpenAI.

    The priority is intentional but the rule is "first key present wins" — so
    swapping providers is just a matter of which key sits in .env. NOTE: Groq
    (GROQ_API_KEY, GroqCloud, fast open models) is distinct from Grok (XAI_API_KEY, xAI).

    max_tokens caps the model's output length. Reward/dungeon generation fits in
    the 512 default; batched campaign quest generation passes a larger value.
    """
    if model_preference == "local":
        try:
            try:
                from langchain_ollama import ChatOllama
            except ImportError:
                from langchain_community.chat_models import ChatOllama
            return ChatOllama(
                model=os.getenv("OLLAMA_MODEL", "llama3"),
                base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
                temperature=0.8,
                num_predict=max_tokens,
            )
        except Exception as e:
            raise RuntimeError(f"Ollama not available: {e}")

    # Cloud mode — try providers in priority order based on available API keys
    groq_key = os.getenv("GROQ_API_KEY")
    xai_key = os.getenv("XAI_API_KEY")
    google_key = os.getenv("GOOGLE_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")

    if groq_key:
        from langchain_groq import ChatGroq
        return ChatGroq(
            model=os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
            api_key=groq_key,
            temperature=0.9,
            max_tokens=max_tokens,
        )

    if xai_key:
        from langchain_xai import ChatXAI
        return ChatXAI(
            model=os.getenv("XAI_MODEL", "grok-2-latest"),
            api_key=xai_key,
            temperature=0.9,
            max_tokens=max_tokens,
        )

    if google_key:
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=os.getenv("GOOGLE_MODEL", "gemini-2.5-flash"),
            google_api_key=google_key,
            temperature=0.9,
            max_output_tokens=max_tokens,
        )

    if anthropic_key:
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(
            model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
            api_key=anthropic_key,
            temperature=0.9,
            max_tokens=max_tokens,
        )

    if openai_key:
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            api_key=openai_key,
            temperature=0.9,
            max_tokens=max_tokens,
        )

    raise RuntimeError(
        "No AI provider configured. Set GROQ_API_KEY, XAI_API_KEY, GOOGLE_API_KEY, "
        "ANTHROPIC_API_KEY, or OPENAI_API_KEY in your .env file (or OLLAMA_BASE_URL for local mode)."
    )


# ---------------------------------------------------------------------------
# Rarity selection
# ---------------------------------------------------------------------------

def _pick_rarity() -> str:
    """
    Rolls reward rarity (only used when the caller doesn't supply one).
    Mirrors rollRewardRarity() in the mobile app's RewardService.ts (the device
    is the source of truth): 2% Legendary | 6% Epic | 22% Rare | 70% Common.
    """
    roll = random.random()
    if roll < 0.02:
        return "Legendary"
    elif roll < 0.08:  # 0.02..0.08 → 6%
        return "Epic"
    elif roll < 0.30:  # 0.08..0.30 → 22%
        return "Rare"
    return "Common"  # 70%


# Minutes granted per rarity tier — keeps the fallback's amounts consistent with the prompt.
_RARITY_MINUTES = {"Common": 10, "Rare": 20, "Epic": 35, "Legendary": 60}


# ---------------------------------------------------------------------------
# Main public function
# ---------------------------------------------------------------------------

def synthesize_fallback_reward(bio: str, category: str, rarity: Optional[str] = None) -> dict:
    """
    Rule-based fallback reward generator (token / potion) when the LLM is unavailable.
    Picks an indulgence themed to the player's bio, scaled by the given (or rolled) rarity.
    """
    bio_lower = (bio or "").lower()
    rarity = rarity if rarity in _RARITY_MINUTES else _pick_rarity()
    minutes = _RARITY_MINUTES[rarity]
    lavish = rarity == "Legendary"

    if any(w in bio_lower for w in ["game", "gaming", "gamer", "play"]):
        reward = ("token", "Token of Gaming", f"Play your favorite game, guilt-free, for {minutes} minutes.")
    elif any(w in bio_lower for w in ["tired", "exhaust", "sleep", "stress", "burnout", "overwork"]):
        reward = (
            "potion",
            "Potion of Deep Slumber",
            "Sleep tonight with no alarms and no guilt — a full, restoring rest."
            if lavish
            else f"Nap or unplug, undisturbed, for {minutes} minutes.",
        )
    elif any(w in bio_lower for w in ["friend", "partner", "girlfriend", "boyfriend", "lonely", "family"]):
        reward = ("token", "Token of Friendship", f"Call or meet someone you care about and talk freely for {minutes} minutes.")
    else:
        pool = [
            ("token", "Token of Indulgence", f"Enjoy a favorite snack or treat you've been putting off."),
            ("potion", "Potion of Stillness", f"Do absolutely nothing but relax for {minutes} minutes."),
            ("token", "Token of Leisure", f"Spend {minutes} minutes on a hobby purely for joy."),
        ]
        reward = random.choice(pool)

    return {
        "item_id": str(uuid.uuid4()),
        "type": reward[0],
        "name": reward[1],
        "description": reward[2],
        "rarity": rarity,
    }


async def generate_reward(
    bio: str,
    category: str,
    model_preference: str = "cloud",
    rarity: Optional[str] = None,
) -> dict:
    """
    Generates a personalized real-world reward (token / potion) using LangChain.

    Returns a dict matching the reward schema (with item_id added).
    Raises RuntimeError on failure — caller should catch and fall back.
    """
    chosen_rarity = rarity or _pick_rarity()

    llm = _get_llm(model_preference)
    prompt = _build_prompt()
    parser = JsonOutputParser(pydantic_object=RewardOutput)

    chain = prompt | llm | parser

    result: dict = await chain.ainvoke({
        "bio": bio or "A motivated individual seeking personal growth.",
        "category": category,
        "rarity": chosen_rarity,
    })

    # Enforce invariants — the model may drift from the instructions.
    if str(result.get("type")) not in ("token", "potion"):
        result["type"] = "token"
    result["rarity"] = chosen_rarity
    if not result.get("name"):
        result["name"] = "Token of Respite"
    if not result.get("description"):
        result["description"] = f"Enjoy a guilt-free {_RARITY_MINUTES[chosen_rarity]}-minute break — you earned it."

    result["item_id"] = str(uuid.uuid4())
    return result
