import uuid
import logging
from contextlib import asynccontextmanager
from typing import Dict, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.services.reward_generator import generate_reward, synthesize_fallback_reward
from app.services.quest_generator import generate_quests, synthesize_fallback_quests

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("systemos")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("[SystemOS] Backend online. Architect standing by.")
    yield
    logger.info("[SystemOS] Backend shutting down.")


app = FastAPI(
    title="SystemOS Backend",
    description="A privacy-first, offline-first personal growth operating system engine.",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# In-memory state (mock store — replace with a real DB for production)
# ---------------------------------------------------------------------------

player_state = {
    "id": "1",
    "name": "Sung Jin-Woo",
    "rank": "E-Rank",
    "level": 1,
    "experience": 75,
    "experience_to_next_level": 100,
    "bio": "I travel frequently for work but struggle with being long-distance from my girlfriend. I want to build habits to stay connected.",
    "aspirations": "",
    "model_preference": "cloud",
    "stats": {
        "strength": 10,
        "agility": 10,
        "stamina": 10,
        "intelligence": 10,
        "perception": 10,
        "discipline": 10,
        "creativity": 10,
        "mindfulness": 10,
    },
}

quests_state = [
    {"id": "1", "title": "Daily Warm-up (10k steps)", "category": "Stamina", "difficulty": "E", "xp_reward": 15, "gold_reward": 100, "is_completed": False},
    {"id": "2", "title": "Maintain Relationship Focus (Call Partner)", "category": "Mindfulness", "difficulty": "D", "xp_reward": 20, "gold_reward": 250, "is_completed": False},
    {"id": "3", "title": "Explore Local Cities (Find new cafe)", "category": "Perception", "difficulty": "C", "xp_reward": 30, "gold_reward": 500, "is_completed": False},
]

inventory_state: List[dict] = []

# ---------------------------------------------------------------------------
# Pydantic request/response models
# ---------------------------------------------------------------------------

class ProfileUpdateRequest(BaseModel):
    bio: str
    aspirations: Optional[str] = ""
    model_preference: Optional[str] = "cloud"


class QuestGenerateRequest(BaseModel):
    quest_count: Optional[int] = 5


class SpecialEffect(BaseModel):
    name: str
    trigger: str
    description: str


class DynamicItem(BaseModel):
    item_id: str
    name: str
    description: str
    rarity: str
    stat_modifiers: Dict[str, int]
    special_effect: Optional[SpecialEffect] = None


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
async def health_check():
    return {"status": "healthy", "system": "SystemOS Backend", "version": "0.2.0"}


@app.get("/api/profile")
async def get_profile():
    return player_state


@app.post("/api/profile")
async def update_profile(req: ProfileUpdateRequest):
    player_state["bio"] = req.bio
    player_state["aspirations"] = req.aspirations or ""
    player_state["model_preference"] = req.model_preference
    return {"status": "success", "profile": player_state}


@app.get("/api/quests")
async def get_quests():
    return quests_state


@app.post("/api/quests/generate")
async def generate_quests_endpoint(req: QuestGenerateRequest):
    """
    Calls the LangChain Quest Master with the player's bio + aspirations.
    Replaces quests_state with AI-generated quests.
    Falls back to the rule-based generator if the LLM fails.
    """
    global quests_state

    from datetime import datetime, timezone

    bio = player_state["bio"]
    aspirations = player_state["aspirations"]
    level = player_state["level"]
    model_preference = player_state["model_preference"]
    quest_count = req.quest_count or 5
    ai_generated = False

    try:
        logger.info(f"[Quest Master] Generating {quest_count} quests for level={level} model={model_preference}")
        new_quests = await generate_quests(
            bio=bio,
            aspirations=aspirations,
            level=level,
            model_preference=model_preference,
            quest_count=quest_count,
        )
        ai_generated = True
        logger.info(f"[Quest Master] Generated {len(new_quests)} quests via AI.")
    except Exception as e:
        logger.warning(f"[Quest Master] AI generation failed ({e}). Using rule-based fallback.")
        new_quests = synthesize_fallback_quests(aspirations, quest_count)

    quests_state = new_quests

    return {
        "quests": quests_state,
        "ai_generated": ai_generated,
        "generation_context": {
            "aspirations_used": aspirations,
            "bio_used": bio,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "model_used": model_preference,
        },
    }


@app.post("/api/quests/{quest_id}/complete")
async def complete_quest(quest_id: str):
    """
    Marks a quest as completed, applies XP/level-up, and generates a
    context-aware reward item via the LangChain Architect agent.
    Falls back to the rule-based generator if AI is unavailable.
    """
    global player_state

    # 1. Validate quest
    quest = next((q for q in quests_state if q["id"] == quest_id), None)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    if quest["is_completed"]:
        raise HTTPException(status_code=400, detail="Quest already completed")

    # 2. Mark complete
    quest["is_completed"] = True

    # 3. Apply XP + level-up
    xp_gained = quest["xp_reward"]
    player_state["experience"] += xp_gained

    level_up = False
    if player_state["experience"] >= player_state["experience_to_next_level"]:
        level_up = True
        player_state["level"] += 1
        player_state["experience"] -= player_state["experience_to_next_level"]
        player_state["experience_to_next_level"] = int(player_state["experience_to_next_level"] * 1.5)
        for stat in player_state["stats"]:
            player_state["stats"][stat] += 1

    # 4. Generate reward — LangChain first, rule-based fallback
    reward_dict: dict
    ai_generated = False

    try:
        logger.info(f"[Architect] Generating reward for category={quest['category']} model={player_state['model_preference']}")
        reward_dict = await generate_reward(
            bio=player_state["bio"],
            category=quest["category"],
            model_preference=player_state["model_preference"],
        )
        ai_generated = True
        logger.info(f"[Architect] AI reward generated: {reward_dict['name']} ({reward_dict['rarity']})")
    except Exception as e:
        logger.warning(f"[Architect] AI generation failed ({e}). Using rule-based fallback.")
        reward_dict = synthesize_fallback_reward(player_state["bio"], quest["category"])

    inventory_state.append(reward_dict)

    # 5. Return response
    return {
        "status": "success",
        "quest_completed": quest["title"],
        "xp_gained": xp_gained,
        "level_up": level_up,
        "new_level": player_state["level"],
        "new_exp": player_state["experience"],
        "new_exp_required": player_state["experience_to_next_level"],
        "reward_item": reward_dict,
        "ai_generated": ai_generated,
    }


@app.get("/api/inventory")
async def get_inventory():
    return inventory_state


@app.post("/api/quests/reset")
async def reset_quests():
    """Dev utility — resets all state."""
    global quests_state, inventory_state, player_state
    inventory_state.clear()
    player_state["level"] = 1
    player_state["experience"] = 75
    player_state["experience_to_next_level"] = 100
    player_state["stats"] = {k: 10 for k in player_state["stats"]}
    for q in quests_state:
        q["is_completed"] = False
    return {"status": "reset_success"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
