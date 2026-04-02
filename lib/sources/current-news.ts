import { XMLParser } from "fast-xml-parser";
import { starterCountries } from "@/lib/countries/starter-countries";
import { clamp, hashString, toIsoString } from "@/lib/utils";
import type { CountrySummary, NormalizedEvent, RiskDomain } from "@/lib/types/score";
import type { SourceAdapter, SourceFetchResult } from "@/lib/sources/base";
import { fetchWithTimeout } from "@/lib/sources/http";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  trimValues: true,
  parseTagValue: false
});

const riskKeywords: Record<RiskDomain, Array<{ term: string; weight: number }>> = {
  conflict_security: [
    { term: "war", weight: 38 },
    { term: "missile", weight: 40 },
    { term: "drone", weight: 36 },
    { term: "airstrike", weight: 42 },
    { term: "shelling", weight: 40 },
    { term: "invasion", weight: 42 },
    { term: "frontline", weight: 28 },
    { term: "ceasefire", weight: 22 },
    { term: "bombard", weight: 40 },
    { term: "attack", weight: 22 },
    { term: "strike", weight: 24 },
    { term: "troop", weight: 20 },
    { term: "troops", weight: 20 },
    { term: "clashes", weight: 24 }
  ],
  civil_unrest: [
    { term: "protest", weight: 28 },
    { term: "riot", weight: 36 },
    { term: "unrest", weight: 28 },
    { term: "demonstration", weight: 24 },
    { term: "crackdown", weight: 30 },
    { term: "clashes", weight: 28 }
  ],
  macroeconomic: [
    { term: "inflation", weight: 30 },
    { term: "cpi", weight: 24 },
    { term: "recession", weight: 36 },
    { term: "debt", weight: 28 },
    { term: "currency", weight: 26 },
    { term: "bond", weight: 24 },
    { term: "unemployment", weight: 28 },
    { term: "food prices", weight: 24 },
    { term: "energy prices", weight: 24 },
    { term: "cost of living", weight: 26 },
    { term: "fuel crisis", weight: 28 },
    { term: "energy", weight: 20 },
    { term: "oil", weight: 20 },
    { term: "gas", weight: 16 },
    { term: "prices", weight: 18 },
    { term: "budget", weight: 18 },
    { term: "stocks", weight: 18 },
    { term: "market", weight: 16 },
    { term: "consumer", weight: 16 },
    { term: "exports", weight: 18 },
    { term: "manufacturing", weight: 18 },
    { term: "trade", weight: 16 },
    { term: "jet fuel", weight: 18 },
    { term: "refiners", weight: 18 },
    { term: "refiner", weight: 18 }
  ],
  public_health: [
    { term: "outbreak", weight: 34 },
    { term: "cholera", weight: 38 },
    { term: "measles", weight: 34 },
    { term: "hospital", weight: 18 },
    { term: "pandemic", weight: 36 },
    { term: "virus", weight: 24 },
    { term: "health emergency", weight: 34 }
  ],
  natural_disaster: [
    { term: "earthquake", weight: 18 },
    { term: "flood", weight: 18 },
    { term: "wildfire", weight: 18 },
    { term: "storm", weight: 14 }
  ],
  climate_environment: [
    { term: "heatwave", weight: 16 },
    { term: "air quality", weight: 18 },
    { term: "drought", weight: 18 },
    { term: "smoke", weight: 16 }
  ],
  cyber_infra: [
    { term: "cyberattack", weight: 38 },
    { term: "ransomware", weight: 36 },
    { term: "blackout", weight: 34 },
    { term: "grid", weight: 24 },
    { term: "power outage", weight: 34 },
    { term: "telecom", weight: 24 },
    { term: "internet shutdown", weight: 34 }
  ],
  governance: [
    { term: "sanctions", weight: 32 },
    { term: "state of emergency", weight: 34 },
    { term: "martial law", weight: 38 },
    { term: "constitutional", weight: 28 },
    { term: "parliament", weight: 16 },
    { term: "assassination", weight: 42 },
    { term: "election violence", weight: 34 },
    { term: "cabinet crisis", weight: 28 },
    { term: "election", weight: 18 },
    { term: "government", weight: 14 }
  ]
};

