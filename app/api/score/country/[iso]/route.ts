import { getCountryByCode } from "@/lib/countries/starter-countries";
import { buildScoreSnapshot } from "@/lib/scoring/engine";

export const revalidate = 900;

export async function GET(_request: Request, context: { params: Promise<{ iso: string }> }) {
  const { iso } = await context.params;
  const country = getCountryByCode(iso);

  if (!country) {
    return Response.json({ error: "Unsupported country code" }, { status: 404 });
  }

  const snapshot = await buildScoreSnapshot({ scope: "country", countryCode: country.code });
  return Response.json(snapshot);
}
