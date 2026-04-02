import { z } from "zod";
import { detectCountryCodesInText } from "@/lib/countries/match";
import { clamp, hashString, toIsoString } from "@/lib/utils";
import type { SourceAdapter, SourceFetchResult } from "@/lib/sources/base";
import { fetchWithTimeout } from "@/lib/sources/http";
import type { NormalizedEvent } from "@/lib/types/score";

const whoItemSchema = z.object({
  Id: z.string(),
  Title: z.string(),
  ItemDefaultUrl: z.string(),
  PublicationDate: z.string(),
  Summary: z.string().nullable().optional(),
  Overview: z.string().nullable().optional(),
  Assessment: z.string().nullable().optional()
});

const whoResponseSchema = z.object({
  value: z.array(whoItemSchema).default([])
});

function stripHtml(input: string | null | undefined) {
  return (input ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&rsquo;/g, "'")
    .replace(/&ndash;/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function largestMentionedCount(text: string) {
  const matches = [...text.matchAll(/\b(\d{1,4})\b/g)].map((match) => Number(match[1]));
  return matches.length > 0 ? Math.max(...matches) : 0;
}

function buildSeverity(item: z.infer<typeof whoItemSchema>) {
  const text = `${item.Title} ${stripHtml(item.Summary)} ${stripHtml(item.Overview)} ${stripHtml(item.Assessment)}`.toLowerCase();
  const ageDays = Math.max(0, (Date.now() - new Date(item.PublicationDate).getTime()) / (1000 * 60 * 60 * 24));
  const recencyBoost = clamp(24 - ageDays * 0.8, 0, 24);
  const caseBoost = clamp(largestMentionedCount(text) / 12, 0, 16);
  const riskBoost =
    (text.includes("high risk") ? 18 : text.includes("moderate") ? 10 : text.includes("low") ? 3 : 0) +
    (text.includes("death") || text.includes("fatal") ? 16 : 0) +
    (text.includes("outbreak") ? 14 : 0) +
    (text.includes("multi-country") ? 12 : 0) +
    (text.includes("emergency") ? 8 : 0);

  return clamp(18 + recencyBoost + caseBoost + riskBoost, 12, 96);
}

function hasGlobalScope(title: string, text: string) {
  return /\bglobal update\b|\bglobal situation\b|\bmulti-country\b|\binternational\b/i.test(title) || /multi-country|countries and territories|international/i.test(text);
}

function resolveWhoCountryCodes(item: z.infer<typeof whoItemSchema>, summary: string, assessment: string) {
  const titleMatches = detectCountryCodesInText(item.Title);

  if (titleMatches.length > 0) {
    return titleMatches;
  }

  const supportingText = `${summary} ${assessment}`;

  if (hasGlobalScope(item.Title, supportingText)) {
    return [] as string[];
  }

  return detectCountryCodesInText(supportingText);
}

function normalizeItem(item: z.infer<typeof whoItemSchema>): NormalizedEvent {
  const cleanedSummary = stripHtml(item.Summary) || stripHtml(item.Overview);
  const cleanedAssessment = stripHtml(item.Assessment);
  const fullText = `${item.Title} ${cleanedSummary} ${cleanedAssessment}`;
  const countryCodes = resolveWhoCountryCodes(item, cleanedSummary, cleanedAssessment);
  const summary = cleanedSummary || cleanedAssessment || "WHO published a new outbreak bulletin without a short summary payload.";
  const severity = buildSeverity(item);
  const globalRelevance = hasGlobalScope(item.Title, fullText);

  return {
    id: `who-don:${item.Id || hashString(item.Title)}`,
    source: "who_don",
    sourceType: "event",
    title: item.Title,
    summary,
    url: `https://www.who.int/emergencies/disease-outbreak-news/item${item.ItemDefaultUrl}`,
    countryCodes,
    occurredAt: new Date(item.PublicationDate).toISOString(),
    ingestedAt: new Date().toISOString(),
    domain: "public_health",
    severityRaw: severity,
    severityNormalized: severity,
    confidence: 0.84,
    tags: ["who", ...(globalRelevance ? ["multi-country"] : [])],
    metadata: {
      globalRelevance,
      assessment: cleanedAssessment || null
    }
  };
}

export const whoDonAdapter: SourceAdapter = {
  key: "who_don",
  name: "WHO Disease Outbreak News",
  async fetch(): Promise<SourceFetchResult> {
    const url = new URL("https://www.who.int/api/emergencies/diseaseoutbreaknews");
    url.searchParams.set("$orderby", "PublicationDate desc");
    url.searchParams.set("$top", "12");

    const startedAt = Date.now();
    const response = await fetchWithTimeout(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 21600 }
    });

    if (!response.ok) {
      return {
        sourceKey: "who_don",
        sourceName: "WHO Disease Outbreak News",
        sourceUrl: url.toString(),
        events: [],
        notes: [],
        health: {
          sourceKey: "who_don",
          name: "WHO Disease Outbreak News",
          status: "offline",
          freshness: "stale",
          lastSuccessfulSync: null,
          lastAttemptAt: new Date().toISOString(),
          outageMessage: `WHO request failed with ${response.status}`,
          latencyMs: null,
          active: true,
          notes: "The WHO outbreak feed failed during fetch or validation."
        }
      };
    }

    const payload = whoResponseSchema.parse(await response.json());
    const events = payload.value.map(normalizeItem);
    const latestTime = events
      .map((event) => new Date(event.occurredAt).getTime())
      .sort((left, right) => right - left)[0] ?? Date.now();
    const ageDays = Math.max(0, (Date.now() - latestTime) / (1000 * 60 * 60 * 24));

    return {
      sourceKey: "who_don",
      sourceName: "WHO Disease Outbreak News",
      sourceUrl: url.toString(),
      events,
      notes: [
        "WHO Disease Outbreak News adds official public-health event coverage with a slower editorial cadence than news feeds.",
        "Global or multi-country bulletins no longer get attached to a country page unless the bulletin title directly names that country.",
        "Outbreak cadence varies, so source freshness is judged against WHO's publication rhythm rather than hourly polling."
      ],
      health: {
        sourceKey: "who_don",
        name: "WHO Disease Outbreak News",
        status: "operational",
        freshness: ageDays < 14 ? "live-ish" : ageDays < 45 ? "fresh" : ageDays < 120 ? "delayed" : "stale",
        lastSuccessfulSync: toIsoString(new Date(latestTime)),
        lastAttemptAt: new Date().toISOString(),
        outageMessage: null,
        latencyMs: Date.now() - startedAt,
        active: true,
        notes: `${events.length} outbreak bulletin${events.length === 1 ? "" : "s"} parsed from the current WHO feed.`
      }
    };
  }
};