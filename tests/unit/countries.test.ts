import { detectCountryCodesInText } from "@/lib/countries/match";
import { countries, getCountryByCode, searchCountries, starterCountries } from "@/lib/countries/starter-countries";

describe("country directory", () => {
  it("supports all-country lookup including New Zealand", () => {
    expect(getCountryByCode("NZ")?.name).toBe("New Zealand");
    expect(countries.length).toBeGreaterThan(200);
  });

  it("prefers exact ISO code matches ahead of substring matches", () => {
    const results = searchCountries("ID");

    expect(results[0]?.code).toBe("ID");
    expect(results[0]?.name).toBe("Indonesia");
  });

  it("detects Israel and Palestine aliases in article text", () => {
    const matches = detectCountryCodesInText("IDF activity near Tel Aviv and Gaza continues overnight.");

    expect(matches).toContain("IL");
    expect(matches).toContain("PS");
  });

  it("keeps tracked countries as a smaller monitoring subset", () => {
    expect(starterCountries.length).toBeLessThan(countries.length);
    expect(starterCountries.some((country) => country.code === "UA")).toBe(true);
  });
});