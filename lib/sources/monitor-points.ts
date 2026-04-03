import {
  getCountryByCode,
  starterCountries,
} from "@/lib/countries/starter-countries";

export const globalMonitorPoints = starterCountries;

export function getMonitorPointsForCountry(code: string) {
  const country = getCountryByCode(code);
  return country ? [country] : [];
}
