# AGENTS.md — Project brief for **How Fucked Are We?**

## 1) Product summary
Build a production-ready website that estimates how bad the world situation is right now using real data, current events, and explainable scoring.

The site has a large central dial inspired by emergency-risk meters. The primary hero message is a bold, irreverent, human-readable status line such as:
- “We are slightly fucked.”
- “Things aren’t that fucked right now.”
- “We are entering a concerning amount of fucked.”
- “We are, objectively, pretty fucked.”

Tone is darkly funny, but the system underneath must be serious, transparent, source-driven, and technically rigorous.

Default view = **global score**.
Users can switch to **country mode** to view a country-specific score, breakdown, trends, and local headlines.

This is **not** a meme-only site. It should feel like:
- part doomsday clock
- part Bloomberg terminal
- part global risk dashboard
- part satirical editorial wrapper around a serious data pipeline

## 2) Mission
Create a site that answers:
- How bad are things right now?
- Why does the system think that?
- What changed today or this week?
- Is my country better or worse than the global average?

Every visible score must be backed by real inputs and citations.
No mock data in production.
No fake charts.
No made-up headlines.
No hidden manual overrides unless clearly exposed in admin tooling.

## 3) Non-negotiables
- Use real APIs and real datasets only.
- Every score must be explainable with a visible breakdown.
- Every headline or event shown must include source attribution and outbound links.
- The dial must work globally and by country.
- Build the app so data ingestion, scoring, API routes, and UI are cleanly separated.
- The humorous tone must never distort the underlying score calculation.
- The wording can be playful, but the evidence must remain sober and traceable.
- The app must degrade gracefully if one data source fails.
- Keep the system auditable: store raw inputs, transformed metrics, final scores, and score-change reasons.

## 4) Product concept
The homepage should include:
1. A large dial showing the current score from 0 to 100.
2. A large adjacent headline message.
3. A concise “why” summary in 2–4 bullet points.
4. Score trend vs 24h / 7d / 30d.
5. Major driver cards: conflict, economy, disease, disaster, climate, civil unrest, governance, cyber/infra.
6. A dense evidence section underneath with charts, indicators, raw metrics, and recent news.
7. Search or select by country.
8. A comparison view: selected country vs global baseline.
9. A methodology page that explains the score in plain English.
10. A data integrity page listing source freshness, last successful sync, and outages.

## 5) Tone and writing rules
Tone:
- Dry
- Witty
- Blunt
- Not goofy
- Not juvenile for the sake of it
- Avoid forced internet slang overload

The site voice should sound like a cynical analyst, not a teenager.

Examples of good voice:
- “We are slightly fucked, but not uniquely so.”
- “The vibes are bad, and unfortunately the data agrees.”
- “Things are tense, expensive, and unusually combustible.”
- “Not ideal. Not unprecedented. Still bad.”
- “A manageable amount of fucked, for now.”

Examples of bad voice:
- “LOL we’re doomed fr fr.”
- “Bro it’s so over.”
- “Mega ultra turbo fucked!!!”

## 6) Score philosophy
The score is a weighted composite risk index from **0 to 100**.

Interpretation:
- 0 = unusually calm / stable / low risk
- 100 = extreme instability / multi-domain crisis conditions

The score should blend:
- current events velocity
- event severity
- cross-domain breadth
- persistence
- geographic spread
- confidence / source quality

Do **not** make the score purely headline-count based.
A flood of media coverage alone should not drive the index.
Use measured signals from multiple domains.

## 7) Risk domains
Use these domains as first-class components of the score:

1. **Armed conflict & security**
   - war events
   - missile/drone attacks
   - civilian casualties
   - troop escalations
   - terrorism incidents
   - border clashes

2. **Civil unrest & political instability**
   - protests
   - riots
   - coup attempts
   - emergency declarations
   - election violence
   - state repression spikes

3. **Macroeconomic stress**
   - inflation stress
   - unemployment deterioration
   - sovereign bond stress where available
   - rapid FX shocks
   - recession signals
   - food/energy cost pressure

4. **Public health & bio risk**
   - outbreaks
   - unusual disease events
   - hospitalization stress signals where available
   - public health emergency declarations

5. **Natural disasters & geophysical events**
   - earthquakes
   - floods
   - cyclones / hurricanes
   - heatwaves
   - wildfire conditions
   - volcanic events

6. **Climate & environmental stress**
   - extreme heat anomalies
   - air quality deterioration
   - drought conditions
   - wildfire smoke severity
   - flood probability / disaster warnings where possible

