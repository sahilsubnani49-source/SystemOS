"""JWT auth: password hashing, access/refresh token minting, the get_current_user
dependency, and the /auth router (signup / login / refresh / me).

- Access tokens: 30 min. Refresh tokens: 30 days. HS256 via PyJWT.
- Passwords hashed with bcrypt directly (72-byte limit enforced).
- Secret from settings.jwt_secret_key. Locally it may fall back to a dev default (with
  a warning); in production config.py refuses to start without a real one.
"""

import re
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from app import db
from app.config import DEV_JWT_SECRET, settings

logger = logging.getLogger("systemos")

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

JWT_SECRET_KEY = settings.jwt_secret_key
if JWT_SECRET_KEY == DEV_JWT_SECRET:
    logger.warning(
        "[SystemOS] JWT_SECRET_KEY not set — using an insecure DEV default. "
        "Set JWT_SECRET_KEY in backend/.env for anything real."
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE = timedelta(minutes=30)
REFRESH_TOKEN_EXPIRE = timedelta(days=30)

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# HTTPBearer with auto_error=False so we can return our own 401s (missing vs invalid)
# each carrying WWW-Authenticate: Bearer.
_bearer = HTTPBearer(auto_error=False)


# ---------------------------------------------------------------------------
# Password hashing (bcrypt directly — 72-byte limit)
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    pw = password.encode("utf-8")
    if len(pw) > 72:
        # bcrypt silently truncates past 72 bytes; reject so the stored hash is honest.
        raise ValueError("password_too_long")
    return bcrypt.hashpw(pw, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    pw = password.encode("utf-8")
    if len(pw) > 72:
        return False
    try:
        return bcrypt.checkpw(pw, password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# ---------------------------------------------------------------------------
# Tokens
# ---------------------------------------------------------------------------

def create_token(user_id: str, token_type: str, expires_delta: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=ALGORITHM)


def _make_token_pair(user_id: str) -> dict:
    return {
        "access_token": create_token(user_id, "access", ACCESS_TOKEN_EXPIRE),
        "refresh_token": create_token(user_id, "refresh", REFRESH_TOKEN_EXPIRE),
        "token_type": "bearer",
    }


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


# ---------------------------------------------------------------------------
# Dependency
# ---------------------------------------------------------------------------

async def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> dict:
    """Resolve the current user from a Bearer access token.

    Distinct 401s for missing / expired / invalid, and rejects non-access tokens.
    """
    if creds is None or not creds.credentials:
        raise _unauthorized("Not authenticated")

    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise _unauthorized("Token expired")
    except jwt.InvalidTokenError:
        raise _unauthorized("Invalid token")

    if payload.get("type") != "access":
        raise _unauthorized("Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise _unauthorized("Invalid token")

    user = await db.get_user_by_id(user_id)
    if user is None:
        raise _unauthorized("Invalid token")

    return user


async def get_optional_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> Optional[dict]:
    """Like get_current_user, but returns None instead of raising when unauthenticated.

    For routes whose auth requirement depends on the environment (e.g. /health/llm).
    """
    if creds is None or not creds.credentials:
        return None
    try:
        return await get_current_user(creds)
    except HTTPException:
        return None


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class SignupRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


# ---------------------------------------------------------------------------
# Defaults injection (main.py owns the template data; it registers them here)
# ---------------------------------------------------------------------------

_DEFAULTS: dict = {"player": {}, "quests": [], "inventory": []}


def set_defaults(player: dict, quests: list, inventory: list) -> None:
    _DEFAULTS["player"] = player
    _DEFAULTS["quests"] = quests
    _DEFAULTS["inventory"] = inventory


def _public_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "created_at": user["created_at"],
    }


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

router = APIRouter(prefix="/auth", tags=["auth"])


def _validate_credentials(email: str, password: str) -> None:
    if not _EMAIL_RE.match(email or ""):
        raise HTTPException(status_code=422, detail="Invalid email address")
    pw_bytes = len((password or "").encode("utf-8"))
    if pw_bytes < 8 or pw_bytes > 72:
        raise HTTPException(
            status_code=422,
            detail="Password must be between 8 and 72 characters",
        )


@router.post("/signup", status_code=201)
async def signup(req: SignupRequest):
    _validate_credentials(req.email, req.password)

    if await db.get_user_by_email(req.email) is not None:
        raise HTTPException(status_code=409, detail="Email already registered")

    password_hash = hash_password(req.password)
    try:
        user = await db.create_user(
            email=req.email,
            password_hash=password_hash,
            name=req.name,
            default_player=_DEFAULTS["player"],
            default_quests=_DEFAULTS["quests"],
            default_inventory=_DEFAULTS["inventory"],
        )
    except ValueError:
        # Race: email inserted between our check and the write.
        raise HTTPException(status_code=409, detail="Email already registered")

    tokens = _make_token_pair(user["id"])
    return {**tokens, "user": _public_user(user)}


@router.post("/login")
async def login(req: LoginRequest):
    user = await db.get_user_by_email(req.email)
    # Same generic message for unknown email vs wrong password.
    if user is None or not verify_password(req.password, user["password_hash"]):
        raise _unauthorized("Invalid credentials")

    tokens = _make_token_pair(user["id"])
    return {**tokens, "user": _public_user(user)}


@router.post("/refresh")
async def refresh(req: RefreshRequest):
    try:
        payload = jwt.decode(req.refresh_token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise _unauthorized("Token expired")
    except jwt.InvalidTokenError:
        raise _unauthorized("Invalid token")

    if payload.get("type") != "refresh":
        raise _unauthorized("Invalid token type")

    user_id = payload.get("sub")
    if not user_id or await db.get_user_by_id(user_id) is None:
        raise _unauthorized("Invalid token")

    return _make_token_pair(user_id)


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return _public_user(user)
