# SystemOS backend — Cloud Run container.
#
# Cloud Run injects PORT (8080) and terminates TLS for us, so uvicorn binds plain
# HTTP on 0.0.0.0:$PORT. One worker only: every LLM call is `await ainvoke`, so
# concurrency comes from the event loop — let Cloud Run's --concurrency flag scale it.

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Dependencies in their own layer so code edits don't reinstall the LangChain tree.
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY app ./app

# Cloud Run's default runtime service account is root-capable; drop to a plain user.
RUN useradd --create-home --uid 1000 systemos && chown -R systemos:systemos /app
USER systemos

ENV PORT=8080
EXPOSE 8080

# `exec` so uvicorn is PID 1 and receives Cloud Run's SIGTERM directly.
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --workers 1