7. **Cyber & infrastructure disruption**
   - major outages
   - grid failures
   - telecom disruption
   - cyber incidents with national or critical-infra impact
   - shipping/logistics chokepoints if data is reliable

8. **Governance & institutional stress**
   - sanctions escalations
   - constitutional crises
   - high-level assassinations
   - emergency powers expansion
   - sudden regime instability signals

## 8) Scoring model
Implement scoring in layers.

### Layer A — Domain sub-scores
Each domain gets a score from 0–100.
Each domain score is computed from:
- event severity
- recency decay
- event count normalization
- persistence / repeat events
- geographic spread
- source confidence

### Layer B — Global / country aggregation
Combine domain scores with weights.
Start with configurable default weights:
- conflict_security: 0.22
- civil_unrest: 0.14
- macroeconomic: 0.14
- public_health: 0.10
- natural_disaster: 0.13
- climate_environment: 0.10
- cyber_infra: 0.09
- governance: 0.08

Weights must be configurable in code and admin config.

### Layer C — Interaction penalties / boosts
Add controlled modifiers for:
- multi-domain simultaneous stress
- sudden acceleration in the past 72 hours
- unusually broad geographic spread
- repeated severe events in same country / region

### Layer D — Confidence adjustment
If a score is driven by weak or sparse coverage, reduce confidence and expose this in UI.
Display:
- score
- confidence
- freshness

## 9) Important anti-bias rules
- Avoid over-scoring countries simply because they receive more English-language press coverage.
- Normalize event/news intensity by source saturation where possible.
- Prefer structured event datasets for conflict/disaster signals over raw headlines alone.
- Use news primarily for explanation, corroboration, and event acceleration detection.
- Deduplicate near-identical articles.
- Penalize low-quality or duplicate sources.
- Store article clusters rather than naïve counts.

## 10) Country support
Country mode must:
- accept ISO country codes
- show country score
- compare against global score
- show domain breakdown for that country
- show local and regional relevant headlines
- show trend windows: 24h, 7d, 30d
- support map/list selection and text search

If country data is sparse:
- show score with lower confidence
- explain why confidence is lower
- fall back to regional context where appropriate

## 11) Data sources to prioritize
Favor official or well-established datasets with documented update cadence.

### News / event discovery
- GDELT for global event/news monitoring, geo signals, and rapid updates.
- NewsAPI for article retrieval, source diversity, and explanatory coverage.

### Conflict / unrest
- ACLED for political violence, protest, and disorder event data.

### Disasters / hazards
- USGS Earthquake Catalog for earthquake events.
- ReliefWeb for disaster/humanitarian updates.
- Weather / air quality APIs for heat, smoke, and environmental stress.

### Macro / structural data
- World Bank indicators for slower-moving structural baselines.
- FRED where applicable for economic series access.

### Weather / environment
- Open-Meteo for weather and air-quality driven stress indicators.

Do not hardcode any one vendor too tightly. Wrap each source behind adapters.

## 12) Source adapter architecture
Create a `sources/` layer with one adapter per provider.
Each adapter returns normalized records.

Example normalized event shape:

```ts
export type NormalizedEvent = {
  id: string;
  source: string;
  sourceType: "event" | "news" | "indicator";
  title: string;
  summary?: string;
  url?: string;
  countryCodes: string[];
  region?: string;
  occurredAt: string;
  ingestedAt: string;
  domain:
    | "conflict_security"
    | "civil_unrest"
    | "macroeconomic"
    | "public_health"
    | "natural_disaster"
    | "climate_environment"
    | "cyber_infra"
    | "governance";
  severityRaw?: number;
  severityNormalized?: number;
  confidence?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
};
```

All providers must map into normalized records before scoring.

## 13) Freshness policy
Set source freshness policies, for example:
- GDELT: near-real-time / frequent polling
- NewsAPI: frequent polling
- ACLED: as available by dataset cadence
- USGS earthquakes: frequent polling
- Open-Meteo: scheduled refresh
- World Bank / FRED: daily or slower depending on indicator

Expose a freshness badge in the UI:
- live-ish
- fresh
- delayed
- stale

## 14) Suggested stack
Use a modern full-stack TypeScript stack.

Preferred stack:
- **Next.js 15+** with App Router
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** for primitives
- **Recharts** or **Visx** for charts
- **Postgres** for persistence
- **Prisma** for ORM
- **Redis** for caching and short-lived score artifacts
- **Upstash / Vercel cron** or equivalent scheduled jobs
- **Zod** for runtime validation
- **Pino** for structured logs
- **Playwright** for basic end-to-end tests

If the repo is deliberately Vite-only, preserve that choice, but Next.js is preferred here because:
- server routes
- SSR for SEO
- scheduled ingestion friendliness
- easier country pages and metadata

