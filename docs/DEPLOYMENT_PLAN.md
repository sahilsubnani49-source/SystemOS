# Backend Deployment Plan

**Goal:** one backend codebase that runs unchanged on a laptop, on **Google Cloud Run**,
and on **Vercel**. Switching platforms should be a matter of environment variables and
one small config file, not code changes.

**Status (2026-10-31):**

| Phase | State |
|---|---|
| Phase 1 — portable backend (§5) | **Done**: `config.py`, SQLAlchemy `db.py`, awaited call sites, CORS / `/health/llm` hardening, ignore files, `vercel.json`, `.python-version`. `langchain-community` dropped. The optional `docker-compose.yml` (§5.8) was **not** added (no Docker on the dev machine) |
| Phase 2 — local verify (§6) | Mode A smoke test **passes** on SQLite. Postgres DDL and engine config verified offline; Modes B/C not yet run |
| Phase 4 mobile wiring (§8.1) | **Done** with placeholders: `preview`, new `preview-vercel`, `production` profiles; Android package `com.sahildevhk.systemos` |
| Neon / Cloud Run / Vercel deploys (§4, §7, §9) | **Not started** — needs the account owner |

---

## TL;DR

| Decision | Choice | Why |
|---|---|---|
| Primary host | **Google Cloud Run** | Runs the existing `backend/Dockerfile` as-is; 60-min request ceiling suits long LLM calls |
| Alternate host | **Vercel** (Python / FastAPI) | Detects `app` in `app/main.py` natively; needs only `vercel.json` + `.vercelignore` |
| Database | **Managed Postgres reachable over the internet** — Neon recommended | The current SQLite file is lost on every deploy/scale-out on both platforms, and Vercel can't write it at all |
| DB access layer | **SQLAlchemy Core** behind the existing `db.py` function names | Same code talks to SQLite locally and Postgres in the cloud, chosen by `DATABASE_URL` |
| Config | **Environment variables only**, validated in one `app/config.py` | Identical contract on laptop, Cloud Run, and Vercel |
| Region | **Singapore** everywhere: Cloud Run `asia-southeast1`, Neon `aws-ap-southeast-1`, Vercel `sin1` | Co-locate compute and DB (Neon offers no Mumbai region); Vercel otherwise defaults to Washington, D.C. |
| Secrets | Secret Manager (GCP) / Vercel env vars (Vercel) / `.env` (local) | Never baked into an image or uploaded bundle |

**The portability rule the whole plan enforces:** the backend process holds *no state on
local disk*. Everything durable lives in `DATABASE_URL`, and all configuration comes
from the environment. Any platform that can run an ASGI `app` can then host it.

---

## 1. Why the backend can't be deployed as-is

