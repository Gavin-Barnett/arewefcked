import { buildScoreSnapshot } from "@/lib/scoring/engine";

export const revalidate = 900;

export async function GET() {
  const snapshot = await buildScoreSnapshot({ scope: "global" });
  return Response.json(snapshot.trend);
}