## 15) UI direction
Homepage hero:
- Large dial left
- Giant verdict headline right
- Small methodology / confidence / last updated row underneath

Below fold:
- score timeline
- domain breakdown cards
- driver explanations
- news clusters with source links
- raw metric tables
- country comparison section

Visual style:
- dark, newsroom / control room aesthetic
- clean typography
- strong data density without feeling messy
- subtle motion only
- serious information design with an irreverent headline layer

The dial should look premium and ominous, not cartoonish.

## 16) Dial bands
Use 10 score bands.
The band name is short.
The hero sentence is verbose.

### Band 0 — 0 to 9
Short label ideas:
- Not Fucked
- Calm-ish
- Weirdly Fine
- Suspiciously Stable
- Low Chaos

Headline examples:
- Things aren’t that fucked right now.
- Against all odds, things are holding together.
- This is a rare moment of relative planetary competence.
- Not good exactly, but not especially fucked.
- The global situation is behaving itself for now.

### Band 1 — 10 to 19
Short label ideas:
- Slightly Fucked
- A Little Cooked
- Mildly Concerning
- Light Trouble
- Mostly Fine

Headline examples:
- We are slightly fucked.
- There is trouble, but not the screaming kind.
- Things are wobbling, not collapsing.
- Mild concern is justified.
- The vibes are off, but survivably so.

### Band 2 — 20 to 29
Short label ideas:
- Moderately Fucked
- Noticeably Bad
- Worrying
- Tense
- Early Trouble

Headline examples:
- We are entering a noticeable amount of fucked.
- Things are not spiraling, but they are leaning.
- The data suggests a developing mess.
- This is where concern starts earning its keep.
- Not a crisis everywhere, but enough places are trying.

### Band 3 — 30 to 39
Short label ideas:
- Pretty Fucked
- Escalating
- Unpleasantly Hot
- Spicy
- Deteriorating

Headline examples:
- We are pretty fucked, in measurable ways.
- Several systems are being uncooperative at once.
- The global dashboard has stopped being reassuring.
- Enough red lights are blinking to ruin the mood.
- This is now a statistically annoying reality.

### Band 4 — 40 to 49
Short label ideas:
- Deeply Fucked
- Serious Trouble
- Bad Enough
- Red Zone
- Actively Bad

Headline examples:
- We are now in serious, evidence-backed fucked.
- Multiple domains are misbehaving simultaneously.
- The trends are worsening faster than is polite.
- The world is currently underperforming expectations.
- The situation has graduated from tense to ugly.

### Band 5 — 50 to 59
Short label ideas:
- Severely Fucked
- High Alert
- Very Bad
- Unstable
- Hard To Ignore

Headline examples:
- We are severely fucked, and not just for dramatic effect.
- This is not panic, it is pattern recognition.
- The numbers have become difficult to defend.
- The system is absorbing too many shocks at once.
- Things are bad enough that optimism now needs citations.

### Band 6 — 60 to 69
Short label ideas:
- Intensely Fucked
- Critically Bad
- Boiling
- Acute Trouble
- Multi-Front Bad

Headline examples:
- We are intensely fucked across multiple fronts.
- The overlap of crises is doing real work here.
- Too many serious things are happening at the same time.
- The data has entered the part where sober people swear.
- This is broad, fast, and getting expensive.

### Band 7 — 70 to 79
Short label ideas:
- Extremely Fucked
- Crisis Mode
- Very Cooked
- Severe Instability
- Wide-Area Bad

Headline examples:
- We are extremely fucked, with receipts.
- This is what sustained multi-domain crisis looks like.
- The dashboard is no longer asking for calm interpretation.
- Reality is currently outperforming satire.
- The situation is large, loud, and compounding.

### Band 8 — 80 to 89
Short label ideas:
- Catastrophically Fucked
- Historically Bad
- Disaster Stack
- Systemic Breakdown
- Mega Bad

Headline examples:
- We are catastrophically fucked right now.
- This is a historically bad clustering of events.
- The world has assembled a truly offensive risk profile.
- Multiple severe systems are failing in chorus.
- The phrase “not ideal” has left the building.

### Band 9 — 90 to 100
Short label ideas:
- Completely Fucked
- Apocalyptically Bad
- Midnight Adjacent
- Terminally Bad
- Beyond Defensible

Headline examples:
- We are completely fucked, on several spreadsheets.
- The distinction between crisis and era-defining breakdown is evaporating.
- The meter has run out of diplomatic phrasing.
- This is what maximal red looks like.
- Things are so bad the methodology page now feels ominous.

