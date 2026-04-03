import { z } from "zod";
import { resolveCountryCodesFromText } from "@/lib/countries/match";
import type {
  SourceAdapter,
  SourceFetchResult,
  SourceFetchScope,
} from "@/lib/sources/base";
import { fetchWithTimeout } from "@/lib/sources/http";
import type { NormalizedEvent, RiskDomain } from "@/lib/types/score";
import { clamp, hashString, toIsoString } from "@/lib/utils";

const gdeltArticleSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  seendate: z.string(),
  domain: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  sourcecountry: z.string().nullable().optional(),
});

const gdeltResponseSchema = z.object({
  articles: z.array(gdeltArticleSchema).default([]),
});

type QueryConfig = {
  domain: RiskDomain;
  baseSeverity: number;
  label: string;
  query: string;
  keywords: string[];
};

const queryConfigs: QueryConfig[] = [
  {
    domain: "conflict_security",
    label: "Conflict & security",
    baseSeverity: 38,
    query:
      "(war OR missile OR drone OR shelling OR invasion OR airstrike OR frontline OR ceasefire)",
    keywords: [
      "war",
      "missile",
      "drone",
      "shelling",
      "invasion",
      "airstrike",
      "frontline",
      "ceasefire",
    ],
  },
  {
    domain: "civil_unrest",
    label: "Civil unrest",
    baseSeverity: 30,
    query: "(protest OR riot OR unrest OR crackdown OR clashes OR strike)",
    keywords: ["protest", "riot", "unrest", "crackdown", "clashes", "strike"],
  },
  {
    domain: "governance",
    label: "Governance",
    baseSeverity: 28,
    query:
      "(sanctions OR coup OR parliament OR emergency powers OR cabinet crisis OR martial law)",
    keywords: [
      "sanctions",
      "coup",
      "parliament",
      "emergency",
      "cabinet",
      "martial law",
    ],
  },
  {
    domain: "macroeconomic",
    label: "Macroeconomic stress",
    baseSeverity: 26,
    query:
      "(inflation OR recession OR debt crisis OR currency shock OR cost of living OR fuel crisis OR energy prices OR food prices)",
    keywords: [
      "inflation",
      "recession",
      "debt",
      "currency",
      "cost of living",
      "fuel",
      "energy",
      "food",
    ],
  },
  {
    domain: "cyber_infra",
    label: "Cyber & infrastructure",
    baseSeverity: 32,
    query:
      "(cyberattack OR ransomware OR blackout OR grid outage OR telecom outage OR internet shutdown)",
    keywords: [
      "cyberattack",
      "ransomware",
      "blackout",
      "grid",
      "telecom",
      "internet shutdown",
    ],
  },
];

function parseSeenDate(value: string) {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);

  if (!match) {
    return new Date(value).toISOString();
  }

  const [, year, month, day, hour, minute, second] = match;
  return new Date(
    `${year}-${month}-${day}T${hour}:${minute}:${second}Z`
  ).toISOString();
}

function buildQuery(scope: SourceFetchScope, config: QueryConfig) {
  if (scope.mode === "country") {
    return `"${scope.country.name}" AND ${config.query}`;
  }

  return config.query;
}

function scoreArticle(config: QueryConfig, title: string, occurredAt: string) {
  const normalizedTitle = title.toLowerCase();
  const keywordHits = config.keywords.filter((keyword) =>
    normalizedTitle.includes(keyword)
  ).length;
  const ageHours = Math.max(
    0,
    (Date.now() - new Date(occurredAt).getTime()) / (1000 * 60 * 60)
  );
  const recencyBoost = clamp(18 - ageHours / 4, 0, 18);

  return clamp(config.baseSeverity + keywordHits * 4.5 + recencyBoost, 10, 92);
}

async function fetchQuery(scope: SourceFetchScope, config: QueryConfig) {
  const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
  url.searchParams.set("query", buildQuery(scope, config));
  url.searchParams.set("mode", "artlist");
  url.searchParams.set("maxrecords", scope.mode === "global" ? "5" : "4");
  url.searchParams.set("timespan", scope.mode === "global" ? "3d" : "5d");
  url.searchParams.set("format", "json");

  const startedAt = Date.now();
  const response = await fetchWithTimeout(
    url,
    {
      headers: { Accept: "application/json" },
      next: { revalidate: 86_400 },
    },
    8000
  );

  if (!response.ok) {
    throw new Error(`GDELT request failed with ${response.status}`);
  }

  const payload = gdeltResponseSchema.parse(await response.json());

  return {
    config,
    url: url.toString(),
    latencyMs: Date.now() - startedAt,
    articles: payload.articles,
  };
}

