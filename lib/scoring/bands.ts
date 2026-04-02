import { clamp, hashString } from "@/lib/utils";

export const bandDefinitions = [
  { band: 0, min: 0, max: 9, defaultLabel: "Not Fucked" },
  { band: 1, min: 10, max: 19, defaultLabel: "Slightly Fucked" },
  { band: 2, min: 20, max: 29, defaultLabel: "Moderately Fucked" },
  { band: 3, min: 30, max: 39, defaultLabel: "Pretty Fucked" },
  { band: 4, min: 40, max: 49, defaultLabel: "Seriously Fucked" },
  { band: 5, min: 50, max: 59, defaultLabel: "Severely Fucked" },
  { band: 6, min: 60, max: 69, defaultLabel: "Intensely Fucked" },
  { band: 7, min: 70, max: 79, defaultLabel: "Extremely Fucked" },
  { band: 8, min: 80, max: 89, defaultLabel: "Catastrophically Fucked" },
  { band: 9, min: 90, max: 100, defaultLabel: "Completely Fucked" }
] as const;

export const bandLabelOptions: Record<number, string[]> = {
  0: [
    "Not Fucked",
    "Hardly Fucked",
    "Barely Fucked",
    "Almost Not Fucked",
    "Only Lightly Fucked",
    "Not Very Fucked",
    "Minimally Fucked",
    "Still Not Fucked",
    "Remarkably Not Fucked",
    "Functionally Not Fucked"
  ],
  1: [
    "Slightly Fucked",
    "A Little Fucked",
    "Lightly Fucked",
    "Mildly Fucked",
    "A Bit Fucked",
    "Only Slightly Fucked",
    "Somewhat Fucked",
    "Low-Grade Fucked",
    "Manageably Fucked",
    "A Touch Fucked"
  ],
  2: [
    "Moderately Fucked",
    "Noticeably Fucked",
    "Worryingly Fucked",
    "Meaningfully Fucked",
    "Properly Fucked",
    "Increasingly Fucked",
    "Distinctly Fucked",
    "Materially Fucked",
    "Clearly Fucked",
    "A Fair Bit Fucked"
  ],
  3: [
    "Pretty Fucked",
    "Quite Fucked",
    "Fairly Fucked",
    "Substantially Fucked",
    "Uncomfortably Fucked",
    "Solidly Fucked",
    "Plainly Fucked",
    "Decently Fucked",
    "Badly Fucked",
    "Well And Truly Fucked"
  ],
  4: [
    "Seriously Fucked",
    "Deeply Fucked",
    "Really Fucked",
    "Decidedly Fucked",
    "Considerably Fucked",
    "Thoroughly Fucked",
    "Markedly Fucked",
    "Quite Seriously Fucked",
    "Firmly Fucked",
    "Properly Seriously Fucked"
  ],
  5: [
    "Severely Fucked",
    "Very Seriously Fucked",
    "Profoundly Fucked",
    "Gravely Fucked",
    "Acutely Fucked",
    "Heavily Fucked",
    "Dangerously Fucked",
    "Exceptionally Fucked",
    "Painfully Fucked",
    "Badly Fucked"
  ],
  6: [
    "Intensely Fucked",
    "Critically Fucked",
    "Brutally Fucked",
    "Wildly Fucked",
    "Multi-Front Fucked",
    "Broadly Fucked",
    "Alarmingly Fucked",
    "Deeply Fucked",
    "Sharply Fucked",
    "Very Intensely Fucked"
  ],
  7: [
    "Extremely Fucked",
    "Crisis-Level Fucked",
    "Wide-Area Fucked",
    "Systemically Fucked",
    "Massively Fucked",
    "Comprehensively Fucked",
    "Across-The-Board Fucked",
    "Full-Tilt Fucked",
    "Disastrously Fucked",
    "Majorly Fucked"
  ],
  8: [
    "Catastrophically Fucked",
    "Historically Fucked",
    "Systemically Fucked",
    "Mega-Fucked",
    "Ruinously Fucked",
    "Hellishly Fucked",
    "Disaster-Stack Fucked",
    "Absurdly Fucked",
    "Offensively Fucked",
    "Utterly Fucked"
  ],
  9: [
    "Completely Fucked",
    "Apocalyptically Fucked",
    "Utterly Fucked",
    "Terminally Fucked",
    "Maximally Fucked",
    "Absolutely Fucked",
    "Hopelessly Fucked",
    "Endgame Fucked",
    "Beyond-Salvage Fucked",
    "Total-System Fucked"
  ]
};

export function normalizeScore(score: number) {
  return clamp(score, 0, 100);
}

export function getBand(score: number) {
  const clamped = normalizeScore(score);

  if (clamped === 100) {
    return 9;
  }

  return Math.floor(clamped / 10);
}

export function getBandDefinition(score: number) {
  return bandDefinitions[getBand(score)];
}

export function getBandByIndex(band: number) {
  return bandDefinitions[clamp(band, 0, 9)];
}

function ensureHeadlineSafeLabel(label: string, band: number) {
  const clampedBand = clamp(band, 0, 9);
  return /fucked/i.test(label) ? label : bandDefinitions[clampedBand].defaultLabel;
}

export function pickShortLabel(band: number, seed = "global") {
  const clampedBand = clamp(band, 0, 9);
  const options = bandLabelOptions[clampedBand] ?? [bandDefinitions[clampedBand].defaultLabel];
  const label = options[hashString(seed) % options.length];
  return ensureHeadlineSafeLabel(label, clampedBand);
}
