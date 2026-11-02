# Yotei (予定)

An offline planner. Ask **any** AI for a plan in Yotei's JSON format, paste it in, and Yotei
puts every task on your calendar and shows you what to do **right now, today, this week and
this year**. Tick tasks off; as hours, days and weeks pass, the views roll forward by
themselves, in your real timezone.

No account, no server, no built-in AI: you use whichever assistant you like (ChatGPT, Claude,
Gemini, a local model) and Yotei only reads, checks and schedules the JSON it gives back.

It runs inside SystemOS (**Apps tab → Yotei**) **and** as its own app.

## How it works

1. **Add → Copy prompt.** The prompt (`PLAN_PROMPT` in `core/src/prompt.ts`) explains the
   format with a worked example. Fill in your goal and send it to any AI.
2. **Paste the reply** (or open a `.json` file). Yotei finds the JSON even inside a
   ```` ```json ```` fence or a sentence of prose, and checks it as you paste.
3. **Pick a start date** if the plan doesn't state one, check the preview, **Save**.

| Screen | Shows |
|---|---|
| **Today** | The "Right now" card, today's schedule (clock slots), today's tasks, week/month tasks still running, and anything missed |
| **Week** | The next 7 days, day by day; week-long tasks listed once on top |
| **Year** | The next 12 months: progress, the plan's phases, and the main tasks (a daily habit is one line, `×30`) |
| **Plans** | Every plan with its progress; view/copy its JSON, archive, delete |

Today, Week and Year combine all active plans; each plan has its own colour.

## The format (version 1)

```json
{
  "yotei": 1,
  "title": "Conversational Japanese",
  "start": "2026-11-09",
  "duration": { "weeks": 12 },
  "tasks": [
    { "task": "Learn hiragana rows a to ta", "week": 1, "weekday": "mon", "time": "07:00", "end_time": "07:45", "phase": "Foundations" },
    { "task": "Review flashcards", "repeat": "daily", "time": "21:00", "end_time": "21:15" },
    { "task": "Finish textbook chapter 1", "week": 2, "notes": "Do every exercise" },
    { "task": "Shadow one podcast episode", "week": [3, 12], "repeat": ["tue", "thu"] },
    { "task": "Take a mock speaking test", "date": "2027-01-30" }
  ]
}
```

| Field | Meaning |
|---|---|
| `title` | Required. The plan's name. |
| `start` | Optional `YYYY-MM-DD`. Omitted: the user picks it at import. |
| `duration` **or** `end` | Exactly one. `{"days"\|"weeks"\|"months"\|"years": n}`, or the last day `YYYY-MM-DD`. A plan without a time limit is rejected, never given an invented one. |
| `task` | Required. What to do. |
| `day` / `week` / `month` / `year` | Counted from the start (1 = first), or a range `[3, 12]`. Plan weeks start on the plan's start day, not on Monday. |
| `date` (+ `end_date`) | A calendar date, or a span of days. |
| `weekday` | `mon`…`sun`: one day inside a single `week`. |
| `repeat` | `daily`, `weekdays`, `weekends`, `weekly`, `monthly`, or `["mon", "thu"]`. Repeats within the task's range, or the whole plan. |
| `time`, `end_time` | 24-hour `HH:MM`, only on a specific day. No `end_time`: 1 hour. A slot may cross midnight. |
| `notes`, `phase` | Optional details, and the stage of the plan the task belongs to. |

**Nothing is guessed.** A plan-level problem (bad JSON, no time limit) blocks the import with
the field's path. A broken task is **skipped and listed** with the reason, so one bad line
doesn't lose the other 200. Unknown fields are ignored and listed. Tasks outside the plan's
dates are listed, never moved. A missed task stays **missed**; nothing is rescheduled.

## Packages

```
apps/yotei/
├── core/  @yotei/core  Pure TypeScript: the format (planJson), dates (resolve), views, the prompt. Vitest.
├── ui/    @yotei/ui    React Native screens. Exports <YoteiApp/>; never imports from any host.
└── app/   @yotei/app   Standalone Expo app (com.sahildevhk.yotei): just <YoteiApp/>.
```

A host talks to Yotei only through props:

```ts
<YoteiApp
  onExit={() => …}             // optional: host closes Yotei
  databaseName="yotei.db"      // Yotei's OWN SQLite file
  onDiagnostic={(event) => …}  // optional: failures, for host monitoring
/>
```

## Time and timezones

- Every date and time is stored as **wall-clock time** (`YYYY-MM-DDTHH:mm`), computed by
  `@yotei/core` from the plan's start. An LLM never does date arithmetic.
- "Now" is the device's current wall-clock time, from `Intl` in its **current** timezone,
  re-read every 30 s and on returning to the foreground. "Week 3, Monday 09:00" is 9am
  wherever you are; DST is handled by the platform's tz data.

## Commands

```bash
npm install                                 # from the repo root (npm workspaces)
npm run test --workspace @yotei/core        # Vitest
cd apps/yotei/app && npx expo run:android   # standalone app (or run:ios / npm run web)
```

`expo-clipboard`, `expo-document-picker`, `expo-file-system` and `expo-sqlite` are native
modules: rebuild the dev client after pulling.
