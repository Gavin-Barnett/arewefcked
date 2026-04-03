const { availabilityMock, buildScoreSnapshotMock, persistScoreSnapshotMock } =
  vi.hoisted(() => ({
    availabilityMock: vi.fn(),
    buildScoreSnapshotMock: vi.fn(),
    persistScoreSnapshotMock: vi.fn(),
  }));

vi.mock("@/lib/db/availability", () => ({
  canReachConfiguredDatabase: availabilityMock,
}));

vi.mock("@/lib/db/persist", () => ({
  persistScoreSnapshot: persistScoreSnapshotMock,
}));

vi.mock("@/lib/scoring/engine", () => ({
  buildScoreSnapshot: buildScoreSnapshotMock,
}));

import { starterCountries } from "@/lib/countries/starter-countries";
import { recomputeAndPersistTrackedScores } from "@/lib/scoring/recompute";

describe("recomputeAndPersistTrackedScores", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    availabilityMock.mockReset();
    buildScoreSnapshotMock.mockReset();
    persistScoreSnapshotMock.mockReset();
  });

  it("fails clearly when DATABASE_URL is missing", async () => {
    vi.stubEnv("DATABASE_URL", "");

    const summary = await recomputeAndPersistTrackedScores();

    expect(summary.ok).toBe(false);
    expect(summary.status).toBe(500);
    expect(summary.message).toContain("DATABASE_URL");
    expect(buildScoreSnapshotMock).not.toHaveBeenCalled();
  });

  it("fails clearly when the configured database is unreachable", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");
    availabilityMock.mockResolvedValue(false);

    const summary = await recomputeAndPersistTrackedScores();

    expect(summary.ok).toBe(false);
    expect(summary.status).toBe(503);
    expect(summary.message).toContain("unreachable");
    expect(buildScoreSnapshotMock).not.toHaveBeenCalled();
  });

  it("persists global and tracked-country snapshots when the database is reachable", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://example");
    availabilityMock.mockResolvedValue(true);
    buildScoreSnapshotMock.mockImplementation(
      async (
        options: { scope: "global" } | { scope: "country"; countryCode: string }
      ) => {
        if (options.scope === "global") {
          return {
            scope: "global",
            scopeKey: "global",
            countryCode: undefined,
          };
        }

        return {
          scope: "country",
          scopeKey: options.countryCode,
          countryCode: options.countryCode,
        };
      }
    );
    persistScoreSnapshotMock.mockResolvedValue(undefined);

    const summary = await recomputeAndPersistTrackedScores();

    expect(summary.ok).toBe(true);
    expect(summary.status).toBe(200);
    expect(summary.persistedGlobal).toBe(true);
    expect(summary.persistedCountryCodes).toHaveLength(starterCountries.length);
    expect(buildScoreSnapshotMock).toHaveBeenCalledTimes(
      starterCountries.length + 1
    );
    expect(persistScoreSnapshotMock).toHaveBeenCalledTimes(
      starterCountries.length + 1
    );
  });
});
