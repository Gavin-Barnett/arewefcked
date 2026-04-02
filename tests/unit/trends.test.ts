const { prismaMock, availabilityMock } = vi.hoisted(() => ({
  prismaMock: {
    globalScore: {
      findFirst: vi.fn()
    },
    countryScore: {
      findFirst: vi.fn()
    }
  },
  availabilityMock: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: prismaMock
}));

vi.mock("@/lib/db/availability", () => ({
  canReachConfiguredDatabase: availabilityMock
}));

import { buildTrendDeltas } from "@/lib/scoring/trends";

describe("buildTrendDeltas", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    prismaMock.globalScore.findFirst.mockReset();
    prismaMock.countryScore.findFirst.mockReset();
    availabilityMock.mockReset();
  });

  it("returns placeholders when score history is not configured", async () => {
    vi.stubEnv("DATABASE_URL", "");

    const trend = await buildTrendDeltas({ scope: "global", score: 44.1 });

    expect(trend).toHaveLength(3);
    expect(trend.every((item) => item.available === false)).toBe(true);
    expect(trend[0]?.note).toContain("DATABASE_URL");
  });

  it("returns offline placeholders when the configured local database is unreachable", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");
    availabilityMock.mockResolvedValue(false);

    const trend = await buildTrendDeltas({ scope: "global", score: 44.1 });

    expect(trend.every((item) => item.available === false)).toBe(true);
    expect(trend[0]?.note).toContain("offline");
    expect(prismaMock.globalScore.findFirst).not.toHaveBeenCalled();
  });

  it("builds global drift from stored global snapshots", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://example");
    availabilityMock.mockResolvedValue(true);
    prismaMock.globalScore.findFirst
      .mockResolvedValueOnce({ score: 40, createdAt: new Date("2026-04-01T00:00:00.000Z") })
      .mockResolvedValueOnce({ score: 36.5, createdAt: new Date("2026-03-26T00:00:00.000Z") })
      .mockResolvedValueOnce({ score: 30.2, createdAt: new Date("2026-03-03T00:00:00.000Z") });

    const trend = await buildTrendDeltas({ scope: "global", score: 45.4 });

    expect(trend[0]).toMatchObject({ window: "24h", available: true, delta: 5.4, direction: "up" });
    expect(trend[1]).toMatchObject({ window: "7d", available: true, delta: 8.9, direction: "up" });
    expect(trend[2]).toMatchObject({ window: "30d", available: true, delta: 15.2, direction: "up" });
    expect(prismaMock.globalScore.findFirst).toHaveBeenCalledTimes(3);
  });

  it("queries country history for country drift", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://example");
    availabilityMock.mockResolvedValue(true);
    prismaMock.countryScore.findFirst
      .mockResolvedValueOnce({ score: 33.1, createdAt: new Date("2026-04-01T00:00:00.000Z") })
      .mockResolvedValueOnce({ score: 34.6, createdAt: new Date("2026-03-26T00:00:00.000Z") })
      .mockResolvedValueOnce(null);

    const trend = await buildTrendDeltas({ scope: "country", countryCode: "AU", score: 31.2 });

    expect(prismaMock.countryScore.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          countryCode: "AU"
        })
      })
    );
    expect(trend[0]).toMatchObject({ window: "24h", available: true, delta: -1.9, direction: "down" });
    expect(trend[1]).toMatchObject({ window: "7d", available: true, delta: -3.4, direction: "down" });
    expect(trend[2]).toMatchObject({ window: "30d", available: false, delta: null, direction: "flat" });
  });
});