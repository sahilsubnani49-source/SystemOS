"""Persistence for user accounts + per-user state.

SQLAlchemy Core — no ORM. The engine comes from DATABASE_URL: a local SQLite file by
default, Postgres (Neon) in the cloud. Each user owns one `user_state` row holding
their player/quests/inventory as JSON TEXT blobs, seeded at signup from the DEFAULT_*
templates that main.py owns.

Every public function is async: the blocking driver call runs in a worker thread, so
a slow network query never stalls the event loop (and in-flight LLM calls with it).
"""

import json
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional

import anyio
from sqlalchemy import (
    Column,
    ForeignKey,
    Index,
    MetaData,
    Table,
    Text,
    create_engine,
    event,
    insert,
    select,
    update,
)
from sqlalchemy.engine import Engine
from sqlalchemy.exc import IntegrityError

from app.config import settings

logger = logging.getLogger("systemos")

metadata = MetaData()

users = Table(
    "users",
    metadata,
    Column("id", Text, primary_key=True),
    Column("email", Text, nullable=False),  # always stored lower-cased
    Column("password_hash", Text, nullable=False),
    Column("name", Text),
    Column("created_at", Text, nullable=False),
)
# Unique on the lower-cased email: case-insensitive uniqueness on both engines
# (SQLite's COLLATE NOCASE has no Postgres equivalent).
Index("ux_users_email", users.c.email, unique=True)

user_state = Table(
    "user_state",
    metadata,
    Column("user_id", Text, ForeignKey("users.id"), primary_key=True),
    Column("player_json", Text, nullable=False),
    Column("quests_json", Text, nullable=False),
    Column("inventory_json", Text, nullable=False),
    Column("updated_at", Text, nullable=False),
)

_engine: Optional[Engine] = None


def _get_engine() -> Engine:
    # Lazy: never touch disk or network at import time. This is what lets the module
    # import cleanly on Vercel's read-only filesystem.
    global _engine
    if _engine is None:
        url = settings.database_url
        if settings.is_sqlite:
            _engine = create_engine(url, connect_args={"check_same_thread": False})

            @event.listens_for(_engine, "connect")
            def _wal(dbapi_conn, _record):
                dbapi_conn.execute("PRAGMA journal_mode=WAL")
        else:
            _engine = create_engine(
                url,
                pool_size=5,
                max_overflow=5,
                pool_pre_ping=True,  # survive Neon scale-to-zero and idle disconnects
                pool_recycle=300,
                # Neon's pooler is PgBouncer in transaction mode; server-side prepared
                # statements break there, so disable psycopg's auto-prepare.
                connect_args={"prepare_threshold": None},
            )
    return _engine


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_email(email: str) -> str:
    return (email or "").strip().lower()


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

def _init_db() -> None:
    metadata.create_all(_get_engine())


async def init_db() -> None:
    """Create tables if they don't exist. Idempotent — safe on every startup/instance."""
    await anyio.to_thread.run_sync(_init_db)
    logger.info("[SystemOS] User DB ready (%s)", "sqlite" if settings.is_sqlite else "postgres")


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

def _create_user(
    email: str,
    password_hash: str,
    name: Optional[str],
    default_player: dict,
    default_quests: list,
    default_inventory: list,
) -> dict:
    user_id = str(uuid.uuid4())
    created_at = _now()
    email = _normalize_email(email)

    seed_player = json.loads(json.dumps(default_player))  # deep copy
    seed_player["id"] = user_id
    if name:
        seed_player["name"] = name

    try:
        with _get_engine().begin() as conn:  # one transaction: both rows or neither
            conn.execute(
                insert(users).values(
                    id=user_id,
                    email=email,
                    password_hash=password_hash,
                    name=name,
                    created_at=created_at,
                )
            )
            conn.execute(
                insert(user_state).values(
                    user_id=user_id,
                    player_json=json.dumps(seed_player),
                    quests_json=json.dumps(default_quests),
                    inventory_json=json.dumps(default_inventory),
                    updated_at=created_at,
                )
            )
    except IntegrityError as e:
        # Unique(email) collision → caller maps to 409
        raise ValueError("email_taken") from e

    return {"id": user_id, "email": email, "name": name, "created_at": created_at}


async def create_user(
    email: str,
    password_hash: str,
    name: Optional[str],
    default_player: dict,
    default_quests: list,
    default_inventory: list,
) -> dict:
    """Insert a new user AND seed their user_state row from the provided defaults.

    The seed player is a copy of default_player with its `id`/`name` bound to the
    new user. Both writes commit atomically. Returns the user dict.
    """
    return await anyio.to_thread.run_sync(
        _create_user, email, password_hash, name, default_player, default_quests, default_inventory
    )


def _get_user_where(clause) -> Optional[dict]:
    with _get_engine().connect() as conn:
        row = conn.execute(select(users).where(clause)).mappings().first()
        return dict(row) if row else None


async def get_user_by_email(email: str) -> Optional[dict]:
    return await anyio.to_thread.run_sync(_get_user_where, users.c.email == _normalize_email(email))


async def get_user_by_id(user_id: str) -> Optional[dict]:
    return await anyio.to_thread.run_sync(_get_user_where, users.c.id == user_id)


# ---------------------------------------------------------------------------
# Per-user state
# ---------------------------------------------------------------------------

def _get_user_state(user_id: str) -> Optional[dict]:
    with _get_engine().connect() as conn:
        row = conn.execute(
            select(user_state.c.player_json, user_state.c.quests_json, user_state.c.inventory_json)
            .where(user_state.c.user_id == user_id)
        ).mappings().first()
    if not row:
        return None
    return {
        "player": json.loads(row["player_json"]),
        "quests": json.loads(row["quests_json"]),
        "inventory": json.loads(row["inventory_json"]),
    }


async def get_user_state(user_id: str) -> Optional[dict]:
    """Return {player, quests, inventory} for a user, or None if no row exists."""
    return await anyio.to_thread.run_sync(_get_user_state, user_id)


def _save_user_state(user_id: str, player: dict, quests: list, inventory: list) -> None:
    with _get_engine().begin() as conn:
        conn.execute(
            update(user_state)
            .where(user_state.c.user_id == user_id)
            .values(
                player_json=json.dumps(player),
                quests_json=json.dumps(quests),
                inventory_json=json.dumps(inventory),
                updated_at=_now(),
            )
        )


async def save_user_state(user_id: str, player: dict, quests: list, inventory: list) -> None:
    """Persist the full per-user state back to its row."""
    await anyio.to_thread.run_sync(_save_user_state, user_id, player, quests, inventory)
