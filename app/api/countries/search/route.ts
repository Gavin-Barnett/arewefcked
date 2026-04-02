import { searchCountries } from "@/lib/countries/starter-countries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  return Response.json({
    query,
    countries: searchCountries(query)
  });
}
