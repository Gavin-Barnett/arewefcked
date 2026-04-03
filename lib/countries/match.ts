import { countries } from "@/lib/countries/starter-countries";

const countryAliases: Partial<Record<string, string[]>> = {
  GB: ["United Kingdom", "Britain", "Great Britain", "UK"],
  IL: ["Israeli", "IDF", "Tel Aviv", "Jerusalem", "West Jerusalem", "Netanyahu"],
  IR: ["Islamic Republic of Iran"],
  KR: ["South Korea", "Republic of Korea"],
  KP: ["North Korea", "Democratic People's Republic of Korea"],
  PS: ["Palestinian", "Palestinian Territories", "Gaza", "Gazan", "West Bank"],
  RU: ["Russia", "Russian Federation"],
  SY: ["Syria", "Syrian Arab Republic"],
  TR: ["Turkey", "Turkiye"],
  TW: ["Taiwan", "Republic of China"],
  UA: ["Ukraine", "Kyiv", "Kiev"],
  US: ["United States", "United States of America", "US", "U.S.", "USA", "U.S.A.", "Washington DC", "Washington, DC", "Washington"]
};

function normalizeText(input: string) {
  return input
    .toLowerCase()
    .replace(/&amp;/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const preparedCountries = countries.map((country) => ({
  code: country.code,
  phrases: [...new Set([country.name, country.focalCity, ...(countryAliases[country.code] ?? [])])]
    .map(normalizeText)
    .filter(Boolean)
}));

const preparedCountryPhraseMap = new Map(preparedCountries.map((country) => [country.code, country.phrases]));

export function getCountryMatchPhrases(code: string) {
  return preparedCountryPhraseMap.get(code.toUpperCase()) ?? [];
}

export function detectCountryCodesInText(input: string) {
  const normalized = normalizeText(input);

  if (!normalized) {
    return [] as string[];
  }

  const haystack = ` ${normalized} `;

  return preparedCountries
    .filter((country) => country.phrases.some((phrase) => haystack.includes(` ${phrase} `)))
    .map((country) => country.code);
}

export function resolveCountryCodesFromText(input: string, fallbackCode?: string) {
  const matches = detectCountryCodesInText(input);

  if (matches.length > 0) {
    return matches;
  }

  return fallbackCode ? [fallbackCode] : [];
}