## 17) Extended pool of short labels
Use these as alternatives or rotation candidates for scale labels, filters, and UI copy.

### Lower end
- Fine, Somehow
- Low Drama
- Stable Enough
- Still Standing
- Manageable
- Quietly Functional
- Barely Troubling
- Contained Mess
- Lightly Singed
- Not On Fire

### Mid range
- Fraying
- Bumpy
- Concerning
- Unsteady
- Strained
- Heating Up
- Slippery
- Precarious
- Uncomfortable
- Unfriendly
- Rough Patch
- Thin Ice
- Elevated Risk
- Creeping Trouble
- Bad Gradient

### Upper range
- Volatile
- Severe
- Dangerous
- Breakdown Territory
- Crisis Stack
- Compound Failure
- System Stress
- Full Tilt Bad
- Alarmingly Real
- Overtly Bad
- Hard Red
- Global Mess
- Expensive Problems
- Multi-System Failure
- Ominous

### Max range
- Catastrophic
- Hellish
- Ruinous
- Terminal
- Overclocked Doom
- Civilization Stress Test
- Historically Unwell
- Fire Everywhere
- Collapse Energy
- Total Failure Adjacent

## 18) Message generation system
We want **hundreds** of hero messages, but they must feel intentional, not AI-slop.

Implement a curated message library with metadata.
Do not generate arbitrary text at runtime from scratch.
Instead:
- store a large reviewed message set in JSON or database
- tag messages by score band, tone, severity, and region suitability
- select from the library based on band + context + freshness + repetition rules

Message object example:

```ts
export type VerdictMessage = {
  id: string;
  band: number;
  tone: "dry" | "grim" | "wry" | "clinical";
  text: string;
  allowedScopes: Array<"global" | "country">;
  minConfidence?: number;
  tags?: string[];
};
```

Rules:
- avoid showing the same message too frequently
- reserve the funniest lines for higher-confidence scores
- keep country-specific messages geopolitically neutral unless explicitly backed by data
- do not punch down at populations suffering disasters or wars
- the joke should target the situation, not victims

## 19) Starter verdict library targets
Create at least:
- 30 messages for each score band = 300 total
- 10 short labels per band
- 20 subhead templates for methodology blurbs

Example methodology blurbs:
- “Driven mainly by conflict intensity, disaster events, and elevated economic stress.”
- “Held down by lower cross-domain severity despite heavy news flow.”
- “Rising on faster event acceleration across multiple regions.”
- “Confidence reduced due to sparse or delayed local data.”

## 20) News handling rules
News should support the score, not define it alone.

Pipeline:
1. ingest articles
2. dedupe by URL + title similarity + cluster similarity
3. extract country/entity references
4. classify domain
5. score article quality and relevance
6. cluster into story groups
7. surface clusters as evidence cards

Each cluster should show:
- title
- source mix
- representative links
- why it matters
- which domain it affected
- effect on score if measurable

## 21) Country mapping strategy
Every event or article should map to one or more countries when possible.
Use ISO-3166 country codes.
Store:
- primary country
- secondary affected countries
- region
- global relevance flag

Some events should affect global score without being tied to only one country, for example:
- major war escalation
- global market shock
- pandemic alerts
- large cyber disruption with international spillover

## 22) Persistence model
Use Postgres tables for at least:
- sources
- ingestion_runs
- raw_articles
- raw_events
- normalized_events
- country_scores
- global_scores
- score_components
- verdict_messages
- news_clusters
- countries
- source_health

Keep historical snapshots.
We need time-series queries and the ability to explain score changes over time.

## 23) API design
Create clear server routes or handlers for:
- `GET /api/score/global`
- `GET /api/score/country/{iso}`
- `GET /api/scores/trend/global`
- `GET /api/scores/trend/country/{iso}`
- `GET /api/news/global`
- `GET /api/news/country/{iso}`
- `GET /api/methodology`
- `GET /api/source-health`
- `GET /api/countries/search?q=`

All score endpoints should return:
- current score
- band
- short label
- verdict message
- confidence
- freshness
- domain breakdown
- top drivers
- last updated

## 24) Explainability requirements
For every score page show:
- why the score is what it is
- top positive contributors
- top negative contributors if relevant
- biggest changes since yesterday / last week
- which evidence items materially moved the score
- confidence and source freshness

Do not ship a black-box score.

## 25) Safety / editorial constraints
- No incitement, threat glorification, or celebratory framing of war/disaster.
- Avoid dehumanizing language.
- Avoid jokes aimed at dead or vulnerable people.
- Keep copy sharp without being cruel.
- If a country is experiencing tragedy, the wryness should remain focused on systems and conditions, not populations.

