import { z } from "zod";
import { clamp, toIsoString } from "@/lib/utils";
import { globalMonitorPoints, getMonitorPointsForCountry } from "@/lib/sources/monitor-points";
import type { CountrySummary, NormalizedEvent } from "@/lib/types/score";
import type { SourceAdapter, SourceFetchResult } from "@/lib/sources/base";
import { fetchWithTimeout } from "@/lib/sources/http";

const weatherResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  current: z.object({
    time: z.string(),
    temperature_2m: z.number(),
    apparent_temperature: z.number(),
    wind_speed_10m: z.number(),
    weather_code: z.number()
  })
});

const airQualityResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  current: z.object({
    time: z.string(),
    us_aqi: z.number().nullable(),
    pm2_5: z.number().nullable(),
    pm10: z.number().nullable(),
    ozone: z.number().nullable()
  })
});

function buildClimateSeverity(weather: z.infer<typeof weatherResponseSchema>, air: z.infer<typeof airQualityResponseSchema>) {
  const heatStress = clamp(((weather.current.apparent_temperature - 30) / 18) * 55, 0, 55);
  const windStress = clamp(((weather.current.wind_speed_10m - 40) / 60) * 20, 0, 20);
  const aqiStress = clamp((((air.current.us_aqi ?? 0) - 50) / 150) * 70, 0, 70);
  const particulateStress = clamp((((air.current.pm2_5 ?? 0) - 12) / 120) * 25, 0, 25);

  return clamp(heatStress + Math.max(aqiStress, particulateStress) + windStress, 0, 100);
}

async function fetchPoint(country: CountrySummary) {
  const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
  weatherUrl.searchParams.set("latitude", String(country.latitude));
  weatherUrl.searchParams.set("longitude", String(country.longitude));
  weatherUrl.searchParams.set("current", "temperature_2m,apparent_temperature,weather_code,wind_speed_10m");
  weatherUrl.searchParams.set("timezone", "GMT");

  const airUrl = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  airUrl.searchParams.set("latitude", String(country.latitude));
  airUrl.searchParams.set("longitude", String(country.longitude));
  airUrl.searchParams.set("current", "us_aqi,pm2_5,pm10,ozone");
  airUrl.searchParams.set("timezone", "GMT");

  const startedAt = Date.now();
  const [weatherResponse, airResponse] = await Promise.all([
    fetchWithTimeout(weatherUrl, { headers: { Accept: "application/json" }, next: { revalidate: 1800 } }),
    fetchWithTimeout(airUrl, { headers: { Accept: "application/json" }, next: { revalidate: 1800 } })
  ]);

  if (!weatherResponse.ok) {
    throw new Error(`Open-Meteo weather request failed with ${weatherResponse.status}`);
  }

  if (!airResponse.ok) {
    throw new Error(`Open-Meteo air-quality request failed with ${airResponse.status}`);
  }

  const weather = weatherResponseSchema.parse(await weatherResponse.json());
  const air = airQualityResponseSchema.parse(await airResponse.json());

  return {
    country,
    weather,
    air,
    latencyMs: Date.now() - startedAt,
    weatherUrl: weatherUrl.toString(),
    airUrl: airUrl.toString()
  };
}

