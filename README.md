# Are we Fcked?

A live global severity index for how bad things are right now, built from real-world events, environmental stress, health alerts, macro signals, and current news.

Live site: [https://arewefcked.com/](https://arewefcked.com/)

## What this project is

Are we Fcked? is a Next.js risk dashboard with a dark editorial wrapper around a real scoring pipeline.

It answers three questions:
- how bad are things globally right now
- why the score moved
- how a selected country compares with the global baseline

The tone is blunt. The scoring pipeline is not meant to be a joke.

## What it does today

- global score with a dial, verdict, confidence, and evidence-backed drivers
- country pages with searchable country selection and global comparison
- domain breakdown across conflict, unrest, macro, health, disasters, climate, cyber, and governance
- explainable evidence cards with source attribution
- source health and freshness reporting
- tracked-country top 5 / bottom 5 leaderboard
- Open Graph metadata and country-specific sharing URLs
- scheduled score persistence for trend history on Vercel

## Live data sources currently in runtime

These are the sources actively feeding runtime scores today:
- USGS Earthquake Catalog
- Open-Meteo
- GDELT
- WHO Disease Outbreak News
- World Bank indicators
- Google News RSS signal adapter

No mock runtime data is used in the live scoring path.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Prisma
- Postgres
- Zod
- Vitest
- Playwright
- Vercel Cron

## Architecture

```text
app/                    routes, pages, metadata, API handlers
components/             hero, dial, charts, evidence, rankings, source-health UI
lib/scoring/            banding, themes, aggregation, trend logic, recompute flow
lib/sources/            provider adapters and HTTP helpers
lib/countries/          country directory, matching, lookup helpers
lib/verdicts/           curated message library and selection
lib/db/                 Prisma access, persistence, availability checks
prisma/                 schema and seed logic
scripts/                local ingestion / recompute entrypoints
tests/                  unit and UI smoke tests
```

## Local development

### 1. Install

```bash
npm install
```

### 2. Configure env

Copy `.env.example` to `.env` and set what you need.

At minimum for basic local viewing, the app can run without a working database.
If you want persisted trend history, set a real `DATABASE_URL` and keep snapshot recompute running.

### 3. Start the app

```bash
npm run dev
```

### 4. Verify

```bash
npm test
npm run lint
npm run build
```

## Environment variables

### Required for persisted history / production cron

- `DATABASE_URL`
- `CRON_SECRET`

### Optional provider and monetization variables

- `NEWSAPI_KEY`
- `ACLED_API_KEY`
- `ACLED_EMAIL`
- `FRED_API_KEY`
- `RELIEFWEB_APPNAME`
- `NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT`
- `NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_PRIMARY`

## Scripts

- `npm run dev` - local Next.js dev server
- `npm run build` - production build
- `npm run start` - serve the production build
- `npm run lint` - lint the repo
- `npm test` - run unit and UI tests
- `npm run test:e2e` - run Playwright tests
- `npm run db:generate` - generate Prisma client
- `npm run db:migrate` - run Prisma dev migrations
- `npm run ingest:run` - execute ingestion flow entrypoint
- `npm run ingest:source:gdelt` - run GDELT ingest entrypoint
- `npm run ingest:source:newsapi` - run NewsAPI ingest entrypoint scaffold
- `npm run ingest:source:usgs` - run USGS ingest entrypoint
- `npm run ingest:source:openmeteo` - run Open-Meteo ingest entrypoint
- `npm run score:recompute` - rebuild and persist score snapshots
- `npm run seed:verdicts` - seed curated verdict messages

## Vercel deployment

This repo is set up for Vercel.

### Required Vercel env vars

- `DATABASE_URL`
- `CRON_SECRET`

### Optional Vercel env vars

- `NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT`
- `NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_PRIMARY`
- any optional provider keys listed above

### Build behavior

`vercel.json` uses:
- `buildCommand: npm run vercel-build`
- daily cron hitting `/api/cron/score-recompute`

`npm run vercel-build` runs:
1. `prisma migrate deploy`
2. `next build`

## Notes on data freshness

The app deliberately caches expensive upstream calls and degrades gracefully when a provider is slow or unavailable.

Current news-style sources are on daily cache windows to stay within conservative Vercel cron/update expectations.
Other measured sources can refresh on shorter windows where that improves the score without hammering providers.

## Notes

- ESLint has been swapped out for the far superior Ultracite, with Biome handling linting and formatting across the repo.

## Known limits

- historical drift only becomes fully useful once Postgres is running and score snapshots have accumulated over time
- some domains still rely on proxy/news monitoring rather than best-in-class structured datasets
- the homepage leaderboard is intentionally limited to tracked countries for cost and latency reasons
- placeholder `/api/news/*` clustering routes still return empty until a dedicated clustering pipeline is wired in

## Repository goal

This project should feel like a real intelligence dashboard with an irreverent headline layer on top, not a meme site wearing a chart costume.
If there is a tradeoff between being clever and being credible, credibility wins.
