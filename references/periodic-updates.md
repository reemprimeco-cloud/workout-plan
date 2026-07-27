# Periodic Updates — Reference

Scope: any recurring or scheduled work for this site (reminders, digests,
refreshes, cleanups, periodic notifications).

**Forbidden:** `setInterval`, `node-cron`, or any in-process timer. The app runs
as Vercel serverless functions — there is no long-lived process for a timer to
live in, and an instance is torn down once a request finishes.

> This file previously documented the Manus platform's `manus-heartbeat` cron
> system. That platform was removed in the standalone migration (Phase 2) and
> none of it applies any more. Scheduling is Vercel Cron.

---

## 1. How scheduling works here

One mechanism: **Vercel Cron** hits an ordinary HTTP endpoint on a schedule.

Declared in `vercel.json`:

```json
"crons": [
  { "path": "/api/cron/workout-reminders", "schedule": "0 6 * * *" }
]
```

The endpoint is a normal Express route registered in `server/_core/index.ts`,
mounted **before** the tRPC handler and the SPA fallthrough.

## 2. Authentication

Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. The handler must verify
it and **fail closed** — the endpoint is publicly reachable, so an
unauthenticated request must not be able to trigger a fan-out of notifications.

`CRON_SECRET` lives in the Vercel project's environment variables. If it is
unset the endpoint returns 503 rather than running unauthenticated.

Reference implementation: `server/handlers/workoutReminder.ts`. It accepts
either the bearer header or `?secret=`, and rejects everything else.

## 3. Adding a new scheduled job

1. Write a handler in `server/handlers/`, authenticating with `CRON_SECRET`.
2. Register the route in `server/_core/index.ts`, before the tRPC middleware.
3. Add an entry to the `crons` array in `vercel.json`.
4. Redeploy — Vercel registers schedules at deploy time, not at runtime.

Schedules are **UTC**. Convert local times before writing the expression.

## 4. Plan limits — read before designing a schedule

Vercel's **Hobby** plan allows cron invocations **once per day**. Anything finer
is silently reduced.

This currently matters for `workout-reminders`: the handler selects users whose
configured reminder hour matches the current UTC hour, which assumes an *hourly*
trigger. On the declared daily `0 6 * * *` schedule, only users whose reminder
falls in the 06:00 UTC hour are ever reached — everyone else is silently never
reminded.

Options if per-hour reminders are wanted:

- Upgrade to Pro (finer cron granularity) and change the schedule to `0 * * * *`;
  the handler already behaves correctly when triggered hourly.
- Or send one daily batch at a fixed time and drop the per-user hour setting, so
  the UI stops offering something the schedule cannot deliver.

Either way the handler's hour-matching and the declared schedule must agree —
today they do not.
