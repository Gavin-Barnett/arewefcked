# Are we Fcked?

Deployment notes for Vercel.

## What is ready

- Next.js App Router app deploys on Vercel
- Score pages and APIs run without a local database
- Historical trend persistence is exposed as a cron-safe HTTP route at `/api/cron/score-recompute`
- The cron route is protected by `CRON_SECRET`
- `vercel.json` is included with a conservative daily cron schedule

## Required Vercel environment variables

- `DATABASE_URL`
  Use a real hosted Postgres URL. Do not use `localhost` on Vercel.
- `CRON_SECRET`
  A long random string. Vercel Cron will send it as a bearer token when configured.

## Optional environment variables

- `NEWSAPI_KEY`
- `ACLED_API_KEY`
- `ACLED_EMAIL`
- `FRED_API_KEY`
- `RELIEFWEB_APPNAME`
- `NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT`
- `NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_PRIMARY`

## Recommended database setup

Use a hosted Postgres provider with connection pooling. Prisma on serverless works best with a pooled connection string.

## Build behavior on Vercel

`vercel.json` uses:

- `buildCommand = npm run vercel-build`

That command runs:

1. `prisma migrate deploy`
2. `next build`

If `DATABASE_URL` is missing or invalid, Vercel builds should fail instead of deploying a broken persistence path.

## Cron behavior

The repo currently ships with a daily cron:

- `/api/cron/score-recompute` at `0 3 * * *`

This is conservative and works as a baseline. If you are on a Vercel plan that supports more frequent cron jobs, you can tighten the schedule in `vercel.json`.

Examples:

- every hour: `0 * * * *`
- every 15 minutes: `*/15 * * * *`

## First deploy checklist

1. Import the GitHub repo into Vercel.
2. Set `DATABASE_URL` to a hosted Postgres database.
3. Set `CRON_SECRET` to a long random value.
4. Set any optional provider API keys you want live.
5. Deploy.
6. After deploy, confirm `/api/cron/score-recompute` returns `401` without auth.
7. Confirm the cron route succeeds in production logs once Vercel runs it.

## Local note

If local Postgres is down, the app now fails closed for trend persistence instead of repeatedly spamming Prisma connection errors.