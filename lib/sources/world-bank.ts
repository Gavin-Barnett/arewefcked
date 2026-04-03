import { z } from "zod";
import {
  getCountryByCode,
  starterCountries,
} from "@/lib/countries/starter-countries";
import type {
  SourceAdapter,
  SourceFetchResult,
  SourceFetchScope,
} from "@/lib/sources/base";
import { fetchWithTimeout } from "@/lib/sources/http";
import type { NormalizedEvent } from "@/lib/types/score";
import { clamp, round, toIsoString } from "@/lib/utils";

const seriesMetaSchema = z
  .object({
    lastupdated: z.string().optional(),
  })
  .passthrough();

const seriesRecordSchema = z.object({
  indicator: z.object({ id: z.string(), value: z.string() }),
  country: z.object({ id: z.string(), value: z.string() }),
  countryiso3code: z.string().optional(),
  date: z.string(),
  value: z.number().nullable(),
  unit: z.string().optional(),
  obs_status: z.string().optional(),
  decimal: z.number().optional(),
});

const indicatorPayloadSchema = z.tuple([
  seriesMetaSchema,
  z.union([
    z.array(seriesRecordSchema),
    z
      .object({
        value: z.array(seriesRecordSchema).default([]),
      })
      .passthrough(),
  ]),
]);

type IndicatorKey =
  | "inflation"
  | "unemployment"
  | "gdp_growth"
  | "fuel_imports";

type IndicatorConfig = {
  key: IndicatorKey;
  code: string;
  label: string;
  describe(value: number): string;
  score(value: number): number;
};

const indicatorConfigs: IndicatorConfig[] = [
  {
    key: "inflation",
    code: "FP.CPI.TOTL.ZG",
    label: "Inflation, consumer prices (annual %)",
    describe: (value) => `inflation ${value.toFixed(1)}%`,
    score: (value) => clamp(((value - 3) / 15) * 45, 0, 45),
  },
  {
    key: "unemployment",
    code: "SL.UEM.TOTL.ZS",
    label: "Unemployment, total (% of total labor force)",
    describe: (value) => `unemployment ${value.toFixed(1)}%`,
    score: (value) => clamp(((value - 4.5) / 14) * 24, 0, 24),
  },
  {
    key: "gdp_growth",
    code: "NY.GDP.MKTP.KD.ZG",
    label: "GDP growth (annual %)",
    describe: (value) => `GDP growth ${value.toFixed(1)}%`,
    score: (value) => clamp(((2.5 - value) / 8) * 22, 0, 22),
  },
  {
    key: "fuel_imports",
    code: "TM.VAL.FUEL.ZS.UN",
    label: "Fuel imports (% of merchandise imports)",
    describe: (value) =>
      `fuel imports ${value.toFixed(1)}% of merchandise imports`,
    score: (value) => clamp(((value - 10) / 25) * 20, 0, 20),
  },
];

type IndicatorSeries = {
  config: IndicatorConfig;
  url: string;
  lastUpdated: string | null;
  records: z.infer<typeof seriesRecordSchema>[];
  latencyMs: number;
};

function parseYearToIso(value: string) {
  const numericYear = Number(value);

  if (Number.isFinite(numericYear) && numericYear >= 1900) {
    return new Date(`${numericYear}-12-31T00:00:00.000Z`).toISOString();
  }

  return new Date().toISOString();
}

function latestNonNullRecord(records: z.infer<typeof seriesRecordSchema>[]) {
  return [...records]
    .sort((left, right) => Number(right.date) - Number(left.date))
    .find((record) => typeof record.value === "number");
}

function buildTitle(countryName: string, dominant: IndicatorKey) {
  switch (dominant) {
    case "inflation":
      return `Living costs are pressuring ${countryName}`;
    case "unemployment":
      return `Labour-market stress is elevated in ${countryName}`;
    case "gdp_growth":
      return `Weak growth is dragging on ${countryName}`;
    case "fuel_imports":
      return `Fuel dependence is keeping ${countryName} exposed`;
    default:
      return `Macro pressure remains elevated in ${countryName}`;
  }
}

async function fetchIndicator(
  scope: SourceFetchScope,
  config: IndicatorConfig
): Promise<IndicatorSeries> {
  const countries =
    scope.mode === "global"
      ? starterCountries.map((country) => country.code)
      : [scope.country.code];
  const url = new URL(
    `https://api.worldbank.org/v2/country/${countries.join(";")}/indicator/${config.code}`
  );
  url.searchParams.set("format", "json");
  url.searchParams.set("mrv", "4");
  url.searchParams.set("per_page", String(Math.max(countries.length * 4, 8)));

  const startedAt = Date.now();
  const response = await fetchWithTimeout(
    url,
    {
      headers: { Accept: "application/json" },
      next: { revalidate: 86_400 },
    },
    10_000
  );

  if (!response.ok) {
    throw new Error(
      `World Bank ${config.code} request failed with ${response.status}`
    );
  }

  const payload = await response.json();

  if (!Array.isArray(payload)) {
    throw new Error(
      `World Bank ${config.code} returned an unexpected payload shape.`
    );
  }

  const [meta, body] = indicatorPayloadSchema.parse(payload);
  const records = Array.isArray(body) ? body : body.value;

  return {
    config,
    url: url.toString(),
    lastUpdated: meta.lastupdated ?? null,
    records,
    latencyMs: Date.now() - startedAt,
  };
}

