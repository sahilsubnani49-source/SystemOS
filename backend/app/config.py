"""Environment configuration — the one place that reads and validates env vars.

Identical contract on a laptop, Cloud Run, and Vercel: everything comes from the
environment. Locally that's backend/.env; in the cloud there is no .env file and
load_dotenv() is a no-op.
"""

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

# Load before reading anything — this module is imported by db.py and auth.py, which
# can run before main.py's own load_dotenv() depending on import order.
_BACKEND_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=_BACKEND_ROOT / ".env")

DEV_JWT_SECRET = "dev-insecure-secret-change-me"

# Absolute path so the local DB is the same file regardless of the working directory.
_DEFAULT_SQLITE_URL = f"sqlite:///{_BACKEND_ROOT / 'systemos.db'}"


def _normalize_database_url(url: str) -> str:
    """Accept a Postgres URL exactly as Neon/Supabase print it.

    Providers hand out `postgresql://` or `postgres://`, but SQLAlchemy would then pick
    psycopg2 (not installed). Rewrite to the psycopg 3 driver so the string can be
    pasted as-is instead of hand-editing the scheme.
    """
    url = url.strip()
    for prefix in ("postgresql://", "postgres://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


def _csv(name: str) -> list[str]:
    raw = os.getenv(name, "")
    return [v.strip() for v in raw.split(",") if v.strip()]


@dataclass(frozen=True)
class Settings:
    app_env: str  # "local" | "production"
    database_url: str
    jwt_secret_key: str
    cors_allow_origins: list[str]
    expose_llm_health: bool

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")


def _validate_production(s: Settings) -> None:
    """Refuse to boot a production deploy that would run in a silently broken state.

    Called only when APP_ENV=production. Collects every problem so one failed deploy
    log lists them all, instead of fixing them one redeploy at a time.
    """
    problems = []
    if s.is_sqlite:
        problems.append("DATABASE_URL must point at Postgres; SQLite loses all accounts on redeploy/scale-out.")
    if s.jwt_secret_key == DEV_JWT_SECRET or len(s.jwt_secret_key) < 32:
        problems.append("JWT_SECRET_KEY must be set to a random value of at least 32 characters.")
    if "*" in s.cors_allow_origins:
        problems.append("CORS_ALLOW_ORIGINS must not contain '*' in production; list explicit origins or leave it empty.")
    if problems:
        raise RuntimeError("Refusing to start in production:\n  - " + "\n  - ".join(problems))


def load_settings() -> Settings:
    app_env = os.getenv("APP_ENV", "local").strip().lower()
    # On by default everywhere: the app's Settings diagnostics call it, and in
    # production it already requires a logged-in user (main.py), so it is not an
    # anonymous cost oracle. Set EXPOSE_LLM_HEALTH=false to hide it entirely.
    expose_default = "true"
    s = Settings(
        app_env=app_env,
        database_url=_normalize_database_url(os.getenv("DATABASE_URL") or _DEFAULT_SQLITE_URL),
        jwt_secret_key=os.getenv("JWT_SECRET_KEY") or DEV_JWT_SECRET,
        cors_allow_origins=_csv("CORS_ALLOW_ORIGINS"),
        expose_llm_health=(os.getenv("EXPOSE_LLM_HEALTH") or expose_default).lower() == "true",
    )
    if s.is_production:
        _validate_production(s)
    return s


settings = load_settings()