| # | Blocker | Where | Impact on Cloud Run | Impact on Vercel |
|---|---|---|---|---|
| B1 | Users and per-user state live in a **SQLite file** at `backend/systemos.db` | [db.py:19-25](../backend/app/db.py#L19-L25) | Filesystem is per-instance and ephemeral: every deploy, restart, or scale-out **silently wipes all accounts** | Filesystem is read-only: the connection is opened **at import time**, so the whole app crashes before serving a request |
| B2 | DB calls are **synchronous inside `async def` routes** | 15 call sites in `main.py` and `auth.py` | Harmless on local SQLite. Against a network DB, every query blocks the single event loop and stalls every concurrent request — including in-flight LLM calls | Same |
| B3 | `JWT_SECRET_KEY` silently falls back to a hard-coded dev string | [auth.py:35-42](../backend/app/auth.py#L35-L42) | A deploy that forgets the variable issues **forgeable tokens** | Same |
| B4 | `GET /health/llm` is unauthenticated and makes a real paid provider call | [main.py:216](../backend/app/main.py#L216) | Anyone who finds the URL can burn your provider quota | Same |
| B5 | CORS is `allow_origins=["*"]` | [main.py:55-61](../backend/app/main.py#L55-L61) | Low risk for the native app (no `Origin` header), wrong for any future web client | Same |
| B6 | Mobile release builds have **no API URL configured** | `mobile/eas.json` has no `env` block; [env.ts:25-35](../mobile/src/core/env.ts#L25-L35) throws | Release build crashes on launch | Same |

B1 and B2 are true blockers. B3–B5 are tracked as SYS-002 in [`issue.md`](../issue.md) and
become real exposures the moment the URL is public. B6 is SYS-015.

---

## 2. Target architecture

```text
                 ┌──────────────────────────────────────────────┐
  Mobile app ──► │  FastAPI  (backend/app/main.py → `app`)      │
  (JWT Bearer)   │  config.py ← environment variables only      │
                 │  db.py     ← SQLAlchemy Core, DATABASE_URL   │
                 └──────────────┬───────────────────────────────┘
                                │ one of:
     ┌──────────────────────────┼───────────────────────────────┐
     │ LOCAL                    │ CLOUD RUN                     │ VERCEL
     │ uvicorn --reload         │ Docker image (existing file)  │ Vercel Python runtime
     │ or `docker compose up`   │ asia-southeast1               │ vercel.json
     │ .env file                │ Secret Manager                │ Project env vars
     └──────────┬───────────────┴───────────────┬───────────────┘
                │                               │
     sqlite:///./systemos.db         postgresql+psycopg://…neon.tech/…
     (default, zero setup)           (shared by Cloud Run AND Vercel)
                                                │
                                   Groq / xAI / Gemini / Anthropic / OpenAI
```

Because Cloud Run and Vercel point at the **same** `DATABASE_URL`, you can move between
them, or run both at once during a migration, without moving data.

---

## 3. Database choice

| Option | Works from Cloud Run | Works from Vercel | Cost (small app) | Verdict |
|---|---|---|---|---|
| **Neon** (serverless Postgres) | Yes, over TLS | Yes, first-class | Free tier | **Recommended.** Only option equally good on both hosts |
| Supabase Postgres | Yes | Yes | Free tier | Equivalent alternative; pick it if you want its dashboard/auth later |
| Cloud SQL for PostgreSQL | Yes, via the built-in connector socket | Awkward: needs a public IP plus a wide network allow-list | ~US$10+/month minimum | Choose only if you'll never use Vercel |
| SQLite on a Cloud Run volume | Fragile (no concurrent writers across instances) | No | — | Rejected |

The plan below assumes **Neon**. If you choose Cloud SQL, only §6.4 changes; see the
note there.

---

## 4. Phase 0 — prerequisites (one-time)

```bash
# Google Cloud CLI
brew install --cask google-cloud-sdk
gcloud auth login
gcloud config set project <PROJECT_ID>
gcloud config set run/region asia-southeast1

# Vercel CLI (only if/when you use Vercel)
npm i -g vercel
vercel login
```

Accounts needed: a Google Cloud project with billing enabled, a Neon project
(region **AWS Asia Pacific (Singapore)**, the closest Neon region to India), and optionally a Vercel account.

From Neon, copy **two** connection strings:

- **Pooled** (host contains `-pooler`) → use for the app on both platforms.
- **Direct** → use only for one-off admin work such as table creation or data copies.

---

## 5. Phase 1 — make the backend portable (code changes)

All changes are confined to `backend/`. Route handlers keep their logic; only DB calls
gain an `await`.

### 5.1 `backend/app/config.py` (new)

One place that reads and validates the environment. Everything else imports `settings`.

```python
import os
from dataclasses import dataclass

_DEV_JWT = "dev-insecure-secret-change-me"


def _csv(name: str) -> list[str]:
    raw = os.getenv(name, "")
    return [v.strip() for v in raw.split(",") if v.strip()]


@dataclass(frozen=True)
class Settings:
    app_env: str             # "local" | "production"
    database_url: str
    jwt_secret_key: str
    cors_allow_origins: list[str]
    expose_llm_health: bool

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


def load_settings() -> Settings:
    app_env = os.getenv("APP_ENV", "local").lower()
    s = Settings(
        app_env=app_env,
        database_url=os.getenv("DATABASE_URL", "sqlite:///./systemos.db"),
        jwt_secret_key=os.getenv("JWT_SECRET_KEY", _DEV_JWT),
        cors_allow_origins=_csv("CORS_ALLOW_ORIGINS"),
        expose_llm_health=os.getenv("EXPOSE_LLM_HEALTH", "true" if app_env == "local" else "false") == "true",
    )
    if s.is_production:
        # Fail the deploy loudly instead of running in a silently broken state.
        if s.jwt_secret_key == _DEV_JWT or len(s.jwt_secret_key) < 32:
            raise RuntimeError("JWT_SECRET_KEY must be set (>= 32 chars) in production.")
        if s.database_url.startswith("sqlite"):
            raise RuntimeError("DATABASE_URL must point at Postgres in production; SQLite loses data on redeploy.")
    return s


settings = load_settings()
```

The `sqlite` refusal in production is the most important line in this plan: it turns
blocker B1 from silent data loss into a deploy that fails immediately.

Call `load_dotenv()` **before** importing `config` (it already runs at the top of
`main.py`). In the cloud there is no `.env` file, so it's a no-op.

### 5.2 `backend/app/db.py` (rewrite internals, keep function names)

Swap raw `sqlite3` for SQLAlchemy Core. The public functions — `init_db`, `create_user`,
`get_user_by_email`, `get_user_by_id`, `get_user_state`, `save_user_state` — keep their
names and return shapes, but become `async` wrappers around sync implementations run in a
worker thread. That removes blocker B2 with no async driver and no ORM.

```python
import anyio
from sqlalchemy import Column, ForeignKey, Index, MetaData, Table, Text, create_engine, event, insert, select, update
from sqlalchemy.exc import IntegrityError
from app.config import settings

metadata = MetaData()

users = Table(
    "users", metadata,
    Column("id", Text, primary_key=True),
    Column("email", Text, nullable=False),   # always stored lower-cased
    Column("password_hash", Text, nullable=False),
    Column("name", Text),
    Column("created_at", Text, nullable=False),
)
Index("ux_users_email", users.c.email, unique=True)

user_state = Table(
    "user_state", metadata,
    Column("user_id", Text, ForeignKey("users.id"), primary_key=True),
    Column("player_json", Text, nullable=False),
    Column("quests_json", Text, nullable=False),
    Column("inventory_json", Text, nullable=False),
    Column("updated_at", Text, nullable=False),
)

_engine = None


def _get_engine():
    # Lazy: never touch the network or disk at import time. This is what lets the
    # module import cleanly on Vercel's read-only filesystem.
    global _engine
    if _engine is None:
        url = settings.database_url
        if url.startswith("sqlite"):
            _engine = create_engine(url, connect_args={"check_same_thread": False})

            @event.listens_for(_engine, "connect")
            def _wal(dbapi_conn, _):
                dbapi_conn.execute("PRAGMA journal_mode=WAL")
        else:
            _engine = create_engine(
                url,
                pool_size=5,
                max_overflow=5,
                pool_pre_ping=True,    # survive Neon scale-to-zero and idle disconnects
                pool_recycle=300,
                # Neon's pooler runs PgBouncer in transaction mode; server-side
                # prepared statements break there, so disable psycopg's auto-prepare.
                connect_args={"prepare_threshold": None},
            )
    return _engine


def _normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def _get_user_by_email(email: str):
    with _get_engine().connect() as conn:
        row = conn.execute(select(users).where(users.c.email == _normalize_email(email))).mappings().first()
        return dict(row) if row else None


async def get_user_by_email(email: str):
    return await anyio.to_thread.run_sync(_get_user_by_email, email)

# …same pattern for init_db (metadata.create_all), create_user (one transaction,
# IntegrityError → ValueError("email_taken")), get_user_by_id, get_user_state,
# save_user_state.
```

Notes:

- **JSON stays in `TEXT` columns**, as today. Moving to `JSONB` is a later, optional step
  because nothing queries inside the blobs.
- **Email case.** SQLite's `COLLATE NOCASE` doesn't exist in Postgres. Store emails
  lower-cased and look them up lower-cased; the unique index then enforces
  case-insensitive uniqueness on both engines.
- **`anyio`** is already installed as a FastAPI/Starlette dependency.

### 5.3 Call-site updates (15 lines)

Add `await` in front of every `db.` call. Every enclosing function is already `async def`.

| File | Lines |
|---|---|
| `backend/app/auth.py` | 136, 206, 211, 229, 251 |
| `backend/app/main.py` | 41 (`init_db` in `lifespan`), 241, 247, 252, 258, 434, 490, 507, 514, 526 |

### 5.4 Security hardening (clears B3, B4, B5)

- **`auth.py`** — replace the local `JWT_SECRET_KEY` fallback block with
  `from app.config import settings` and `JWT_SECRET_KEY = settings.jwt_secret_key`.
  Production validation now lives in `config.py`.
- **`main.py` CORS** — `allow_origins=settings.cors_allow_origins or (["*"] if not settings.is_production else [])`.
  The native app sends no `Origin` header, so an empty allow-list in production does not
  affect it.
- **`main.py` `/health/llm`** — return `404` unless `settings.expose_llm_health`, and
  require `Depends(get_current_user)` when it is enabled in production. Keep plain
  `GET /health` public: it's the liveness check.

### 5.5 Dependencies — `backend/requirements.txt`

```text
SQLAlchemy>=2.0
psycopg[binary]>=3.1
```

Also remove any LangChain provider packages you don't use. Every extra provider enlarges
the Cloud Run image, the cold start, and the Vercel bundle (limit 500 MB; the current
venv is ~276 MB). `langchain-community` is the heaviest candidate; it's only a fallback
import for `ChatOllama`, which `langchain-ollama` already provides.

### 5.6 Platform ignore and version files (new)

`backend/.python-version`:
```text
3.12
```

`backend/.gcloudignore` (so `gcloud run deploy --source` never uploads secrets or the venv):
```text
.env
.env.*
!.env.example
venv/
__pycache__/
systemos.db*
.vercel/
```

`backend/.vercelignore`, with the same contents. **Without it, `vercel deploy` uploads the
venv and your real `.env`.**

### 5.7 `backend/.env.example` — add

```bash
# local | production. production refuses SQLite and a missing/weak JWT secret.
APP_ENV=local

# Local default is SQLite. Cloud: the Neon POOLED string, with the driver prefix:
# postgresql+psycopg://USER:PASSWORD@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/DB?sslmode=require
DATABASE_URL=sqlite:///./systemos.db

# 32+ random chars. Generate: python -c "import secrets; print(secrets.token_urlsafe(48))"
JWT_SECRET_KEY=

# Comma-separated. Leave empty for the native mobile app.
CORS_ALLOW_ORIGINS=

# GET /health/llm (a paid provider call, used by Settings diagnostics). On by default; requires a login in production. Set false to 404 it.
EXPOSE_LLM_HEALTH=
```

### 5.8 Optional — `docker-compose.yml` for production parity locally

Put this at the repo root to run the real container against a real Postgres, catching
Postgres-only bugs (email case, types) before deploying:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: systemos
      POSTGRES_PASSWORD: systemos
      POSTGRES_DB: systemos
    ports: ["5432:5432"]
  api:
    build: ./backend
    env_file: ./backend/.env
    environment:
      APP_ENV: local
      DATABASE_URL: postgresql+psycopg://systemos:systemos@db:5432/systemos
      PORT: "8080"
    ports: ["8000:8080"]
    depends_on: [db]
```

The existing `backend/Dockerfile` needs **no changes**.

---

## 6. Phase 2 — verify locally (all three modes)

| Mode | Command | Database | Proves |
|---|---|---|---|
| **A. Dev loop** | `cd backend && ./venv/bin/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` | SQLite (default) | Nothing broke for day-to-day work |
| **B. Prod parity** | `docker compose up --build` | Local Postgres 16 | The container plus Postgres code path work |
| **C. Real cloud DB** | Mode A with `DATABASE_URL=<neon pooled url>` | Neon | Credentials, TLS, and pooler settings work before any deploy |

Smoke test for every mode (Mode B serves on `:8000` via the compose port mapping):

```bash
BASE=http://localhost:8000
curl -s $BASE/health
TOKEN=$(curl -s -X POST $BASE/auth/signup -H 'Content-Type: application/json' \
  -d '{"email":"Test@Example.com","password":"correct-horse-1"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')
curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"correct-horse-1"}' | head -c 80; echo   # lower-case login must succeed
curl -s $BASE/api/profile -H "Authorization: Bearer $TOKEN" | head -c 120; echo
```

Also check that `APP_ENV=production` with no `JWT_SECRET_KEY` or a `sqlite` URL
**refuses to start**. That guardrail is the one that protects production.

**Existing local accounts:** the SQLite users are test data, and gameplay state lives on
the device, so the simplest path is to sign up again against the cloud DB. If you want to
keep them, a ~20-line one-off script can read `users` and `user_state` from SQLite and
insert them through the new `db.py` (lower-casing emails on the way).

---

## 7. Phase 3 — deploy to Google Cloud Run

### 7.1 Enable services and create a runtime identity

```bash
PROJECT_ID=$(gcloud config get-value project)
REGION=asia-southeast1

gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com

# Dedicated least-privilege service account instead of the default compute SA.
gcloud iam service-accounts create systemos-backend --display-name="SystemOS backend"
SA=systemos-backend@$PROJECT_ID.iam.gserviceaccount.com
```

### 7.2 Store secrets

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48), end='')" \
  | gcloud secrets create JWT_SECRET_KEY --data-file=-
printf '%s' '<neon pooled postgresql+psycopg://… url>' | gcloud secrets create DATABASE_URL --data-file=-
printf '%s' '<gsk_… groq key>'                         | gcloud secrets create GROQ_API_KEY --data-file=-

for S in JWT_SECRET_KEY DATABASE_URL GROQ_API_KEY; do
  gcloud secrets add-iam-policy-binding $S \
    --member="serviceAccount:$SA" --role="roles/secretmanager.secretAccessor"
done
```

Use `printf '%s'` rather than `echo`: a trailing newline inside a secret makes the API
key or DB URL invalid, and the failure is hard to diagnose.

### 7.3 Deploy

```bash
gcloud run deploy systemos-backend \
  --source backend \
  --region $REGION \
  --service-account $SA \
  --allow-unauthenticated \
  --set-env-vars APP_ENV=production,GROQ_MODEL=openai/gpt-oss-120b \
  --set-secrets JWT_SECRET_KEY=JWT_SECRET_KEY:latest,DATABASE_URL=DATABASE_URL:latest,GROQ_API_KEY=GROQ_API_KEY:latest \
  --cpu 1 --memory 1Gi \
  --concurrency 40 \
  --timeout 300 \
  --min-instances 0 --max-instances 3
```

| Flag | Reason |
|---|---|
| `--source backend` | Cloud Build builds the existing `Dockerfile` and pushes to Artifact Registry automatically |
| `--allow-unauthenticated` | The mobile app calls the service directly; access control is the app's own JWT layer. If an org policy blocks this, the fallback is API Gateway in front |
| `--timeout 300` | Campaign generation chains a strategy call (up to 16k output tokens) with several structuring batches plus retries. Raise toward 3600 if long campaigns time out |
| `--concurrency 40` | Matches the single-worker async design in the Dockerfile. Valid **only after** §5.2 moves DB calls off the event loop |
| `--max-instances 3` | Hard cap on runaway scaling, and on provider spend, until real rate limiting exists |
| `--min-instances 0` | Free when idle. Cold start is several seconds because of LangChain imports; set to `1` later if that hurts (small monthly cost) |

### 7.4 Verify

```bash
URL=$(gcloud run services describe systemos-backend --region $REGION --format='value(status.url)')
curl -s $URL/health                 # {"status":"healthy",...}
curl -s -o /dev/null -w '%{http_code}\n' $URL/health/llm   # 401 — needs a login in production
# Then run the §6 smoke test with BASE=$URL
gcloud run services logs read systemos-backend --region $REGION --limit 50
```

### 7.5 Updating and rolling back

```bash
# Redeploy after code changes — secrets and env vars carry over.
gcloud run deploy systemos-backend --source backend --region $REGION

# Instant rollback: route all traffic to a previous revision.
gcloud run revisions list --service systemos-backend --region $REGION
gcloud run services update-traffic systemos-backend --region $REGION --to-revisions <REVISION>=100
```

> **If you chose Cloud SQL instead of Neon:** create a PostgreSQL instance in `asia-southeast1`,
> grant the service account `roles/cloudsql.client`, add
> `--add-cloudsql-instances <PROJECT>:<REGION>:<INSTANCE>` to the deploy, and set
> `DATABASE_URL=postgresql+psycopg://USER:PASS@/DB?host=/cloudsql/<PROJECT>:<REGION>:<INSTANCE>`.
> Drop the `prepare_threshold` connect arg; there's no PgBouncer in that path.

---

## 8. Phase 4 — point the mobile app at the cloud

### 8.1 `mobile/eas.json` — add the URL per build profile

```json
"preview":    { "distribution": "internal", "android": { "buildType": "apk" },
                "env": { "EXPO_PUBLIC_API_URL": "https://systemos-backend-xxxxx.a.run.app" } },
"production": { "android": { "buildType": "app-bundle" },
                "env": { "EXPO_PUBLIC_API_URL": "https://systemos-backend-xxxxx.a.run.app" } }
```

This closes SYS-015. Switching the app between Cloud Run and Vercel is a one-line change
here, with no code change.

### 8.2 `mobile/src/core/env.ts` — let dev builds hit the cloud too

Today dev builds always use `http://<PHYSICAL_DEVICE_IP>:8000`. Prefer the env var when
it's set, so you can test a dev client against the deployed backend:

```ts
const API_BASE_URL =
  PROD_API_URL ?? (__DEV__ ? `http://${PHYSICAL_DEVICE_IP}:8000` : undefined)!;
```

Keep the existing release-build throw when neither is available. Locally:
`EXPO_PUBLIC_API_URL=https://… npx expo start --dev-client`.

---

## 9. Phase 5 — Vercel (alternative host, minimal changes)

After Phase 1, the backend already satisfies Vercel's contract: a FastAPI instance named
`app` in `app/main.py`, a `requirements.txt`, and no disk writes. The only additions are
the two files below.

### 9.1 `backend/vercel.json` (new)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "functions": {
    "app/main.py": {
      "maxDuration": 300,
      "excludeFiles": "{venv/**,**/__pycache__/**,systemos.db*}"
    }
  }
}
```

### 9.2 Deploy

```bash
cd backend
vercel link            # creates the project; its root directory is backend/

vercel env add APP_ENV production          # value: production
vercel env add DATABASE_URL production     # the SAME Neon pooled URL as Cloud Run
vercel env add JWT_SECRET_KEY production   # reuse Cloud Run's value so existing tokens stay valid
vercel env add GROQ_API_KEY production
vercel env add GROQ_MODEL production       # openai/gpt-oss-120b

vercel --prod
curl -s https://<project>.vercel.app/health
```

Then change `EXPO_PUBLIC_API_URL` in `eas.json` to the Vercel URL.

### 9.3 Vercel caveats

| Concern | Detail | Mitigation |
|---|---|---|
| **Function duration** | Fluid compute caps a request at roughly 300 s on Hobby and more on Pro. A long `/api/goals/plan` (120-day campaign, retries) can exceed that | Keep `maxDuration: 300`; if long campaigns time out, use Pro or keep that workload on Cloud Run (limit 60 min) |
| **Plan terms** | Vercel Hobby is for personal, non-commercial use | Move to Pro before charging users |
| **Bundle size** | 500 MB function limit | §5.5 dependency trimming |
| **`lifespan`** | FastAPI lifespan is supported, but it runs per instance rather than once globally | `init_db` uses `create_all`, which is idempotent, so running it repeatedly is safe |
| **Connection count** | Many concurrent instances means many DB connections | The Neon **pooled** URL plus `pool_size=5` handles this |

Verify the current duration limits at vercel.com/docs/functions/configuring-functions/duration
before relying on them; they have changed before.

---

## 10. Environment variable matrix

| Variable | Local | Cloud Run | Vercel | Required in production |
|---|---|---|---|---|
| `APP_ENV` | `local` (default) | env var `production` | env var `production` | yes |
| `DATABASE_URL` | unset → SQLite | Secret Manager | Vercel env | yes, and must be Postgres |
| `JWT_SECRET_KEY` | optional | Secret Manager | Vercel env (same value) | yes, 32+ chars |
| `GROQ_API_KEY` (or another provider key) | `.env` | Secret Manager | Vercel env | yes, at least one |
| `GROQ_MODEL` | `.env` | env var | Vercel env | recommended |
| `CORS_ALLOW_ORIGINS` | empty | empty | empty | only for a web client |
| `EXPOSE_LLM_HEALTH` | `true` (default) | unset → `true` (login required) | unset → `true` (login required) | no — set `false` to 404 it |
| `PORT` | n/a | injected by Cloud Run | n/a | — |

---

## 11. Cost estimate (low traffic)

| Item | Cloud Run path | Vercel path |
|---|---|---|
| Compute | Likely **$0**: the always-free tier covers ~2M requests/month and generous CPU-seconds | **$0** on Hobby (personal use); Pro is per-seat |
| Database (Neon free tier) | $0 | $0 |
| Secret Manager | A few cents for 3 secrets | — |
| Artifact Registry / Cloud Build | Cents; free tiers cover occasional builds | — |
| LLM provider | **The real cost driver.** Groq free tier first; `--max-instances 3` bounds the damage | Same |

Set a **GCP budget alert** (Billing → Budgets) at a small amount, such as $5, on day one.

---

## 12. Rollout order and checklist

1. **Phase 1 code changes** in one branch. Run Mode A: local dev still works on SQLite.
2. Mode B (`docker compose`): the Postgres path works in the container.
3. Create the Neon project; run Mode C against it.
4. Confirm the production guardrails **refuse to start** with SQLite or a missing JWT secret.
5. Deploy to Cloud Run (§7). Smoke test, check logs, check `/health/llm` returns 401 without a token.
6. Set the budget alert.
7. Set `EXPO_PUBLIC_API_URL` in `eas.json`; build a `preview` APK; test sign-up, campaign
   generation, and reward generation on a real phone over mobile data (not Wi-Fi, so
   nothing silently reaches the laptop).
8. *(Optional)* Deploy the same code to Vercel (§9) and repeat step 7 against its URL.
9. Update `issue.md`: close SYS-015, and mark the B3–B5 portions of SYS-002 done.

---

## 13. Deliberately out of scope (next steps)

- **Rate limiting / per-user quotas.** An in-memory limiter doesn't work across Cloud Run
  instances or serverless functions. Implementing it needs shared state: a Postgres
  counter table, or Redis such as Upstash, which works from both hosts. Until then,
  `--max-instances` and provider-side spend limits are the guardrail.
- **Schema migrations.** `create_all` only creates missing tables; it never alters them.
  Adopt **Alembic** before the first change to `users` or `user_state`.
- **CI/CD.** A GitHub Actions workflow using Workload Identity Federation (no JSON keys)
  running `gcloud run deploy` on pushes to `main`, and/or Vercel's Git integration.
- **Custom domain.** Cloud Run domain mappings or a load balancer; on Vercel, project
  domains. Then `EXPO_PUBLIC_API_URL` stays stable across host switches.
- **Solo Leveling naming** in the seed data (`DEFAULT_PLAYER_STATE.name = "Sung Jin-Woo"`
  in `main.py`). It isn't a deployment blocker, but it becomes public once the backend is.
