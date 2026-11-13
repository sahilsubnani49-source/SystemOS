// The snippet the user copies into any LLM (ChatGPT, Claude, Gemini, a local model) to get
// a plan Yotei can import. The example inside is parsed by a test, so it can't drift from
// what parsePlanJson accepts.

export const EXAMPLE_PLAN = `{
  "yotei": 1,
  "title": "Conversational Japanese",
  "duration": { "weeks": 12 },
  "tasks": [
    { "task": "Learn hiragana rows a to ta", "week": 1, "weekday": "mon", "time": "07:00", "end_time": "07:45", "phase": "Foundations" },
    { "task": "Review flashcards", "repeat": "daily", "time": "21:00", "end_time": "21:15" },
    { "task": "Finish textbook chapter 1", "week": 2, "notes": "Do every exercise", "phase": "Foundations" },
    { "task": "Shadow one podcast episode", "week": [3, 12], "repeat": ["tue", "thu"] },
    { "task": "Book a tutor session", "repeat": "weekly" },
    { "task": "Take a mock speaking test", "day": 84, "time": "10:00", "end_time": "11:00", "phase": "Review" }
  ]
}`;

export const PLAN_PROMPT = `Make me a plan I can import into my planner app, Yotei.

My goal: <describe the goal>
Time I have: <e.g. 12 weeks, about 1 hour on weekdays>
Start date (optional): <YYYY-MM-DD>

Reply with ONLY one JSON object, no other text, in exactly this format:

${EXAMPLE_PLAN}

Rules:
- "title": a short name for the plan.
- "start" (optional): the first day, "YYYY-MM-DD". Leave it out and I'll choose it in the app.
- The time limit: give exactly ONE of "duration" ({"days": n}, {"weeks": n}, {"months": n} or {"years": n}) or "end" (the last day, "YYYY-MM-DD").
- Each task has "task" (what to do, one short line) and its timing:
  - "day", "week", "month" or "year": a number counted from the start (1 = the first), or a range like [3, 12];
  - or "date": "YYYY-MM-DD" (optional "end_date" for a span of days);
  - "weekday": "mon", "tue", "wed", "thu", "fri", "sat" or "sun" picks a day inside one "week";
  - "repeat": "daily", "weekdays", "weekends", "weekly", "monthly", or a list of days like ["mon", "thu"]. It repeats within the task's range, or across the whole plan if no range is given.
- "time" / "end_time" (optional): 24-hour "HH:MM". Only for a task on a specific day (a "date", a "day", a "week" with "weekday", or a daily/weekday "repeat"). Without "end_time" it lasts 1 hour.
- Optional: "notes" for details, "phase" for the stage of the plan it belongs to.
- Use "repeat" for anything recurring instead of listing it many times.
- Make the tasks concrete and doable in the time I have.`;
