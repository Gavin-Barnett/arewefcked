import { starterCountries } from "@/lib/countries/starter-countries";
import { canReachConfiguredDatabase } from "@/lib/db/availability";
import { persistScoreSnapshot } from "@/lib/db/persist";
import { buildScoreSnapshot } from "@/lib/scoring/engine";

export type ScoreRecomputeSummary = {
  ok: boolean;
  partial: boolean;
  status: number;
  message: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  persistedGlobal: boolean;
  trackedCountryCount: number;
  persistedCountryCodes: string[];
  failedCountries: Array<{ code: string; error: string }>;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function recomputeAndPersistTrackedScores(): Promise<ScoreRecomputeSummary> {
  const startedAt = new Date();
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    const finishedAt = new Date();
    return {
      ok: false,
      partial: false,
      status: 500,
      message: "DATABASE_URL is missing.",
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      persistedGlobal: false,
      trackedCountryCount: starterCountries.length,
      persistedCountryCodes: [],
      failedCountries: [],
    };
  }

  const databaseReachable = await canReachConfiguredDatabase();

  if (!databaseReachable) {
    const finishedAt = new Date();
    return {
      ok: false,
      partial: false,
      status: 503,
      message: "Configured database is unreachable.",
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      persistedGlobal: false,
      trackedCountryCount: starterCountries.length,
      persistedCountryCodes: [],
      failedCountries: [],
    };
  }

  const globalSnapshot = await buildScoreSnapshot({ scope: "global" });
  await persistScoreSnapshot(globalSnapshot);

  const persistedCountryCodes: string[] = [];
  const failedCountries: Array<{ code: string; error: string }> = [];

  for (const country of starterCountries) {
    try {
      const snapshot = await buildScoreSnapshot({
        scope: "country",
        countryCode: country.code,
      });
      await persistScoreSnapshot(snapshot);
      persistedCountryCodes.push(country.code);
    } catch (error) {
      failedCountries.push({
        code: country.code,
        error: getErrorMessage(error),
      });
    }
  }

  const finishedAt = new Date();
  const partial = failedCountries.length > 0;

  return {
    ok: !partial,
    partial,
    status: partial ? 207 : 200,
    message: partial
      ? "Persisted global and some country score snapshots."
      : "Persisted global and tracked-country score snapshots.",
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    persistedGlobal: true,
    trackedCountryCount: starterCountries.length,
    persistedCountryCodes,
    failedCountries,
  };
}
