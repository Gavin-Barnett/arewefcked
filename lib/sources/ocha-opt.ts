import type { SourceAdapter, SourceFetchResult } from "@/lib/sources/base";
import { fetchWithTimeout } from "@/lib/sources/http";
import type { NormalizedEvent, RiskDomain } from "@/lib/types/score";
import { clamp, hashString, toIsoString } from "@/lib/utils";

const OCHA_OPT_BASE_URL = "https://www.ochaopt.org";
const OCHA_OPT_LISTING_URL = `${OCHA_OPT_BASE_URL}/publications/situation-reports`;
const listingTitlePattern =
  /(humanitarian situation report|gaza humanitarian response|west bank)/i;

type OchaReportSummary = {
  title: string;
  url: string;
};

type ParsedReport = {
  bodyText: string;
  description: string;
  occurredAt: string;
  title: string;
  url: string;
};

type WeightedTerm = {
  tag: string;
  term: string;
  weight: number;
};

const territoryTerms = [
  "occupied palestinian territory",
  "occupied palestinian territories",
  "palestine",
  "gaza strip",
  "gaza",
  "west bank",
  "rafah",
  "jabalia",
  "deir al balah",
  "khan younis",
  "tulkarm",
  "jenin",
];

const conflictTerms: WeightedTerm[] = [
  { term: "air strike", weight: 18, tag: "airstrike" },
  { term: "airstrike", weight: 18, tag: "airstrike" },
  { term: "military advances", weight: 16, tag: "offensive" },
  { term: "bombardment", weight: 16, tag: "bombardment" },
  { term: "shelling", weight: 14, tag: "shelling" },
  { term: "strike", weight: 10, tag: "strike" },
  { term: "attacks", weight: 10, tag: "attack" },
  { term: "attack", weight: 10, tag: "attack" },
  { term: "killed", weight: 12, tag: "casualties" },
  { term: "injured", weight: 8, tag: "injured" },
  { term: "displaced", weight: 10, tag: "displacement" },
  { term: "destroyed", weight: 8, tag: "destroyed" },
  { term: "explosion", weight: 8, tag: "explosion" },
  { term: "explosive ordnance", weight: 10, tag: "uxo" },
  { term: "demolitions", weight: 9, tag: "demolitions" },
  { term: "settler violence", weight: 10, tag: "settler-violence" },
];

const healthTerms: WeightedTerm[] = [
  { term: "malnutrition", weight: 18, tag: "malnutrition" },
  { term: "acute malnutrition", weight: 20, tag: "malnutrition" },
  { term: "medical evacuation", weight: 14, tag: "medical-evacuation" },
  { term: "patients", weight: 8, tag: "patients" },
  { term: "hospital", weight: 10, tag: "hospital" },
  { term: "health", weight: 6, tag: "health" },
  { term: "water sanitation and hygiene", weight: 8, tag: "wash" },
  { term: "psychosocial support", weight: 6, tag: "psychosocial-support" },
  { term: "outbreak", weight: 12, tag: "outbreak" },
  { term: "nutrition", weight: 8, tag: "nutrition" },
];

const governanceTerms: WeightedTerm[] = [
  { term: "crossings remained operational", weight: 6, tag: "crossings" },
  { term: "humanitarian access", weight: 14, tag: "humanitarian-access" },
  { term: "movement and access", weight: 12, tag: "movement-access" },
  { term: "prevent", weight: 8, tag: "access-restrictions" },
  { term: "ordered", weight: 6, tag: "forced-movement" },
  { term: "demolitions", weight: 10, tag: "demolitions" },
  { term: "displacement", weight: 8, tag: "displacement" },
  { term: "aid", weight: 6, tag: "aid-access" },
  { term: "ceasefire", weight: 6, tag: "ceasefire" },
];

function decodeHtmlEntities(input: string) {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeWhitespace(input: string) {
  return decodeHtmlEntities(input).replace(/\s+/g, " ").trim();
}

function stripHtml(input: string) {
  return normalizeWhitespace(
    input
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  );
}

function extractFirst(input: string, pattern: RegExp) {
  const match = input.match(pattern);
  return match?.[1] ? normalizeWhitespace(match[1]) : null;
}

function extractListingReports(html: string) {
  const reports = new Map<string, OchaReportSummary>();
  const matches = html.matchAll(
    /<a href="(\/content\/[^"]+)"[^>]*>([^<]+)<\/a>/gi
  );

  for (const match of matches) {
    const href = match[1];
    const title = normalizeWhitespace(match[2] ?? "");

    if (!(href && title && listingTitlePattern.test(title))) {
      continue;
    }

    const url = `${OCHA_OPT_BASE_URL}${href}`;

    if (!reports.has(url)) {
      reports.set(url, { title, url });
    }
  }

  return [...reports.values()].slice(0, 3);
}