function normalizeArticle(
  scope: SourceFetchScope,
  config: QueryConfig,
  article: z.infer<typeof gdeltArticleSchema>
) {
  const occurredAt = parseSeenDate(article.seendate);
  const countryCodes = resolveCountryCodesFromText(
    article.title,
    scope.mode === "country" ? scope.country.code : undefined
  );
  const severity = scoreArticle(config, article.title, occurredAt);
  const outlet = article.domain ?? "monitored outlet";
  const language = article.language
    ? article.language.toUpperCase()
    : "unknown language";

  return {
    id: `gdelt:${config.domain}:${hashString(article.url)}`,
    source: "gdelt",
    sourceType: "news",
    title: article.title.trim(),
    summary:
      countryCodes.length > 0
        ? `GDELT picked up fresh ${config.label.toLowerCase()} coverage affecting ${countryCodes.join(", ")}. Indexed from ${outlet} in ${language}.`
        : `GDELT picked up fresh ${config.label.toLowerCase()} coverage with cross-border or unclear geography. Indexed from ${outlet} in ${language}.`,
    url: article.url,
    countryCodes,
    occurredAt,
    ingestedAt: new Date().toISOString(),
    domain: config.domain,
    severityRaw: severity,
    severityNormalized: severity,
    confidence: 0.58,
    tags: [
      config.domain,
      ...(article.language ? [article.language] : []),
      ...(article.domain ? [article.domain] : []),
    ],
    metadata: {
      globalRelevance: countryCodes.length === 0,
      sourceCountry: article.sourcecountry ?? null,
      outlet,
      queryLabel: config.label,
    },
  } satisfies NormalizedEvent;
}

export function dedupeGdeltEvents(events: NormalizedEvent[]) {
  const merged = new Map<string, NormalizedEvent>();

  for (const event of events) {
    const key = event.url?.toLowerCase() ?? event.title.toLowerCase();
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, event);
      continue;
    }

    const keepExisting =
      (existing.severityNormalized ?? 0) >= (event.severityNormalized ?? 0);
    const dominant = keepExisting ? existing : event;
    const mergedCountries = [
      ...new Set([...existing.countryCodes, ...event.countryCodes]),
    ];
    const mergedTags = [
      ...new Set([...(existing.tags ?? []), ...(event.tags ?? [])]),
    ];

    merged.set(key, {
      ...dominant,
      countryCodes: mergedCountries,
      tags: mergedTags,
      metadata: {
        ...(dominant.metadata ?? {}),
        globalRelevance: mergedCountries.length === 0,
      },
      ingestedAt: new Date().toISOString(),
    });
  }

  return [...merged.values()];
}

export const gdeltAdapter: SourceAdapter = {
  key: "gdelt",
  name: "GDELT Global Event Monitor",
  async fetch(scope): Promise<SourceFetchResult> {
    const settled = await Promise.allSettled(
      queryConfigs.map((config) => fetchQuery(scope, config))
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
        sourceKey: "gdelt",
        sourceName: "GDELT Global Event Monitor",
        sourceUrl: "https://api.gdeltproject.org/api/v2/doc/doc",
        events: [],
        notes: [],
        health: {
          sourceKey: "gdelt",
          name: "GDELT Global Event Monitor",
          status: "offline",
          freshness: "stale",
          lastSuccessfulSync: null,
          lastAttemptAt: new Date().toISOString(),
          outageMessage:
            firstFailure instanceof Error
              ? firstFailure.message
              : "Unknown GDELT error",
          latencyMs: null,
          active: true,
          notes:
            "The GDELT current-events monitor failed during fetch or validation.",
        },
      };
    }

    const events = dedupeGdeltEvents(
      successes.flatMap((result) =>
        result.articles.map((article) =>
          normalizeArticle(scope, result.config, article)
        )
      )
    );
    const latestSeen =
      events
        .map((event) => new Date(event.occurredAt).getTime())
        .sort((left, right) => right - left)[0] ?? Date.now();
    const averageLatency = Math.round(
      successes.reduce((total, result) => total + result.latencyMs, 0) /
        Math.max(successes.length, 1)
    );
    const degraded = failures.length > 0;
    const ageHours = (Date.now() - latestSeen) / (1000 * 60 * 60);

    return {
      sourceKey: "gdelt",
      sourceName: "GDELT Global Event Monitor",
      sourceUrl:
        successes[0]?.url ?? "https://api.gdeltproject.org/api/v2/doc/doc",
      events,
      notes: [
        "GDELT adds broad multilingual monitoring for conflict, unrest, governance, cyber, and economic pressure.",
        "This feed improves current-events coverage, but it is still treated as proxy monitoring rather than a full structured event ledger like ACLED.",
        ...(degraded
          ? [
              `${failures.length} GDELT domain quer${failures.length === 1 ? "y" : "ies"} failed during this refresh, so surviving results were kept.`,
            ]
          : []),
      ],
      health: {
        sourceKey: "gdelt",
        name: "GDELT Global Event Monitor",
        status: degraded ? "degraded" : "operational",
        freshness:
          ageHours < 36
            ? "live-ish"
            : ageHours < 72
              ? "fresh"
              : ageHours < 120
                ? "delayed"
                : "stale",
        lastSuccessfulSync: toIsoString(new Date(latestSeen)),
        lastAttemptAt: new Date().toISOString(),
        outageMessage: degraded
          ? `${failures.length} GDELT domain quer${failures.length === 1 ? "y" : "ies"} failed during refresh.`
          : null,
        latencyMs: averageLatency,
        active: true,
        notes: `${events.length} deduplicated GDELT article signal${events.length === 1 ? "" : "s"} captured across ${successes.length} successful domain quer${successes.length === 1 ? "y" : "ies"}.`,
      },
    };
  },
};
