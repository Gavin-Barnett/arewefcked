import { buildSourceHealthSnapshot } from "@/lib/scoring/engine";

export const revalidate = 900;

export async function GET() {
  const sourceHealth = await buildSourceHealthSnapshot();
  return Response.json(sourceHealth);
}
