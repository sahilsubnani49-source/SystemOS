import uuid
import logging
from contextlib import asynccontextmanager
from typing import Dict, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app import db, auth
from app.auth import get_current_user
from app.services.reward_generator import generate_reward, synthesize_fallback_reward
from app.services.quest_generator import (
    generate_goal_campaign,
    generate_dungeon,
    generate_campaign_strategy,
)
from app.services.nutrition_advisor import (
    generate_nutrition_advice,
    synthesize_fallback_nutrition,
)
from app.services.task_describer import (
    generate_task_description,
    synthesize_fallback_task_description,
)

from pathlib import Path

# Load environment variables relative to backend root
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("systemos")


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    auth.set_defaults(DEFAULT_PLAYER_STATE, DEFAULT_QUESTS_STATE, DEFAULT_INVENTORY_STATE)
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
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)

# ---------------------------------------------------------------------------
# Default state templates
# ---------------------------------------------------------------------------
# These are the seed used to populate a new user's per-user state at signup. They are
# NOT shared mutable global state — every user gets a deep copy in the SQLite store, and
# all reads/writes go through app.db.get_user_state / save_user_state.

DEFAULT_PLAYER_STATE = {
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

DEFAULT_QUESTS_STATE = [
    {"id": "1", "title": "Daily Warm-up (10k steps)", "category": "Stamina", "difficulty": "E", "xp_reward": 15, "gold_reward": 100, "is_completed": False},
    {"id": "2", "title": "Maintain Relationship Focus (Call Partner)", "category": "Mindfulness", "difficulty": "D", "xp_reward": 20, "gold_reward": 250, "is_completed": False},
    {"id": "3", "title": "Explore Local Cities (Find new cafe)", "category": "Perception", "difficulty": "C", "xp_reward": 30, "gold_reward": 500, "is_completed": False},
]

DEFAULT_INVENTORY_STATE: List[dict] = []

# ---------------------------------------------------------------------------
# Pydantic request/response models
# ---------------------------------------------------------------------------

class ProfileUpdateRequest(BaseModel):
    bio: str
    aspirations: Optional[str] = ""
    model_preference: Optional[str] = "cloud"


class GoalPlanRequest(BaseModel):
    """Input for the goal-driven campaign pipeline."""
    goal: str = Field(min_length=1, description="What the player wants to achieve")
    context: Optional[str] = Field(default="", description="Open-ended life context shaping the quests")
    duration_days: int = Field(default=30, ge=1, le=120, description="Timeline the campaign spans")
    level: int = Field(default=1, ge=1, description="Player level for difficulty calibration")
    model_preference: Optional[str] = "cloud"
    quests_per_day: int = Field(default=2, ge=1, le=5)
    approved_plan: Optional[str] = None


class GoalStrategyRequest(BaseModel):
    """Input for the Stage-1 strategy step — plan preview / revision before structuring."""
    goal: str = Field(min_length=1)
    context: Optional[str] = Field(default="")
    duration_days: int = Field(default=30, ge=1, le=120)
    level: int = Field(default=1, ge=1)
    model_preference: Optional[str] = "cloud"
    quests_per_day: int = Field(default=2, ge=1, le=5)
    previous_plan: Optional[str] = None   # present → revision mode
    feedback: Optional[str] = None


class NutritionExercise(BaseModel):
    name: str
    mode: str                      # "reps" | "seconds"
    current_target: int
    days_trained: int
    completed_today: bool


class NutritionRequest(BaseModel):
    height_cm: float = Field(ge=100, le=250)
    weight_kg: float = Field(ge=25, le=300)
    exercises: List[NutritionExercise] = []
    model_preference: Optional[str] = "cloud"


class TaskQuest(BaseModel):
    """One of today's quests, as the device sees it."""
    title: str
    description: Optional[str] = ""
    difficulty: str = "E"
    is_completed: bool = False
    # True once the Hunter has accepted it — the strongest signal for what they're on.
    is_accepted: bool = False


class TaskDescribeRequest(BaseModel):
    """Input for narrating a running focus timer from its tagged campaign."""
    goal_title: str = Field(min_length=1, max_length=200)
    context: Optional[str] = ""
    plan_excerpt: Optional[str] = ""
    quests: List[TaskQuest] = []
    model_preference: Optional[str] = "cloud"


class DungeonGenerateRequest(BaseModel):
    """Input for on-demand mock-exam dungeon generation (earned via keys)."""
    goal: str = Field(min_length=1)
    context: Optional[str] = ""
    level: int = Field(default=1, ge=1)
    model_preference: Optional[str] = "cloud"


class CompleteQuestRequest(BaseModel):
    """Optional body for quest completion.

    The new goal flow is stateless — quests live on the device, not in the server's
    mock `quests_state`. When the quest_id is unknown to the server, these fields let
    the Architect still generate context-aware loot.
    """
    category: Optional[str] = None
    bio: Optional[str] = None
    model_preference: Optional[str] = None
    # The device decides the drop rarity (and whether a reward drops at all), so it
    # passes the rolled rarity here. If absent, the server rolls its own.
    rarity: Optional[str] = None


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


@app.get("/health/llm")
async def llm_health_check(model_preference: str = "cloud"):
    """
    Verify the configured LLM provider actually responds, with a minimal
    one-word ping. Instantiating the model alone is not enough — a missing
    Ollama server or a revoked API key only surfaces on a real call.
    """
    from app.services.reward_generator import _get_llm

    try:
        llm = _get_llm(model_preference, max_tokens=8)
        result = await llm.ainvoke("Reply with exactly one word: pong")
        return {
            "status": "ok",
            "provider": type(llm).__name__,
            "reply": str(result.content)[:40],
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"LLM unavailable: {e}")


@app.get("/api/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    state = db.get_user_state(user["id"])
    return state["player"]


@app.post("/api/profile")
async def update_profile(req: ProfileUpdateRequest, user: dict = Depends(get_current_user)):
    state = db.get_user_state(user["id"])
    player = state["player"]
    player["bio"] = req.bio
    player["aspirations"] = req.aspirations or ""
    player["model_preference"] = req.model_preference
    db.save_user_state(user["id"], player, state["quests"], state["inventory"])
    return {"status": "success", "profile": player}


@app.get("/api/quests")
async def get_quests(user: dict = Depends(get_current_user)):
    state = db.get_user_state(user["id"])
    return state["quests"]


@app.post("/api/goals/strategy")
async def plan_strategy(req: GoalStrategyRequest, user: dict = Depends(get_current_user)):
    """
    The Architect (Stage 1) — turns a GOAL + TIMELINE into a strategy blueprint the
    player can preview, approve, or refine before the full structuring pass runs.

    Revision mode: if `previous_plan` is present, the strategy is rewritten to apply
    `feedback`. No internal fallback in the service, so on any failure this returns an
    empty plan with ai_generated=False — the client treats that as "Architect unreachable".
    """
    logger.info(
        "[Architect] Strategy goal=%r duration=%d level=%d revision=%s model=%s",
        req.goal, req.duration_days, req.level, bool(req.previous_plan), req.model_preference,
    )
    try:
        plan = await generate_campaign_strategy(
            goal=req.goal,
            context=req.context or "",
            duration_days=req.duration_days,
            level=req.level,
            model_preference=req.model_preference or "cloud",
            quests_per_day=req.quests_per_day,
            previous_plan=req.previous_plan,
            feedback=req.feedback,
        )
        return {"plan": plan, "ai_generated": True}
    except Exception as e:
        logger.warning("[Architect] Strategy generation failed (%s). Returning empty plan.", e)
        return {"plan": "", "ai_generated": False}


@app.post("/api/goals/plan")
async def plan_goal(req: GoalPlanRequest, user: dict = Depends(get_current_user)):
    """
    The Quest Master — turns a GOAL + TIMELINE into a full campaign of dated quests
    via the three-stage pipeline (plan → schedule → structure-in-weekly-batches).

    Stateless: the campaign is returned for the device to persist. The pipeline has
    its own deterministic fallback, so this always returns a full set of dated quests.
    """
    from datetime import datetime, timezone

    logger.info(
        "[Quest Master] Planning campaign goal=%r duration=%d level=%d model=%s",
        req.goal, req.duration_days, req.level, req.model_preference,
    )
    result = await generate_goal_campaign(
        goal=req.goal,
        context=req.context or "",
        duration_days=req.duration_days,
        level=req.level,
        model_preference=req.model_preference or "cloud",
        quests_per_day=req.quests_per_day,
        approved_plan=req.approved_plan,
    )

    # An empty plan string means the pipeline degraded to the rule-based fallback.
    ai_generated = bool(result.get("plan"))
    logger.info(
        "[Quest Master] Campaign ready: %d quests across %d days (ai=%s).",
        len(result["quests"]), req.duration_days, ai_generated,
    )

    return {
        "plan": result["plan"],
        "schedule": result["schedule"],
        "quests": result["quests"],
        "goal_title": req.goal,
        "duration_days": req.duration_days,
        "ai_generated": ai_generated,
        "generation_context": {
            "goal_used": req.goal,
            "context_used": req.context or "",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "model_used": req.model_preference or "cloud",
        },
    }


@app.post("/api/dungeons/generate")
async def generate_dungeon_endpoint(req: DungeonGenerateRequest, user: dict = Depends(get_current_user)):
    """
    The Gatekeeper — generates a single mock-exam Dungeon for the player's goal.
    Called on-demand when the device awards a dungeon key (21 completed days).
    Has a deterministic fallback, so it always returns a dungeon.
    """
    logger.info("[Gatekeeper] Generating dungeon for goal=%r level=%d", req.goal, req.level)
    dungeon = await generate_dungeon(
        goal=req.goal,
        context=req.context or "",
        level=req.level,
        model_preference=req.model_preference or "cloud",
    )
    return {"dungeon": dungeon}


@app.post("/api/nutrition/protein")
async def nutrition_protein(req: NutritionRequest, user: dict = Depends(get_current_user)):
    """
    The Nutritionist — computes a personalized daily protein target from the player's
    body metrics + training load. Degrades in place: on AI failure it returns the
    deterministic rule-based estimate (mirrors the reward endpoint), always HTTP 200.
    """
    exercises = [e.model_dump() for e in req.exercises]
    try:
        logger.info(
            "[Nutritionist] Protein advice height=%.1f weight=%.1f exercises=%d model=%s",
            req.height_cm, req.weight_kg, len(exercises), req.model_preference,
        )
        result = await generate_nutrition_advice(
            req.height_cm,
            req.weight_kg,
            exercises,
            req.model_preference or "cloud",
        )
        result["ai_generated"] = True
        return result
    except Exception as e:
        logger.warning("[Nutritionist] AI generation failed (%s). Using rule-based fallback.", e)
        result = synthesize_fallback_nutrition(req.height_cm, req.weight_kg, exercises)
        result["ai_generated"] = False
        return result


@app.post("/api/tasks/describe")
async def describe_task(req: TaskDescribeRequest, user: dict = Depends(get_current_user)):
    """
    The Architect, narrating the work — turns a campaign plus today's quests into ONE
    task line for the Army tab's focus timer. Degrades in place: on AI failure it
    returns the deterministic template the device also uses offline, always HTTP 200.

    Stateless: nothing here is persisted. The device already started the timer before
    calling this, so a slow or failed response only forgoes an upgrade to the line.
    """
    quests = [q.model_dump() for q in req.quests]
    try:
        logger.info(
            "[Architect] Task description goal=%s quests=%d model=%s",
            req.goal_title, len(quests), req.model_preference,
        )
        result = await generate_task_description(
            req.goal_title,
            req.context or "",
            req.plan_excerpt or "",
            quests,
            req.model_preference or "cloud",
        )
        result["ai_generated"] = True
        return result
    except Exception as e:
        logger.warning("[Architect] Task description failed (%s). Using template.", e)
        result = synthesize_fallback_task_description(req.goal_title, req.context or "", quests)
        result["ai_generated"] = False
        return result


@app.post("/api/quests/{quest_id}/complete")
async def complete_quest(
    quest_id: str,
    req: Optional[CompleteQuestRequest] = None,
    user: dict = Depends(get_current_user),
):
    """
    Generates a context-aware reward item via the LangChain Architect agent.

    Two modes:
      • Legacy mock mode — if quest_id exists in the user's quests, marks it complete
        and applies server-side XP/level-up (unchanged behavior).
      • Stateless goal mode — if quest_id is unknown (quests live on the device), uses
        the optional request body (category, bio, model_preference) to generate loot
        without mutating the persisted quest set.
    """
    state = db.get_user_state(user["id"])
    player_state = state["player"]
    quests_state = state["quests"]
    inventory_state = state["inventory"]

    quest = next((q for q in quests_state if q["id"] == quest_id), None)
    body = req or CompleteQuestRequest()

    # Resolve generation inputs: request body wins, then the mock quest, then defaults.
    category = body.category or (quest["category"] if quest else None)
    if not category:
        raise HTTPException(
            status_code=400,
            detail="Unknown quest_id — provide `category` in the request body to generate a reward.",
        )
    bio = body.bio or player_state["bio"]
    model_preference = body.model_preference or player_state["model_preference"]

    # Legacy mock-state path: mark complete + apply server XP/level-up.
    xp_gained = 0
    level_up = False
    quest_title = "Quest"
    if quest:
        if quest["is_completed"]:
            raise HTTPException(status_code=400, detail="Quest already completed")
        quest["is_completed"] = True
        quest_title = quest["title"]
        xp_gained = quest["xp_reward"]
        player_state["experience"] += xp_gained
        while player_state["experience"] >= player_state["experience_to_next_level"]:
            level_up = True
            player_state["level"] += 1
            player_state["experience"] -= player_state["experience_to_next_level"]
            player_state["experience_to_next_level"] = int(player_state["experience_to_next_level"] * 1.5)
            for stat in player_state["stats"]:
                player_state["stats"][stat] += 1

    # Generate reward — LangChain first, rule-based fallback.
    reward_dict: dict
    ai_generated = False
    try:
        logger.info("[Architect] Generating reward for category=%s model=%s", category, model_preference)
        reward_dict = await generate_reward(
            bio=bio,
            category=category,
            model_preference=model_preference,
            rarity=body.rarity,
        )
        ai_generated = True
        logger.info("[Architect] AI reward generated: %s (%s)", reward_dict["name"], reward_dict["rarity"])
    except Exception as e:
        logger.warning("[Architect] AI generation failed (%s). Using rule-based fallback.", e)
        reward_dict = synthesize_fallback_reward(bio, category, body.rarity)

    inventory_state.append(reward_dict)

    db.save_user_state(user["id"], player_state, quests_state, inventory_state)

    return {
        "status": "success",
        "quest_completed": quest_title,
        "xp_gained": xp_gained,
        "level_up": level_up,
        "new_level": player_state["level"],
        "new_exp": player_state["experience"],
        "new_exp_required": player_state["experience_to_next_level"],
        "reward_item": reward_dict,
        "ai_generated": ai_generated,
    }


@app.get("/api/inventory")
async def get_inventory(user: dict = Depends(get_current_user)):
    state = db.get_user_state(user["id"])
    return state["inventory"]


@app.post("/api/quests/reset")
async def reset_quests(user: dict = Depends(get_current_user)):
    """Dev utility — resets the caller's state to defaults."""
    state = db.get_user_state(user["id"])
    player_state = state["player"]
    quests_state = state["quests"]

    inventory_state: List[dict] = []
    player_state["level"] = 1
    player_state["experience"] = 75
    player_state["experience_to_next_level"] = 100
    player_state["stats"] = {k: 10 for k in player_state["stats"]}
    for q in quests_state:
        q["is_completed"] = False

    db.save_user_state(user["id"], player_state, quests_state, inventory_state)
    return {"status": "reset_success"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