function extractReportBody(html: string) {
  const startMarker = '<div  class="layout__region layout__region--content">';
  const endMarker =
    '<div class="dexp-region col-12 col-lg-3 region region-sidebar-second">';
  const startIndex = html.indexOf(startMarker);
  const endIndex = html.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return "";
  }

  return html.slice(startIndex, endIndex);
}

function scoreTerms(
  text: string,
  title: string,
  terms: WeightedTerm[],
  base: number
) {
  const haystack = `${title} ${text}`.toLowerCase();
  let score = base;
  const tags = new Set<string>();

  for (const term of terms) {
    if (haystack.includes(term.term)) {
      score += term.weight;
      tags.add(term.tag);
    }
  }

  if (territoryTerms.some((term) => haystack.includes(term))) {
    score += 10;
    tags.add("country:direct");
  }

  return { score, tags: [...tags] };
}

function recencyBoost(occurredAt: string) {
  const ageHours = Math.max(
    0,
    (Date.now() - new Date(occurredAt).getTime()) / (1000 * 60 * 60)
  );

  return clamp(20 - ageHours / 18, 0, 20);
}

function summarizeText(report: ParsedReport) {
  const sourceText = report.description || report.bodyText;
  return sourceText.length <= 220
    ? sourceText
    : `${sourceText.slice(0, 217)}...`;
}

function createEvent(
  report: ParsedReport,
  domain: RiskDomain,
  severity: number,
  tags: string[]
): NormalizedEvent {
  return {
    id: `ocha-opt:${domain}:${hashString(report.url)}`,
    source: "ocha_opt",
    sourceType: "event",
    title: report.title,
    summary: summarizeText(report),
    url: report.url,
    countryCodes: ["PS"],
    region: "Middle East",
    occurredAt: report.occurredAt,
    ingestedAt: new Date().toISOString(),
    domain,
    severityRaw: severity,
    severityNormalized: severity,
    confidence: 0.84,
    tags: [...new Set(["ochaopt", "humanitarian-report", ...tags])],
    metadata: {
      globalRelevance: false,
      official: true,
      territory: "occupied_palestinian_territory",
    },
  };
}

function buildEventsForReport(report: ParsedReport) {
  const summaryText = `${report.description} ${report.bodyText}`;
  const recency = recencyBoost(report.occurredAt);
  const conflict = scoreTerms(summaryText, report.title, conflictTerms, 34);
  const health = scoreTerms(summaryText, report.title, healthTerms, 24);
  const governance = scoreTerms(summaryText, report.title, governanceTerms, 22);
  const events: NormalizedEvent[] = [];

  const conflictSeverity = clamp(conflict.score + recency + 8, 0, 95);
  if (conflictSeverity >= 52) {
    events.push(
      createEvent(report, "conflict_security", conflictSeverity, [
        "war",
        ...conflict.tags,
      ])
    );
  }

  const healthSeverity = clamp(health.score + recency + 4, 0, 90);
  if (healthSeverity >= 42) {
    events.push(
      createEvent(report, "public_health", healthSeverity, health.tags)
    );
  }

  const governanceSeverity = clamp(governance.score + recency + 2, 0, 82);
  if (governanceSeverity >= 40) {
    events.push(
      createEvent(report, "governance", governanceSeverity, governance.tags)
    );
  }

  return events;
}

async function fetchText(url: string) {
  const response = await fetchWithTimeout(
    url,
    {
      headers: { Accept: "text/html" },
      next: { revalidate: 86_400 },
    },
    10_000
  );

  if (!response.ok) {
    throw new Error(`OCHA OPT request failed with ${response.status}`);
  }

  return response.text();
}

function parseReportPage(
  summary: OchaReportSummary,
  html: string
): ParsedReport | null {
  const occurredAt = extractFirst(html, /<time datetime="([^"]+)"/i);
  const title =
    extractFirst(html, /<meta property="og:title" content="([^"]+)"/i) ??
    summary.title;
  const description =
    extractFirst(html, /<meta name="description" content="([^"]+)"/i) ?? "";
  const bodyText = stripHtml(extractReportBody(html));

  if (!occurredAt) {
    return null;
  }

  return {
    bodyText,
    description,
    occurredAt: new Date(occurredAt).toISOString(),
    title,
    url: summary.url,
  };
}

