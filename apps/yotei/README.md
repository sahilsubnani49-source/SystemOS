# Yotei (予定)

Turn an AI-generated planner (`.md`) into dated tasks, then see **what the planner asks of
you now**: this week (or today, for an hour-by-hour plan). Tick tasks off; as hours, days and
weeks pass, the view rolls forward by itself, in your real timezone.

**The planner is the only source of truth.** Yotei never rewords, softens, adds or guesses:

| Rule | How it is enforced |
|---|---|
| Every task is the planner's own words | The LLM only *points* at text. Code (backend `plan_parser.verify()`, and again on the device with `verifyItems()`) keeps an item only if its text is verbatim in the planner. Anything else is **Dropped** and listed. |
| Every date comes from the planner | Each item carries the planner's own timing words (`period_quote`, e.g. "Week 3"), also checked verbatim. Items whose timing isn't written are **Unscheduled**, never given a guessed date. |
| A plan must have a time limit | The planner must state one ("12-week plan", "by 2026-12-31"), quoted verbatim. Otherwise import fails (HTTP 422). |
| Date arithmetic is code, not the LLM | `@yotei/core` turns "Week 3, Wednesday 18:00-19:30" into real local times from the start date. |
| Nothing is hidden | Missed items stay **Overdue**. Review lists everything kept, dropped, unscheduled, not placed, and planner lines nothing picked up. |
| No fabricated fallback | If the LLM is unreachable, import fails (HTTP 502). |

It runs inside SystemOS (**Apps tab → Yotei**) **and** as its own app.

## Packages

```
apps/yotei/
├── core/  @yotei/core  Pure TypeScript: quote checks, dates, period resolution, "now" view. Vitest.
├── ui/    @yotei/ui    React Native screens. Exports <YoteiApp/>; never imports from any host.
└── app/   @yotei/app   Standalone Expo app (com.sahildevhk.yotei): SystemOS sign-in + <YoteiApp/>.
```

A host talks to Yotei only through props:

```ts
<YoteiApp
  parsePlan={(markdown) => Promise<PlanDraft>}  // host calls POST /api/yotei/parse with its auth,
                                                 // then draftFromWire() from @yotei/core
  onExit={() => …}                               // optional: host closes Yotei
  databaseName="yotei.db"                        // Yotei's OWN SQLite file
  onDiagnostic={(event) => …}                    // optional: failures, for host monitoring
/>
```

## Time and timezones

- Every period is stored as **wall-clock time** (`YYYY-MM-DDTHH:mm`).
- "Now" is the device's current wall-clock time, from `Intl` in its **current** timezone, re-read every 30 s and on returning to the foreground. "Week 3, Monday 09:00" is 9am wherever you are, and DST is handled by the platform's tz data.
- A **plan week** is the 7 days from the plan's start date. If the planner gives no calendar date, you choose the start at import.
- Hour-based plans also take a start time ("Hour 1 starts at").

## Commands

```bash
npm install                                 # from the repo root (npm workspaces)
npm run test --workspace @yotei/core        # Vitest
backend/venv/bin/python backend/tests/test_plan_parser.py   # backend gate, no LLM needed
cd apps/yotei/app && npx expo run:android   # standalone app (or run:ios / npm run web)
```

The standalone app signs in to the SystemOS backend at `EXPO_PUBLIC_API_URL` (set in
`eas.json`; default `https://systemos-kappa.vercel.app`). Inside SystemOS it uses the
existing session.

`expo-document-picker`, `expo-file-system`, `expo-sqlite` and `expo-secure-store` are native
modules: rebuild the dev client after pulling.
