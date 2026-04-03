import { allCountries } from "@/lib/countries/all-countries";
import type { CountrySummary } from "@/lib/types/score";

const trackedCountryCodes = [
  "AU",
  "BR",
  "CA",
  "CN",
  "DE",
  "EG",
  "FR",
  "GB",
  "ID",
  "IL",
  "IN",
  "IR",
  "JP",
  "KR",
  "MX",
  "NG",
  "PH",
  "RU",
  "TR",
  "UA",
  "US",
  "ZA",
] as const;

const countryMap = new Map(
  allCountries.map((country) => [country.code, country])
);

export const countries = allCountries;
export const trackedCountries = trackedCountryCodes
  .map((code) => countryMap.get(code))
  .filter((country): country is CountrySummary => Boolean(country));

// Backward-compatible export for tracked-country monitors and leaderboard slices.
export const starterCountries = trackedCountries;

function normalizeForMatch(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getCountryByCode(code: string) {
  return countryMap.get(code.toUpperCase()) ?? null;
}

export function resolveCountryInput(input: string) {
  const raw = input.trim();

  if (!raw) {
    return null;
  }

  const byCode = getCountryByCode(raw);

  if (byCode) {
    return byCode;
  }

  const normalized = normalizeForMatch(raw);

  return (
    countries.find((country) => {
      const countryName = normalizeForMatch(country.name);
      const focalCity = normalizeForMatch(country.focalCity);
      return countryName === normalized || focalCity === normalized;
    }) ?? null
  );
}

function searchRank(country: CountrySummary, normalizedQuery: string) {
  const code = country.code.toLowerCase();
  const name = normalizeForMatch(country.name);
  const focalCity = normalizeForMatch(country.focalCity);
  const region = normalizeForMatch(country.region);

  if (code === normalizedQuery) {
    return 0;
  }
  if (name === normalizedQuery) {
    return 1;
  }
  if (name.startsWith(normalizedQuery)) {
    return 2;
  }
  if (code.startsWith(normalizedQuery)) {
    return 3;
  }
  if (focalCity.startsWith(normalizedQuery)) {
    return 4;
  }
  if (name.includes(normalizedQuery)) {
    return 5;
  }
  if (focalCity.includes(normalizedQuery)) {
    return 6;
  }
  if (region.includes(normalizedQuery)) {
    return 7;
  }
  return 99;
}

export function searchCountries(query: string) {
  const normalized = normalizeForMatch(query);

  if (!normalized) {
    return countries;
  }

  return countries
    .filter((country) => {
      return (
        country.code.toLowerCase().includes(normalized) ||
        normalizeForMatch(country.name).includes(normalized) ||
        normalizeForMatch(country.region).includes(normalized) ||
        normalizeForMatch(country.focalCity).includes(normalized)
      );
    })
    .sort((left, right) => {
      const rankDelta =
        searchRank(left, normalized) - searchRank(right, normalized);

      if (rankDelta !== 0) {
        return rankDelta;
      }

      return left.name.localeCompare(right.name);
    });
}
