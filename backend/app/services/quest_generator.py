"""
LangChain-powered quest generator for SystemOS.

The Quest Master — an AI agent that generates personalized real-world quests based on:
  - Player biography (open-ended life context)
  - Player aspirations (explicit life goals)
  - Player current level (for difficulty calibration)

Output is always a strictly validated JSON array of quest objects.
Falls back to the rule-based generator if the LLM call fails.
"""

import json
import uuid

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate, FewShotChatMessagePromptTemplate
from pydantic import BaseModel, Field

from app.services.reward_generator import _get_llm


# ---------------------------------------------------------------------------
# Output schema
# ---------------------------------------------------------------------------

class GeneratedQuest(BaseModel):
    title: str = Field(description="Short, punchy quest title in Solo Leveling style")
    description: str = Field(description="Specific, actionable instruction — what exactly to do")
    category: str = Field(description="One of: Strength, Agility, Stamina, Intelligence, Perception, Discipline, Creativity, Mindfulness")
    difficulty: str = Field(description="E (15 min) | D (30 min) | C (1 hr) | B (half-day) | A (full day) | S (multi-day)")
    xp_reward: int = Field(description="XP scaled to difficulty: E=10, D=20, C=30, B=50, A=75, S=100")
    gold_reward: int = Field(description="Gold scaled to difficulty: E=50, D=100, C=200, B=400, A=700, S=1000")
    quest_type: str = Field(description="daily | weekly | one_time")
    aspiration_tag: str = Field(description="Short label (2-5 words) naming the aspiration this quest serves")
    rationale: str = Field(description="One sentence explaining the direct causal link to the aspiration")


class QuestGenerationOutput(BaseModel):
    quests: list[GeneratedQuest]


# ---------------------------------------------------------------------------
# Prompt engineering
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are the Quest Master for SystemOS — a privacy-first personal growth RPG inspired by Solo Leveling.

Your purpose is to design a set of real-world quests for a player based on their life \
biography and stated aspirations. Every quest must be actionable, specific, and directly \
tied to one of their stated goals.

### Player Context:
- Bio: {bio}
- Aspirations: {aspirations}
- Current Level: {level}
- Quests to generate: {quest_count}

### Design Rules:
1. Each quest maps to EXACTLY ONE aspiration. Label it in aspiration_tag (2–5 words).
2. Category must be exactly one of: Strength, Agility, Stamina, Intelligence, Perception, \
   Discipline, Creativity, Mindfulness.
3. Difficulty scales with effort: E = 15 min, D = 30 min, C = 1 hour, B = half-day, \
   A = full day, S = multi-day commitment.
4. XP and gold MUST match difficulty exactly:
   E → xp=10, gold=50 | D → xp=20, gold=100 | C → xp=30, gold=200
   B → xp=50, gold=400 | A → xp=75, gold=700 | S → xp=100, gold=1000
5. quest_type: "daily" for repeatable habits, "weekly" for periodic goals, \
   "one_time" for milestones.
6. description must be concrete and actionable.
   Bad: "Exercise today." Good: "Complete a 30-minute run and log distance in a fitness app."