const searchTerms = [
  "war",
  "conflict",
  "missile",
  "drone",
  "airstrike",
  "shelling",
  "protest",
  "riot",
  "coup",
  "sanctions",
  "emergency",
  "inflation",
  "recession",
  "outbreak",
  "cyberattack",
  "blackout",
  "grid",
  "fuel crisis",
  "cost of living",
  "election",
  "government",
  "oil",
  "energy",
  "budget",
  "cpi"
];

const directConflictTerms = [
  "missile",
  "drone",
  "airstrike",
  "shelling",
  "bombard",
  "rocket",
  "artillery",
  "troop",
  "troops",
  "frontline",
  "invasion",
  "incursion",
  "casualties",
  "killed",
  "attack",
  "strike",
  "clashes"
];

const macroSpilloverTerms = [
  "inflation",
  "cpi",
  "energy",
  "oil",
  "gas",
  "prices",
  "budget",
  "stocks",
  "market",
  "exports",
  "manufacturing",
  "consumer",
  "trade",
  "jet fuel",
  "refiners",
  "refiner",
  "sector",
  "economy",
  "economic"
];

const historicalContextTerms = ["battle site", "remains recovery", "memorial", "anniversary", "veteran", "museum", "commemoration", "historic"];
const reliefTerms = ["rally", "rallies", "ease", "eases", "eased", "possible end", "hopes for a possible end", "relief", "showcases strength", "strength"];

type ParsedItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  source?: string | { "#text"?: string; url?: string };
};

function getPublisher(item: ParsedItem) {
  if (!item.source) {
    return "Unknown source";
  }

  if (typeof item.source === "string") {
    return item.source;
  }

  return item.source["#text"] ?? "Unknown source";
}