## 26) Performance goals
- Homepage server render fast enough for excellent perceived load.
- Cache score endpoints aggressively with freshness windows.
- Background jobs should update data continuously.
- The hero dial and verdict should render immediately from cached latest score.
- Dense data panels can stream in after initial paint.

## 27) Testing requirements
Add tests for:
- source adapter validation
- score calculations
- band mapping
- verdict selection
- country resolution
- article deduplication
- API response schemas
- a few basic UI smoke tests

No silent NaNs.
No unbounded score explosions.
No impossible band values.

## 28) Definition of done for phase 1
Phase 1 is complete when:
- global score works end to end on real data
- at least 3 serious data sources are integrated
- country pages work for a starter set of countries
- dial, verdict, and evidence sections are live
- methodology page exists
- source health page exists
- no mock data remains in runtime paths

## 29) First implementation order
1. Scaffold app shell and design system.
2. Create database schema.
3. Add source adapters for first providers.
4. Add normalization pipeline.
5. Build scoring engine.
6. Build global score API.
7. Build homepage hero.
8. Build country mode.
9. Build evidence panels.
10. Build methodology page.
11. Build source health page.
12. Expand verdict library.

## 30) Phase 1 recommended source set
Start with this exact minimum viable real-data stack:
- GDELT
- NewsAPI
- USGS Earthquake Catalog
- Open-Meteo air quality / weather

Phase 2:
- ACLED
- ReliefWeb
- FRED
- World Bank

## 31) Repo conventions
- Keep logic readable and boring.
- Prefer small modules.
- Avoid giant god files.
- Separate pure scoring logic from IO.
- Use strict TypeScript.
- Validate all provider payloads with Zod.
- Put feature flags around unfinished sources.
- Add comments only where they help future maintainers.

## 32) Required directories
Use a structure similar to:

```text
app/
components/
components/dial/
components/charts/
components/news/
lib/
lib/scoring/
lib/sources/
lib/normalization/
lib/countries/
lib/verdicts/
lib/cache/
lib/db/
prisma/
scripts/
public/
tests/
```

## 33) Commands Codex should set up
Create scripts for:
- dev
- build
- lint
- test
- test:e2e
- db:generate
- db:migrate
- ingest:run
- ingest:source:gdelt
- ingest:source:newsapi
- ingest:source:usgs
- ingest:source:openmeteo
- score:recompute
- seed:verdicts

## 34) First tasks Codex should do immediately
When starting from an empty repo, do this first:
1. Initialize a Next.js + TypeScript + Tailwind project.
2. Add Prisma + Postgres schema.
3. Add a clean homepage layout with placeholder sections but no fake numbers.
4. Implement shared score types.
5. Implement band mapping helpers.
6. Implement the verdict message library and seed script.
7. Add the first live source adapter (USGS is easiest).
8. Add second live source adapter (Open-Meteo).
9. Add initial global score route.
10. Add a visible “data still sparse” state until enough providers are live.

## 35) Prompting guidance for Codex
When a task is large:
- plan before coding
- propose file changes first
- then implement in small verified steps
- run tests after each major step
- explain assumptions
- do not invent undocumented provider fields
- if an API requires credentials, scaffold env usage cleanly and stop at the integration boundary

## 36) Environment variables
Expect env variables such as:

```bash
DATABASE_URL=
NEWSAPI_KEY=
ACLED_API_KEY=
ACLED_EMAIL=
FRED_API_KEY=
RELIEFWEB_APPNAME=
```

Only wire variables that are actually required.
Do not commit secrets.

## 37) Open questions to resolve in repo docs later
- exact weighting calibration
- whether cyber risk gets a strong enough real-time data source early on
- whether country pages support subnational breakdown later
- whether we build a world map in phase 1 or phase 2
- whether message tone differs by scope or confidence

## 38) Product naming ideas
Working product names:
- How Fucked Are We?
- Fucked Meter
- Global Fucked Index
- The F-Index
- Are We Cooked?
- World Risk Dial
- Midnight-ish
- The Situation Index
- Planet Status
- Doom, Quantified

Preferred recommendation:
**How Fucked Are We?**
Reason: instantly understandable, memorable, and aligned with the hero copy.

## 39) Final build standard
The finished product should feel like a real publication-grade intelligence dashboard with a darkly comic editorial layer on top.

It must be:
- credible
- auditable
- fast
- visually strong
- fun to use
- impossible to mistake for fake data

If there is a tradeoff between cleverness and trustworthiness, choose trustworthiness.
