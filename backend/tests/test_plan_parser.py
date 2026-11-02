"""
Yotei planner parser checks. Runs with pytest, or directly:

    backend/venv/bin/python backend/tests/test_plan_parser.py

No real LLM is used: a fake model returns canned (and deliberately misbehaving) JSON so
the deterministic gate can be tested on its own.
"""

import json
import os
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ.setdefault("DATABASE_URL", "sqlite:///" + os.path.join(tempfile.mkdtemp(), "t.db"))

from langchain_core.messages import AIMessage  # noqa: E402
from langchain_core.runnables import RunnableLambda  # noqa: E402

from app.services import plan_parser  # noqa: E402
from app.services.plan_parser import PlanNoTimeLimit, normalize_doc, normalize_line, quote_in_doc, verify  # noqa: E402

VECTORS = json.loads(
    (ROOT.parent / "apps/yotei/core/src/__tests__/normalize.vectors.json").read_text(encoding="utf-8")
)

PLANNER = """# 12-week strength plan

A 12-week plan, starting whenever you're ready.

## Week 1
- Squat 3x5 at 40kg
- Walk 30 minutes daily

## Week 2
- Squat 3x5 at 45kg
- Book a physio check
"""

META = {"title_quote": "12-week strength plan", "boundary_quote": "A 12-week plan",
        "horizon_unit": "week", "horizon_length": 12}


def test_normalize_matches_the_typescript_vectors():
    for raw, expected in VECTORS["normalize"]:
        assert normalize_line(raw) == expected, (raw, normalize_line(raw), expected)
    for doc, quote, expected in VECTORS["contains"]:
        assert quote_in_doc(quote, normalize_doc(doc)) is expected, (doc, quote)


def test_verify_keeps_only_verbatim_items_and_reports_the_rest():
    items = [
        {"quote": "Squat 3x5 at 40kg", "period_quote": "Week 1", "period": {"unit": "week", "index": 1}},
        {"quote": "Squat 3x5 at 50kg", "period_quote": "Week 1", "period": {"unit": "week", "index": 1}},
        {"quote": "Enjoy a relaxing stroll", "period_quote": "Week 1", "period": {"unit": "week", "index": 1}},
        {"quote": "Book a physio check", "period_quote": "", "period": None},
        {"quote": "Squat 3x5 at 45kg", "period_quote": "Week 9", "period": {"unit": "week", "index": 9}},
        {"quote": "Squat 3x5 at 40kg", "period_quote": "Week 1", "period": {"unit": "week", "index": 1}},
    ]
    out = verify(PLANNER, META, items)
    assert [i["quote"] for i in out["items"]] == ["Squat 3x5 at 40kg"]
    assert [r["reason"] for r in out["rejected"]] == ["Not found in the planner"] * 2 + ["Duplicate"]
    assert [u["quote"] for u in out["unscheduled"]] == ["Book a physio check", "Squat 3x5 at 45kg"]
    assert out["unassigned_lines"] == ["Walk 30 minutes daily"]
    assert out["plan"] == {"title": "12-week strength plan", "boundary_quote": "A 12-week plan",
                           "horizon": {"unit": "week", "length": 12}, "start_date": None, "end_date": None}


def test_verify_refuses_a_planner_without_a_time_limit():
    for meta in (
        {**META, "boundary_quote": ""},                                   # LLM found none
        {**META, "boundary_quote": "A 16-week plan"},                     # LLM invented one
        {**META, "horizon_unit": None, "horizon_length": None},           # no readable length
    ):
        try:
            verify(PLANNER, meta, [])
        except PlanNoTimeLimit:
            continue
        raise AssertionError(f"accepted {meta}")


def _fake_llm(meta: dict, items: list[dict]):
    def answer(prompt) -> AIMessage:
        text = prompt.to_string() if hasattr(prompt, "to_string") else str(prompt)
        body = meta if "title_quote" in text and "boundary_quote:" in text else {"items": items}
        return AIMessage(content=json.dumps(body))
    return RunnableLambda(answer)


def test_route_end_to_end_with_a_fake_llm():
    from fastapi.testclient import TestClient
    import app.main as main

    llm_items = [
        {"quote": "Squat 3x5 at 40kg", "period_quote": "Week 1", "period": {"unit": "week", "index": 1}},
        {"quote": "Invented: drink 3L water", "period_quote": "Week 1", "period": {"unit": "week", "index": 1}},
    ]
    original = plan_parser._get_llm
    try:
        with TestClient(main.app) as client:
            client.post("/auth/signup", json={"email": "yotei@example.com", "password": "correct-horse-battery"})
            token = client.post(
                "/auth/login", json={"email": "yotei@example.com", "password": "correct-horse-battery"}
            ).json()["access_token"]
            h = {"Authorization": f"Bearer {token}"}

            plan_parser._get_llm = lambda *a, **k: _fake_llm(META, llm_items)
            r = client.post("/api/yotei/parse", headers=h, json={"markdown": PLANNER})
            assert r.status_code == 200, r.text
            body = r.json()
            assert [i["quote"] for i in body["items"]] == ["Squat 3x5 at 40kg"]
            assert body["rejected"][0]["quote"] == "Invented: drink 3L water"
            assert body["ai_generated"] is True

            plan_parser._get_llm = lambda *a, **k: _fake_llm({**META, "boundary_quote": ""}, llm_items)
            r = client.post("/api/yotei/parse", headers=h, json={"markdown": PLANNER})
            assert r.status_code == 422 and "no time limit" in r.json()["detail"]

            r = client.post("/api/yotei/parse", headers=h, json={"markdown": "x" * 60_001})
            assert r.status_code == 413

            def broken(*a, **k):
                raise RuntimeError("provider down")
            plan_parser._get_llm = broken
            r = client.post("/api/yotei/parse", headers=h, json={"markdown": PLANNER})
            assert r.status_code == 502

            r = client.post("/api/yotei/parse", json={"markdown": PLANNER})
            assert r.status_code == 401
    finally:
        plan_parser._get_llm = original


def test_long_planners_are_chunked_at_headings():
    weeks = "\n\n".join(f"## Week {w}\n" + "\n".join(f"- Task {w}.{i} " + "x" * 60 for i in range(20)) for w in range(1, 13))
    chunks = plan_parser._chunks("# Big plan\n\n" + weeks)
    assert len(chunks) > 1
    assert all(len(c) <= plan_parser.CHUNK_CHARS + 200 for c in chunks)
    # Every task line still sits in a chunk after a heading that dates it.
    for c in chunks:
        first_task = next((l for l in c.split("\n") if l.startswith("- ")), None)
        if first_task:
            assert c.index("## Week") < c.index(first_task)


if __name__ == "__main__":
    tests = [v for k, v in dict(globals()).items() if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
        print("ok ", t.__name__)
    print(f"{len(tests)} passed")