function buildInactiveResult(): SourceFetchResult {
  return {
    sourceKey: "ocha_opt",
    sourceName: "OCHA OPT humanitarian updates",
    sourceUrl: OCHA_OPT_LISTING_URL,
    events: [],
    notes: [],
    health: {
      sourceKey: "ocha_opt",
      name: "OCHA OPT humanitarian updates",
      status: "operational",
      freshness: "fresh",
      lastSuccessfulSync: null,
      lastAttemptAt: new Date().toISOString(),
      outageMessage: null,
      latencyMs: null,
      active: false,
      notes:
        "This source is only applied to Palestine country scoring because it is specific to Gaza and the West Bank.",
    },
  };
}

export const ochaOptAdapter: SourceAdapter = {
  key: "ocha_opt",
  name: "OCHA OPT humanitarian updates",
  async fetch(scope): Promise<SourceFetchResult> {
    if (scope.mode !== "country" || scope.country.code !== "PS") {
      return buildInactiveResult();
    }

    const startedAt = Date.now();
    const listingHtml = await fetchText(OCHA_OPT_LISTING_URL);
    const reports = extractListingReports(listingHtml);

    if (reports.length === 0) {
      return {
        sourceKey: "ocha_opt",
        sourceName: "OCHA OPT humanitarian updates",
        sourceUrl: OCHA_OPT_LISTING_URL,
        events: [],
        notes: [],
        health: {
          sourceKey: "ocha_opt",
          name: "OCHA OPT humanitarian updates",
          status: "offline",
          freshness: "stale",
          lastSuccessfulSync: null,
          lastAttemptAt: new Date().toISOString(),
          outageMessage:
            "No OCHA OPT situation report links were found on the listing page.",
          latencyMs: Date.now() - startedAt,
          active: true,
          notes:
            "The OCHA OPT publications page did not expose any Gaza or West Bank situation report links.",
        },
      };
    }

    const settled = await Promise.allSettled(
      reports.map(async (report) => {
        const html = await fetchText(report.url);
        return parseReportPage(report, html);
      })
    );
    const parsedReports = settled.flatMap((result) =>
      result.status === "fulfilled" && result.value ? [result.value] : []
    );
    const failures = settled.flatMap((result) =>
      result.status === "rejected" ? [result.reason] : []
    );
    const events = parsedReports.flatMap(buildEventsForReport);
    const latestOccurredAt =
      parsedReports
        .map((report) => new Date(report.occurredAt).getTime())
        .sort((left, right) => right - left)[0] ?? null;
    const ageHours = latestOccurredAt
      ? (Date.now() - latestOccurredAt) / (1000 * 60 * 60)
      : Number.POSITIVE_INFINITY;

    return {
      sourceKey: "ocha_opt",
      sourceName: "OCHA OPT humanitarian updates",
      sourceUrl: OCHA_OPT_LISTING_URL,
      events,
      notes: [
        "OCHA OPT adds official Gaza and West Bank humanitarian situation updates for Palestine country scoring.",
        "These reports are used to lift sustained conflict, humanitarian, and access pressure when current-news coverage is too thin.",
        ...(failures.length > 0
          ? [
              `${failures.length} OCHA OPT report page${failures.length === 1 ? "" : "s"} failed during refresh, so surviving reports were kept.`,
            ]
          : []),
      ],
      health: {
        sourceKey: "ocha_opt",
        name: "OCHA OPT humanitarian updates",
        status: failures.length > 0 ? "degraded" : "operational",
        freshness:
          ageHours < 72
            ? "live-ish"
            : ageHours < 7 * 24
              ? "fresh"
              : ageHours < 14 * 24
                ? "delayed"
                : "stale",
        lastSuccessfulSync: toIsoString(
          latestOccurredAt ? new Date(latestOccurredAt) : null
        ),
        lastAttemptAt: new Date().toISOString(),
        outageMessage:
          failures.length > 0
            ? `${failures.length} OCHA OPT report page${failures.length === 1 ? "" : "s"} failed during refresh.`
            : null,
        latencyMs: Date.now() - startedAt,
        active: true,
        notes: `${parsedReports.length} OCHA OPT report${parsedReports.length === 1 ? "" : "s"} parsed into ${events.length} Palestine evidence signal${events.length === 1 ? "" : "s"}.`,
      },
    };
  },
};
