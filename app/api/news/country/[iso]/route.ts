import { getCountryByCode } from "@/lib/countries/starter-countries";

export const revalidate = 86_400;

export async function GET(
  _request: Request,
  context: { params: Promise<{ iso: string }> }
) {
  const { iso } = await context.params;

  if (!getCountryByCode(iso)) {
    return Response.json(
      { error: "Unsupported country code" },
      { status: 404 }
    );
  }

  return Response.json({
    clusters: [],
    note: "Country news clustering is intentionally empty until live news adapters are enabled.",
  });
}
