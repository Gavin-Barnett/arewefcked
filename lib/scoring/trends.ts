import { canReachConfiguredDatabase } from "@/lib/db/availability";
import { prisma } from "@/lib/db/prisma";
import type { TrendDelta, TrendWindow } from "@/lib/types/score";
import { round } from "@/lib/utils";

const trendWindows: Array<{ window: TrendWindow; lookbackMs: number }> = [
  { window: "24h", lookbackMs: 24 * 60 * 60 * 1000 },
  { window: "7d", lookbackMs: 7 * 24 * 60 * 60 * 1000 },
  { window: "30d", lookbackMs: 30 * 24 * 60 * 60 * 1000 }
];

type TrendOptions =
  | {
      scope: "global";
      score: number;
    }
  | {
      scope: "country";
      countryCode: string;
      score: number;
    };

function unavailableTrend(window: TrendWindow, note: string): TrendDelta {
  return {
    window,
    delta: null,
    direction: "flat",
    available: false,
    note
  };
}

function directionForDelta(delta: number): TrendDelta["direction"] {
  if (delta > 0) {
    return "up";
  }

  if (delta < 0) {
    return "down";
  }

  return "flat";
}

function formatSnapshotTimestamp(date: Date) {
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

export async function buildTrendDeltas(options: TrendOptions): Promise<TrendDelta[]> {
  if (!process.env.DATABASE_URL) {
    return trendWindows.map(({ window }) =>
      unavailableTrend(window, "Score drift needs stored history. Set DATABASE_URL and keep recurring score snapshots running.")
    );
  }

  const databaseReachable = await canReachConfiguredDatabase();

  if (!databaseReachable) {
    return trendWindows.map(({ window }) => unavailableTrend(window, "Score history storage is offline. Start Postgres and keep score snapshots running."));
  }

  try {
    const results = await Promise.all(
      trendWindows.map(async ({ window, lookbackMs }) => {
        const cutoff = new Date(Date.now() - lookbackMs);
        const previous =
          options.scope === "global"
            ? await prisma.globalScore.findFirst({
                where: {
                  createdAt: {
                    lte: cutoff
                  }
                },
                orderBy: {
                  createdAt: "desc"
                },
                select: {
                  score: true,
                  createdAt: true
                }
              })
            : await prisma.countryScore.findFirst({
                where: {
                  countryCode: options.countryCode,
                  createdAt: {
                    lte: cutoff
                  }
                },
                orderBy: {
                  createdAt: "desc"
                },
                select: {
                  score: true,
                  createdAt: true
                }
              });

        if (!previous) {
          return unavailableTrend(window, `Need a stored snapshot at least ${window} old to show drift.`);
        }

        const delta = round(options.score - previous.score, 1);

        return {
          window,
          delta,
          direction: directionForDelta(delta),
          available: true,
          note: `Compared with stored snapshot from ${formatSnapshotTimestamp(previous.createdAt)}.`
        } satisfies TrendDelta;
      })
    );

    return results;
  } catch {
    return trendWindows.map(({ window }) => unavailableTrend(window, "Score history storage is offline. Start Postgres and keep score snapshots running."));
  }
}