function stripTags(input: string | undefined) {
  if (!input) {
    return "";
  }

  return input.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeHeadline(title: string) {
  return title.replace(/\s+-\s+[^-]+$/, "").trim();
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function scoreDomainText(text: string, domain: RiskDomain) {
  const matches = riskKeywords[domain].filter((keyword) => text.includes(keyword.term));
  const score = matches.reduce((total, keyword) => total + keyword.weight, 0);
  return { score, tags: matches.map((keyword) => keyword.term) };
}

function classifyArticle(text: string, title: string) {
  const combined = `${title} ${text}`.toLowerCase();
  const hasDirectConflict = includesAny(combined, directConflictTerms);
  const hasMacroSpillover = includesAny(combined, macroSpilloverTerms);
  const looksHistorical = includesAny(combined, historicalContextTerms);
  const looksRelief = includesAny(combined, reliefTerms);

  if (looksRelief && !hasDirectConflict) {
    return null;
  }

  if (looksHistorical && !hasDirectConflict && !hasMacroSpillover) {
    return null;
  }

  const adjustedDomains = (Object.keys(riskKeywords) as RiskDomain[])
    .map((domain) => ({ domain, ...scoreDomainText(combined, domain) }))
    .map((entry) => {
      if (entry.domain === "conflict_security" && !hasDirectConflict) {
        const penalty = (hasMacroSpillover ? 24 : 0) + (looksHistorical ? 30 : 0);
        return {
          ...entry,
          score: Math.max(0, entry.score - penalty)
        };
      }

      if (entry.domain === "macroeconomic" && hasMacroSpillover) {
        return {
          ...entry,
          score: entry.score + 18,
          tags: [...new Set([...entry.tags, "spillover"])]
        };
      }

      return entry;
    })
    .sort((left, right) => right.score - left.score);

  const best = hasMacroSpillover && !hasDirectConflict
    ? adjustedDomains.find((entry) => entry.domain === "macroeconomic" && entry.score >= 16) ?? adjustedDomains[0]
    : adjustedDomains[0];

  if (!best || best.score < 16) {
    return null;
  }

  return best;
}

function buildSeverity(score: number, publishedAt: string | undefined) {
  const ageHours = publishedAt ? (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60) : 72;
  const recencyBoost = clamp(22 - ageHours / 6, 0, 22);
  return clamp(score + recencyBoost, 8, 92);
}

function buildQuery(country: CountrySummary) {
  return `"${country.name}" (${searchTerms.join(" OR ")}) when:7d`;
}

function buildFeedUrl(country: CountrySummary) {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", buildQuery(country));
  url.searchParams.set("hl", "en-US");
  url.searchParams.set("gl", "US");
  url.searchParams.set("ceid", "US:en");
  return url.toString();
}

async function fetchFeed(country: CountrySummary) {
  const url = buildFeedUrl(country);
  const startedAt = Date.now();
  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml",
      "User-Agent": "Mozilla/5.0 (compatible; AreWeFcked/0.1)"
    },
    next: { revalidate: 86400 }
  });

  if (!response.ok) {
    throw new Error(`Google News RSS request failed with ${response.status}`);
  }

  const xml = await response.text();
  const parsed = parser.parse(xml) as {
    rss?: {
      channel?: {
        title?: string;
        lastBuildDate?: string;
        item?: ParsedItem | ParsedItem[];
      };
    };
  };

  const itemsRaw = parsed.rss?.channel?.item;
  const items = Array.isArray(itemsRaw) ? itemsRaw : itemsRaw ? [itemsRaw] : [];

  return {
    country,
    url,
    latencyMs: Date.now() - startedAt,
    lastBuildDate: parsed.rss?.channel?.lastBuildDate,
    items
  };
}

function normalizeItems(country: CountrySummary, items: ParsedItem[]) {
  const seen = new Set<string>();

  return items
    .map((item) => {
      const title = normalizeHeadline(item.title ?? "Untitled article");
      const normalizedTitle = title.toLowerCase();

      if (!title || seen.has(normalizedTitle)) {
        return null;
      }

      seen.add(normalizedTitle);

      const description = stripTags(item.description);
      const classification = classifyArticle(description, title);

      if (!classification) {
        return null;
      }

      const publishedAt = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();
      const severityNormalized = buildSeverity(classification.score, publishedAt);
      const publisher = getPublisher(item);

      return {
        id: `current-news:${country.code}:${hashString(`${title}:${publishedAt}`)}`,
        source: "current_news",
        sourceType: "news",
        title,
        summary: `${publisher} reported a recent ${classification.domain.replaceAll("_", " ")} signal connected to ${country.name}.`,
        url: item.link,
        countryCodes: [country.code],
        region: country.region,
        occurredAt: publishedAt,
        ingestedAt: new Date().toISOString(),
        domain: classification.domain,
        severityRaw: classification.score,
        severityNormalized,
        confidence: 0.42,
        tags: [publisher, ...classification.tags],
        metadata: {
          publisher,
          description,
          queryCountry: country.name
        }
      } satisfies NormalizedEvent;
    })
    .flatMap((item) => (item ? [item] : []))
    .slice(0, 8);
}

