import { recomputeAndPersistTrackedScores } from "@/lib/scoring/recompute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();

  if (!secret) {
    return { ok: false, reason: "CRON_SECRET is not configured.", status: 500 as const };
  }

  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${secret}`) {
    return { ok: false, reason: "Unauthorized.", status: 401 as const };
  }

  return { ok: true } as const;
}

export async function GET(request: Request) {
  const authorization = isAuthorized(request);

  if (!authorization.ok) {
    return Response.json({ ok: false, message: authorization.reason }, { status: authorization.status });
  }

  try {
    const summary = await recomputeAndPersistTrackedScores();
    return Response.json(summary, { status: summary.status });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unknown cron execution failure."
      },
      { status: 500 }
    );
  }
}