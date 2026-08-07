"""SQLite persistence for user accounts + per-user state.

Raw stdlib sqlite3 — no ORM. Single DB file at backend/systemos.db. Each user owns
one `user_state` row holding their player/quests/inventory as JSON TEXT blobs, seeded
at signup from the DEFAULT_* templates that main.py owns.
"""

import os
import json
import uuid
import sqlite3
import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger("systemos")

# DB lives next to the backend package root: backend/systemos.db
_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "systemos.db")

# One shared connection. check_same_thread=False so FastAPI's threadpool can use it;
# sqlite3 serializes writes internally, which is fine for this in-process store.
_conn = sqlite3.connect(_DB_PATH, check_same_thread=False)
_conn.row_factory = sqlite3.Row
_conn.execute("PRAGMA journal_mode=WAL;")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def init_db() -> None:
    """Create tables if they don't exist. Idempotent — safe to call on every startup."""
    _conn.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id            TEXT PRIMARY KEY,
            email         TEXT UNIQUE COLLATE NOCASE NOT NULL,
            password_hash TEXT NOT NULL,
            name          TEXT,
            created_at    TEXT NOT NULL
        )
        """
    )
    _conn.execute(
        """
        CREATE TABLE IF NOT EXISTS user_state (
            user_id       TEXT PRIMARY KEY REFERENCES users(id),
            player_json   TEXT NOT NULL,
            quests_json   TEXT NOT NULL,
            inventory_json TEXT NOT NULL,
            updated_at    TEXT NOT NULL
        )
        """
    )
    _conn.commit()
    logger.info("[SystemOS] User DB ready at %s", _DB_PATH)


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

def create_user(
    email: str,
    password_hash: str,
    name: Optional[str],
    default_player: dict,
    default_quests: list,
    default_inventory: list,
) -> dict:
    """Insert a new user AND seed their user_state row from the provided defaults.

    The seed player is a copy of default_player with its `id`/`name` bound to the
    new user. Both writes are committed atomically. Returns the user dict.
    """
    user_id = str(uuid.uuid4())
    created_at = _now()

    seed_player = json.loads(json.dumps(default_player))  # deep copy
    seed_player["id"] = user_id
    if name:
        seed_player["name"] = name

    seed_quests = json.loads(json.dumps(default_quests))
    seed_inventory = json.loads(json.dumps(default_inventory))

    try:
        with _conn:  # transaction: commits on success, rolls back on exception
            _conn.execute(
                "INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)",
                (user_id, email, password_hash, name, created_at),
            )
            _conn.execute(
                "INSERT INTO user_state (user_id, player_json, quests_json, inventory_json, updated_at) "
                "VALUES (?, ?, ?, ?, ?)",
                (
                    user_id,
                    json.dumps(seed_player),
                    json.dumps(seed_quests),
                    json.dumps(seed_inventory),
                    created_at,
                ),
            )
    except sqlite3.IntegrityError as e:
        # UNIQUE(email) collision → caller maps to 409
        raise ValueError("email_taken") from e

    return {"id": user_id, "email": email, "name": name, "created_at": created_at}


def get_user_by_email(email: str) -> Optional[dict]:
    row = _conn.execute("SELECT * FROM users WHERE email = ? COLLATE NOCASE", (email,)).fetchone()
    return dict(row) if row else None


def get_user_by_id(user_id: str) -> Optional[dict]:
    row = _conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return dict(row) if row else None


# ---------------------------------------------------------------------------
# Per-user state
# ---------------------------------------------------------------------------

def get_user_state(user_id: str) -> Optional[dict]:
    """Return {player, quests, inventory} for a user, or None if no row exists."""
    row = _conn.execute(
        "SELECT player_json, quests_json, inventory_json FROM user_state WHERE user_id = ?",
        (user_id,),
    ).fetchone()
    if not row:
        return None
    return {
        "player": json.loads(row["player_json"]),
        "quests": json.loads(row["quests_json"]),
        "inventory": json.loads(row["inventory_json"]),
    }


def save_user_state(user_id: str, player: dict, quests: list, inventory: list) -> None:
    """Persist the full per-user state back to its row."""
    with _conn:
        _conn.execute(
            "UPDATE user_state SET player_json = ?, quests_json = ?, inventory_json = ?, updated_at = ? "
            "WHERE user_id = ?",
            (
                json.dumps(player),
                json.dumps(quests),
                json.dumps(inventory),
                _now(),
                user_id,
            ),
        )