export function dedupeCurrentNewsEvents(events: NormalizedEvent[]) {
  const merged = new Map<string, NormalizedEvent>();

  for (const event of events) {
    const publisher = typeof event.metadata?.publisher === "string" ? event.metadata.publisher : "Unknown source";
    const key = event.url?.toLowerCase() ?? `${event.title.toLowerCase()}:${publisher.toLowerCase()}`;
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, event);
      continue;
    }

    merged.set(key, {
      ...existing,
      countryCodes: [...new Set([...existing.countryCodes, ...event.countryCodes])],
      tags: [...new Set([...(existing.tags ?? []), ...(event.tags ?? [])])],
      severityRaw: Math.max(existing.severityRaw ?? 0, event.severityRaw ?? 0),
      severityNormalized: Math.max(existing.severityNormalized ?? 0, event.severityNormalized ?? 0),
      confidence: Math.max(existing.confidence ?? 0, event.confidence ?? 0),
      occurredAt: new Date(existing.occurredAt) > new Date(event.occurredAt) ? existing.occurredAt : event.occurredAt,
      ingestedAt: new Date().toISOString(),
      summary: existing.summary
    });
  }

  return [...merged.values()];
}

export const currentNewsAdapter: SourceAdapter = {
  key: "current_news",
  name: "Current news signal",
  async fetch(scope): Promise<SourceFetchResult> {
    const countries = scope.mode === "global" ? starterCountries : [scope.country];
    const settled = await Promise.allSettled(countries.map((country) => fetchFeed(country)));
    const successes = settled.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
    const failures = settled.flatMap((result) => (result.status === "rejected" ? [result.reason] : []));

    if (successes.length === 0) {
      const firstFailure = failures[0];
      return {
        sourceKey: "current_news",
        sourceName: "Current news signal",
        sourceUrl: "https://news.google.com/",
        events: [],
        notes: [],
        health: {
          sourceKey: "current_news",
          name: "Current news signal",
          status: "offline",
          freshness: "stale",
          lastSuccessfulSync: null,
          lastAttemptAt: new Date().toISOString(),
          outageMessage: firstFailure instanceof Error ? firstFailure.message : "Unknown current-news error",
          latencyMs: null,
          active: true,
          notes: "Current-news fetch or XML parsing failed."
        }
      };
    }

    const events = dedupeCurrentNewsEvents(successes.flatMap((result) => normalizeItems(result.country, result.items)));
    const latestTime = successes
      .map((result) => result.lastBuildDate)
      .filter((value): value is string => Boolean(value))
      .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? new Date().toUTCString();
    const avgLatency = Math.round(successes.reduce((total, result) => total + result.latencyMs, 0) / Math.max(successes.length, 1));
    const degraded = failures.length > 0;

    return {
      sourceKey: "current_news",
      sourceName: "Current news signal",
      sourceUrl: successes[0]?.url ?? "https://news.google.com/",
      events,
      notes: [
        "This adapter adds extra headline context across conflict, governance, macro, health, and infrastructure alongside the stronger structured and official feeds.",
        "Headline-derived domains still stay marked as sparse rather than measured.",
        "Indirect war spillover coverage is pushed into macro stress instead of being treated as local active combat.",
        ...(degraded ? [`${failures.length} country feed${failures.length === 1 ? "" : "s"} failed during this refresh, so surviving headline signals were kept instead of dropping the source entirely.`] : [])
      ],
      health: {
        sourceKey: "current_news",
        name: "Current news signal",
        status: degraded ? "degraded" : "operational",
        freshness:
          Date.now() - new Date(latestTime).getTime() < 1000 * 60 * 60 * 36
            ? "live-ish"
            : Date.now() - new Date(latestTime).getTime() < 1000 * 60 * 60 * 72
              ? "fresh"
              : Date.now() - new Date(latestTime).getTime() < 1000 * 60 * 60 * 120
                ? "delayed"
                : "stale",
        lastSuccessfulSync: toIsoString(new Date(latestTime)),
        lastAttemptAt: new Date().toISOString(),
        outageMessage: degraded ? `${failures.length} country feed${failures.length === 1 ? "" : "s"} failed during refresh.` : null,
        latencyMs: avgLatency,
        active: true,
        notes: `${events.length} classified headline signal${events.length === 1 ? "" : "s"} captured across ${successes.length} successful countr${successes.length === 1 ? "y" : "ies"}.`
      }
    };
  }
};