function normalizePointResult(input: Awaited<ReturnType<typeof fetchPoint>>): NormalizedEvent {
  const severity = buildClimateSeverity(input.weather, input.air);
  const aqi = input.air.current.us_aqi ?? 0;
  const pm25 = input.air.current.pm2_5 ?? 0;
  const apparent = input.weather.current.apparent_temperature;

  return {
    id: `openmeteo:${input.country.code}:${input.weather.current.time}`,
    source: "openmeteo",
    sourceType: "indicator",
    title: `Environmental stress near ${input.country.focalCity}`,
    summary: `Apparent temperature ${apparent.toFixed(1)}C, US AQI ${aqi.toFixed(0)}, PM2.5 ${pm25.toFixed(1)} ug/m3 near ${input.country.focalCity}.`,
    countryCodes: [input.country.code],
    occurredAt: new Date(input.weather.current.time).toISOString(),
    ingestedAt: new Date().toISOString(),
    domain: "climate_environment",
    severityRaw: Math.max(apparent, aqi, pm25),
    severityNormalized: severity,
    confidence: 0.88,
    tags: ["air-quality", "weather", ...(aqi >= 100 ? ["poor-air"] : []), ...(apparent >= 35 ? ["heat"] : [])],
    metadata: {
      latitude: input.country.latitude,
      longitude: input.country.longitude,
      focalCity: input.country.focalCity,
      usAqi: aqi,
      pm25,
      pm10: input.air.current.pm10,
      ozone: input.air.current.ozone,
      apparentTemperature: apparent,
      temperature: input.weather.current.temperature_2m,
      windSpeed10m: input.weather.current.wind_speed_10m,
      weatherCode: input.weather.current.weather_code
    }
  };
}

export const openMeteoAdapter: SourceAdapter = {
  key: "openmeteo",
  name: "Open-Meteo Weather & Air Quality",
  async fetch(scope): Promise<SourceFetchResult> {
    const points = scope.mode === "global" ? globalMonitorPoints : getMonitorPointsForCountry(scope.country.code);
    const settled = await Promise.allSettled(points.map((point) => fetchPoint(point)));
    const successes = settled.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
    const failures = settled.flatMap((result) => (result.status === "rejected" ? [result.reason] : []));

    if (successes.length === 0) {
      const firstFailure = failures[0];
      return {
        sourceKey: "openmeteo",
        sourceName: "Open-Meteo Weather & Air Quality",
        sourceUrl: "https://open-meteo.com/",
        events: [],
        notes: [],
        health: {
          sourceKey: "openmeteo",
          name: "Open-Meteo Weather & Air Quality",
          status: "offline",
          freshness: "stale",
          lastSuccessfulSync: null,
          lastAttemptAt: new Date().toISOString(),
          outageMessage: firstFailure instanceof Error ? firstFailure.message : "Unknown Open-Meteo error",
          latencyMs: null,
          active: true,
          notes: "The climate source failed during fetch or validation."
        }
      };
    }

    const events = successes.map(normalizePointResult);
    const latestTime = events.map((event) => new Date(event.occurredAt).getTime()).sort((left, right) => right - left)[0] ?? Date.now();
    const averageLatency = Math.round(successes.reduce((total, result) => total + result.latencyMs, 0) / Math.max(successes.length, 1));
    const degraded = failures.length > 0;

    return {
      sourceKey: "openmeteo",
      sourceName: "Open-Meteo Weather & Air Quality",
      sourceUrl: scope.mode === "global" ? "https://open-meteo.com/" : successes[0]?.weatherUrl ?? "https://open-meteo.com/",
      events,
      notes: [
        ...(scope.mode === "global" ? ["Global climate stress is sampled from a starter monitoring network rather than a full gridded planetary model in phase one."] : []),
        ...(degraded ? [`${failures.length} monitoring point${failures.length === 1 ? "" : "s"} failed during this refresh, so successful readings were preserved.`] : [])
      ],
      health: {
        sourceKey: "openmeteo",
        name: "Open-Meteo Weather & Air Quality",
        status: degraded ? "degraded" : "operational",
        freshness: Date.now() - latestTime < 1000 * 60 * 90 ? "live-ish" : "fresh",
        lastSuccessfulSync: toIsoString(new Date(latestTime)),
        lastAttemptAt: new Date().toISOString(),
        outageMessage: degraded ? `${failures.length} monitoring point${failures.length === 1 ? "" : "s"} failed during refresh.` : null,
        latencyMs: averageLatency,
        active: true,
        notes: `${successes.length} monitoring point${successes.length === 1 ? "" : "s"} sampled successfully.`
      }
    };
  }
};



