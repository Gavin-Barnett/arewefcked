import { z } from "zod";
import type {
  SourceAdapter,
  SourceFetchResult,
  SourceFetchScope,
} from "@/lib/sources/base";
import { fetchWithTimeout } from "@/lib/sources/http";
import type { NormalizedEvent } from "@/lib/types/score";
import { clamp, toIsoString } from "@/lib/utils";

const usgsFeatureSchema = z.object({
  id: z.string(),
  properties: z.object({
    mag: z.number().nullable(),
    place: z.string().nullable(),
    time: z.number(),
    updated: z.number().optional(),
    url: z.string().url().nullable(),
    detail: z.string().url().optional(),
    sig: z.number().nullable(),
    felt: z.number().nullable().optional(),
    tsunami: z.number().nullable().optional(),
    alert: z.string().nullable().optional(),
    title: z.string(),
  }),
  geometry: z.object({
    coordinates: z.tuple([z.number(), z.number(), z.number()]),
  }),
});

const usgsResponseSchema = z.object({
  metadata: z.object({
    generated: z.number(),
    title: z.string(),
    url: z.string().url(),
    count: z.number().optional(),
  }),
  features: z.array(usgsFeatureSchema),
});

function buildSeverity(feature: z.infer<typeof usgsFeatureSchema>) {
  const magnitude = feature.properties.mag ?? 0;
  const significance = feature.properties.sig ?? 0;
  const felt = feature.properties.felt ?? 0;
  const tsunamiBonus = feature.properties.tsunami ? 8 : 0;
  const alertBonus = feature.properties.alert ? 10 : 0;

  return clamp(
    (magnitude - 4.5) * 18 +
      significance / 40 +
      Math.min(felt, 50) / 4 +
      tsunamiBonus +
      alertBonus,
    0,
    100
  );
}

function normalizeFeature(
  feature: z.infer<typeof usgsFeatureSchema>,
  countryCode?: string
): NormalizedEvent {
  const [longitude, latitude, depthKm] = feature.geometry.coordinates;
  const severityNormalized = buildSeverity(feature);

  return {
    id: `usgs:${feature.id}`,
    source: "usgs",
    sourceType: "event",
    title: feature.properties.title,
    summary: `${feature.properties.mag ?? "Unknown"} magnitude earthquake near ${feature.properties.place ?? "an unspecified location"}.`,
    url: feature.properties.url ?? undefined,
    countryCodes: countryCode ? [countryCode] : [],
    region: feature.properties.place ?? undefined,
    occurredAt: new Date(feature.properties.time).toISOString(),
    ingestedAt: new Date().toISOString(),
    domain: "natural_disaster",
    severityRaw: feature.properties.mag ?? undefined,
    severityNormalized,
    confidence: 0.96,
    tags: [
      "earthquake",
      ...(feature.properties.tsunami ? ["tsunami"] : []),
      ...(feature.properties.alert ? [String(feature.properties.alert)] : []),
    ],
    metadata: {
      longitude,
      latitude,
      depthKm,
      significance: feature.properties.sig,
      feltReports: feature.properties.felt ?? 0,
      spatialMode: countryCode ? "radius-near-focal-city" : "global",
    },
  };
}

async function fetchUsgsJson(scope: SourceFetchScope) {
  const baseUrl = new URL("https://earthquake.usgs.gov/fdsnws/event/1/query");
  baseUrl.searchParams.set("format", "geojson");
  baseUrl.searchParams.set(
    "starttime",
    new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
  );
  baseUrl.searchParams.set("endtime", new Date().toISOString());
  baseUrl.searchParams.set(
    "minmagnitude",
    scope.mode === "country" ? "3.5" : "4.5"
  );
  baseUrl.searchParams.set("orderby", "time");
  baseUrl.searchParams.set("limit", scope.mode === "country" ? "40" : "80");

  if (scope.mode === "country") {
    baseUrl.searchParams.set("latitude", String(scope.country.latitude));
    baseUrl.searchParams.set("longitude", String(scope.country.longitude));
    baseUrl.searchParams.set("maxradiuskm", "900");
  }

  const startedAt = Date.now();
  const response = await fetchWithTimeout(
    baseUrl,
    {
      headers: { Accept: "application/json" },
      next: { revalidate: 900 },
    },
    10_000
  );

  if (!response.ok) {
    throw new Error(`USGS request failed with ${response.status}`);
  }

  const json = usgsResponseSchema.parse(await response.json());

  return {
    json,
    latencyMs: Date.now() - startedAt,
    url: baseUrl.toString(),
  };
}

export const usgsAdapter: SourceAdapter = {
  key: "usgs",
  name: "USGS Earthquake Catalog",
  async fetch(scope): Promise<SourceFetchResult> {
    try {
      const { json, latencyMs, url } = await fetchUsgsJson(scope);
      const events = json.features.map((feature) =>
        normalizeFeature(
          feature,
          scope.mode === "country" ? scope.country.code : undefined
        )
      );
      const generatedAt = new Date(json.metadata.generated);

      return {
        sourceKey: "usgs",
        sourceName: "USGS Earthquake Catalog",
        sourceUrl: url,
        events,
        notes:
          scope.mode === "country"
            ? [
                "Country seismic signals are approximated using a radius around the focal city until full boundary mapping is added.",
              ]
            : [],
        health: {
          sourceKey: "usgs",
          name: "USGS Earthquake Catalog",
          status: "operational",
          freshness:
            Date.now() - generatedAt.getTime() < 1000 * 60 * 30
              ? "live-ish"
              : "fresh",
          lastSuccessfulSync: toIsoString(generatedAt),
          lastAttemptAt: new Date().toISOString(),
          outageMessage: null,
          latencyMs,
          active: true,
          notes: `${json.metadata.count ?? json.features.length} earthquakes returned in the current 7-day query window.`,
        },
      };
    } catch (error) {
      return {
        sourceKey: "usgs",
        sourceName: "USGS Earthquake Catalog",
        sourceUrl: "https://earthquake.usgs.gov/fdsnws/event/1/",
        events: [],
        notes: [],
        health: {
          sourceKey: "usgs",
          name: "USGS Earthquake Catalog",
          status: "offline",
          freshness: "stale",
          lastSuccessfulSync: null,
          lastAttemptAt: new Date().toISOString(),
          outageMessage:
            error instanceof Error ? error.message : "Unknown USGS error",
          latencyMs: null,
          active: true,
          notes: "The disaster feed failed during fetch or validation.",
        },
      };
    }
  },
};