function normalizeCountryEvent(countryCode: string, series: IndicatorSeries[]) {
  const country = getCountryByCode(countryCode);

  if (!country) {
    return null;
  }

  const latestByIndicator = series
    .map((entry) => ({
      entry,
      record: latestNonNullRecord(
        entry.records.filter((record) => record.country.id === countryCode)
      ),
    }))
    .filter(
      (
        entry
      ): entry is {
        entry: IndicatorSeries;
        record: z.infer<typeof seriesRecordSchema>;
      } => Boolean(entry.record)
    );

  if (latestByIndicator.length === 0) {
    return null;
  }

  const contributions = latestByIndicator.map(({ entry, record }) => ({
    key: entry.config.key,
    label: entry.config.label,
    score: entry.config.score(record.value ?? 0),
    value: record.value ?? 0,
    year: record.date,
    description: entry.config.describe(record.value ?? 0),
  }));

  const totalSeverity = clamp(
    contributions.reduce((total, item) => total + item.score, 0),
    0,
    100
  );

  if (totalSeverity < 8) {
    return null;
  }

  const dominant = [...contributions].sort(
    (left, right) => right.score - left.score
  )[0];
  const latestYear = contributions
    .map((item) => Number(item.year))
    .sort((left, right) => right - left)[0];
  const confidence = round(
    clamp(0.66 + latestByIndicator.length * 0.05, 0.66, 0.86),
    2
  );

  return {
    id: `world-bank:${country.code}:${latestYear}`,
    source: "world_bank",
    sourceType: "indicator",
    title: buildTitle(country.name, dominant?.key ?? "inflation"),
    summary: contributions.map((item) => item.description).join(", "),
    countryCodes: [country.code],
    region: country.region,
    occurredAt: parseYearToIso(String(latestYear)),
    ingestedAt: new Date().toISOString(),
    domain: "macroeconomic",
    severityRaw: totalSeverity,
    severityNormalized: totalSeverity,
    confidence,
    tags: contributions.map((item) => item.key),
    metadata: {
      globalRelevance: false,
      indicators: Object.fromEntries(
        contributions.map((item) => [
          item.key,
          {
            label: item.label,
            value: item.value,
            year: item.year,
            score: round(item.score, 1),
          },
        ])
      ),
    },
  } satisfies NormalizedEvent;
}

export const worldBankAdapter: SourceAdapter = {
  key: "world_bank",
  name: "World Bank macro indicators",
  async fetch(scope): Promise<SourceFetchResult> {
    const settled = await Promise.allSettled(
      indicatorConfigs.map((config) => fetchIndicator(scope, config))
    );
    const successes = settled.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : []
    );
    const failures = settled.flatMap((result) =>
      result.status === "rejected" ? [result.reason] : []
    );

    if (successes.length === 0) {
      const firstFailure = failures[0];
      return {
        sourceKey: "world_bank",
        sourceName: "World Bank macro indicators",
        sourceUrl: "https://api.worldbank.org/",
        events: [],
        notes: [],
        health: {
          sourceKey: "world_bank",
          name: "World Bank macro indicators",
          status: "offline",
          freshness: "stale",
          lastSuccessfulSync: null,
          lastAttemptAt: new Date().toISOString(),
          outageMessage:
            firstFailure instanceof Error
              ? firstFailure.message
              : "Unknown World Bank error",
          latencyMs: null,
          active: true,
          notes:
            "World Bank macro indicators failed during fetch or validation.",
        },
      };
    }

    const countries =
      scope.mode === "global"
        ? starterCountries.map((country) => country.code)
        : [scope.country.code];
    const events = countries
      .map((countryCode) => normalizeCountryEvent(countryCode, successes))
      .flatMap((event) => (event ? [event] : []));
    const latestUpdated =
      successes
        .map((entry) => entry.lastUpdated)
        .filter((value): value is string => Boolean(value))
        .sort(
          (left, right) => new Date(right).getTime() - new Date(left).getTime()
        )[0] ?? null;
    const averageLatency = Math.round(
      successes.reduce((total, entry) => total + entry.latencyMs, 0) /
        Math.max(successes.length, 1)
    );
    const degraded = failures.length > 0;
    const ageDays = latestUpdated
      ? (Date.now() - new Date(latestUpdated).getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    return {
      sourceKey: "world_bank",
      sourceName: "World Bank macro indicators",
      sourceUrl: successes[0]?.url ?? "https://api.worldbank.org/",
      events,
      notes: [
        "World Bank indicators add slower-moving macro, cost-of-living, labour, and fuel-import exposure baselines.",
        "These are structural signals, not minute-by-minute market tape, so freshness is judged against dataset update cadence.",
        ...(degraded
          ? [
              `${failures.length} indicator request${failures.length === 1 ? "" : "s"} failed during this refresh, so surviving macro baselines were kept.`,
            ]
          : []),
      ],
      health: {
        sourceKey: "world_bank",
        name: "World Bank macro indicators",
        status: degraded ? "degraded" : "operational",
        freshness:
          ageDays < 120 ? "fresh" : ageDays < 365 ? "delayed" : "stale",
        lastSuccessfulSync: toIsoString(latestUpdated),
        lastAttemptAt: new Date().toISOString(),
        outageMessage: degraded
          ? `${failures.length} World Bank indicator request${failures.length === 1 ? "" : "s"} failed during refresh.`
          : null,
        latencyMs: averageLatency,
        active: true,
        notes: `${events.length} country macro snapshot${events.length === 1 ? "" : "s"} cleared the stress threshold.`,
      },
    };
  },
};