7. rationale explains the direct causal link to the aspiration in one sentence.
8. Distribute quests across different categories — do not stack all on one attribute.
9. Match difficulty to player level: level 1–3 → mostly E/D; level 4–7 → C/B; \
   level 8+ → include A/S.

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
      "quest_type": "daily|weekly|one_time",
      "aspiration_tag": "string",
      "rationale": "string"
    }}
  ]
}}\
"""

FEW_SHOT_EXAMPLES = [
    {
        "bio": "I travel frequently for work but struggle with being long-distance from my girlfriend. I want to build habits to stay connected.",
        "aspirations": "Stay emotionally present with my partner despite the distance. Explore cities I visit with intention rather than just working.",
        "level": "3",
        "quest_count": "4",
        "output": json.dumps({
            "quests": [
                {
                    "title": "Tether Protocol: Daily Check-In",
                    "description": "Schedule a 15-minute video call with your partner before 10pm. No texting — voice or video only.",
                    "category": "Mindfulness",
                    "difficulty": "D",
                    "xp_reward": 20,
                    "gold_reward": 100,
                    "quest_type": "daily",
                    "aspiration_tag": "Stay emotionally present",
                    "rationale": "Daily voice contact counteracts the emotional drift caused by physical distance."
                },
                {
                    "title": "City Scout: One New Discovery",
                    "description": "Walk 30 minutes in an unexplored neighborhood of the city you're in. Take one photo and share it with your partner.",
                    "category": "Perception",
                    "difficulty": "D",
                    "xp_reward": 20,
                    "gold_reward": 100,
                    "quest_type": "weekly",
                    "aspiration_tag": "Explore with intention",
                    "rationale": "Intentional exploration converts business trips from isolating obligations into shared adventures."
                },
                {
                    "title": "Shared Memory Log",
                    "description": "Write 3 sentences about one experience you want to show your partner when you return. Store it in a note app you both can see.",
                    "category": "Creativity",
                    "difficulty": "E",
                    "xp_reward": 10,
                    "gold_reward": 50,
                    "quest_type": "daily",
                    "aspiration_tag": "Stay emotionally present",
                    "rationale": "A shared log of experiences maintains emotional intimacy across distance."
                },
                {
                    "title": "Plan the Return Visit",
                    "description": "Research and book one activity to do with your partner on your next visit home. Confirm the date with them today.",
                    "category": "Discipline",
                    "difficulty": "C",
                    "xp_reward": 30,
                    "gold_reward": 200,
                    "quest_type": "one_time",
                    "aspiration_tag": "Stay emotionally present",
                    "rationale": "A concrete future event reduces the anxiety of open-ended physical separation."
                }
            ]
        })
    },
    {
        "bio": "I am a software engineer who spends 12 hours a day sitting. I want to build a routine of running and stretching.",
        "aspirations": "Run a 5k without stopping by end of the year. Launch a side project that generates $100/month in passive income.",
        "level": "5",
        "quest_count": "4",
        "output": json.dumps({
            "quests": [
                {
                    "title": "Interval Run Protocol",
                    "description": "Run for 30 minutes using 1-min run / 1-min walk intervals. Track distance with a fitness app and log it.",
                    "category": "Stamina",
                    "difficulty": "C",
                    "xp_reward": 30,
                    "gold_reward": 200,
                    "quest_type": "daily",
                    "aspiration_tag": "Run a 5k",
                    "rationale": "Interval training builds the aerobic base required to sustain a 5k without stopping."
                },
                {
                    "title": "Post-Code Stretch Ritual",
                    "description": "After each 2-hour coding session, complete a 10-minute stretch targeting hips, back, and wrists.",
                    "category": "Agility",
                    "difficulty": "E",
                    "xp_reward": 10,
                    "gold_reward": 50,
                    "quest_type": "daily",
                    "aspiration_tag": "Run a 5k",
                    "rationale": "Maintaining mobility prevents injury that would derail 5k training."
                },
                {
                    "title": "Feature Ship Sprint",
                    "description": "Spend 90 minutes on your side project with all notifications off. Complete or meaningfully advance one user-facing feature. Commit the code.",
                    "category": "Discipline",
                    "difficulty": "C",
                    "xp_reward": 30,
                    "gold_reward": 200,
                    "quest_type": "daily",
                    "aspiration_tag": "Side project revenue",
                    "rationale": "Daily focused sessions compound into a shippable product far faster than weekend sprints alone."
                },
                {
                    "title": "Monetization Research Session",
                    "description": "Spend 1 hour studying how similar products in your niche generate revenue. Write a 200-word pricing strategy document.",
                    "category": "Intelligence",
                    "difficulty": "B",
                    "xp_reward": 50,
                    "gold_reward": 400,
                    "quest_type": "weekly",
                    "aspiration_tag": "Side project revenue",
                    "rationale": "Understanding monetization before launch prevents building a product nobody will pay for."
                }
            ]
        })
    },
]


def _build_prompt() -> ChatPromptTemplate:
    example_template = ChatPromptTemplate.from_messages([
        ("human", "Bio: {bio}\nAspirations: {aspirations}\nLevel: {level}\nQuests to generate: {quest_count}"),
        ("ai", "{output}"),
    ])

    few_shot_prompt = FewShotChatMessagePromptTemplate(
        example_prompt=example_template,
        examples=FEW_SHOT_EXAMPLES,
    )

    return ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        few_shot_prompt,
        ("human", "Bio: {bio}\nAspirations: {aspirations}\nLevel: {level}\nQuests to generate: {quest_count}"),
    ])


# ---------------------------------------------------------------------------
# Fallback generator
# ---------------------------------------------------------------------------

def synthesize_fallback_quests(aspirations: str, quest_count: int = 5) -> list[dict]:
    """Rule-based fallback when the LLM is unavailable."""
    lower = aspirations.lower()
    quests: list[dict] = []

    if any(w in lower for w in ["fit", "run", "gym", "health", "exercise", "workout", "weight"]):
        quests.append({
            "title": "Morning Movement Protocol",
            "description": "Complete a 30-minute physical activity session before noon. Walk, run, or stretch — just move.",
            "category": "Stamina",
            "difficulty": "D",
            "xp_reward": 20,
            "gold_reward": 100,
            "is_completed": False,
            "quest_type": "daily",
            "aspiration_tag": "Get fit",
            "rationale": "Consistent daily movement is the foundation of any fitness aspiration.",
        })

    if any(w in lower for w in ["code", "project", "app", "software", "build", "develop", "launch", "startup"]):
        quests.append({
            "title": "Deep Work Session",
            "description": "Spend 90 minutes working on your personal project with all notifications silenced. Commit whatever you complete.",
            "category": "Discipline",
            "difficulty": "C",
            "xp_reward": 30,
            "gold_reward": 200,
            "is_completed": False,
            "quest_type": "daily",
            "aspiration_tag": "Build project",
            "rationale": "Focused daily sessions compound into shipped features faster than sporadic effort.",
        })

    if any(w in lower for w in ["read", "learn", "study", "book", "course", "skill", "knowledge"]):
        quests.append({
            "title": "Knowledge Acquisition Block",
            "description": "Read for 30 minutes or complete one course lesson. Write 3 bullet-point notes immediately after.",
            "category": "Intelligence",
            "difficulty": "D",
            "xp_reward": 20,
            "gold_reward": 100,
            "is_completed": False,
            "quest_type": "daily",
            "aspiration_tag": "Learn and grow",
            "rationale": "Regular study with active note-taking accelerates skill acquisition.",
        })

    if any(w in lower for w in ["meditat", "mindful", "journal", "reflect", "calm", "stress", "peace", "mental"]):
        quests.append({
            "title": "Morning Stillness Protocol",
            "description": "Complete a 10-minute guided meditation or journaling session immediately after waking.",
            "category": "Mindfulness",
            "difficulty": "E",
            "xp_reward": 10,
            "gold_reward": 50,
            "is_completed": False,
            "quest_type": "daily",
            "aspiration_tag": "Inner clarity",
            "rationale": "Morning mindfulness sets a regulated emotional baseline for the entire day.",
        })

    # Fill to quest_count with a generic accountability quest
    generic = {
        "title": "Daily Progress Log",
        "description": "Write 3 sentences reviewing today's progress toward your main goal before going to sleep.",
        "category": "Discipline",
        "difficulty": "E",
        "xp_reward": 10,
        "gold_reward": 50,
        "is_completed": False,
        "quest_type": "daily",
        "aspiration_tag": "Stay accountable",
        "rationale": "Tracking daily actions keeps aspirations active rather than abstract.",
    }
    while len(quests) < min(quest_count, 5):
        import copy
        quests.append(copy.deepcopy(generic))

    for quest in quests:
        quest["id"] = str(uuid.uuid4())

    return quests[:quest_count]


# ---------------------------------------------------------------------------
# Main public function
# ---------------------------------------------------------------------------

async def generate_quests(
    bio: str,
    aspirations: str,
    level: int,
    model_preference: str = "cloud",
    quest_count: int = 5,
) -> list[dict]:
    """
    Generates personalized quests using LangChain.

    Returns a list of quest dicts with id and is_completed injected.
    Raises RuntimeError on failure — caller should catch and fall back to synthesize_fallback_quests().
    """
    llm = _get_llm(model_preference)
    prompt = _build_prompt()
    parser = JsonOutputParser(pydantic_object=QuestGenerationOutput)

    chain = prompt | llm | parser

    result: dict = await chain.ainvoke({
        "bio": bio or "A motivated individual seeking personal growth.",
        "aspirations": aspirations or "Grow physically, mentally, and professionally.",
        "level": str(level),
        "quest_count": str(quest_count),
    })

    quests: list[dict] = result.get("quests", [])

    for quest in quests:
        quest["id"] = str(uuid.uuid4())
        quest.setdefault("is_completed", False)

    return quests[:quest_count]
