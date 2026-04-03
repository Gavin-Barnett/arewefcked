import { z } from "zod";

export const riskDomains = [
  "conflict_security",
  "civil_unrest",
  "macroeconomic",
  "public_health",
  "natural_disaster",
  "climate_environment",
  "cyber_infra",
  "governance",
] as const;

export const verdictTones = ["dry", "grim", "wry", "clinical"] as const;
export const freshnessStates = [
  "live-ish",
  "fresh",
  "delayed",
  "stale",
] as const;
export const coverageStates = ["measured", "sparse", "unavailable"] as const;
export const verdictScopes = ["global", "country"] as const;
export const trendWindows = ["24h", "7d", "30d"] as const;

export type RiskDomain = (typeof riskDomains)[number];
export type VerdictTone = (typeof verdictTones)[number];
export type FreshnessState = (typeof freshnessStates)[number];
export type CoverageState = (typeof coverageStates)[number];
export type VerdictScope = (typeof verdictScopes)[number];
export type TrendWindow = (typeof trendWindows)[number];

export const normalizedEventSchema = z.object({
  id: z.string(),
  source: z.string(),
  sourceType: z.enum(["event", "news", "indicator"]),
  title: z.string(),
  summary: z.string().optional(),
  url: z.string().url().optional(),
  countryCodes: z.array(z.string().length(2)),
  region: z.string().optional(),
  occurredAt: z.string().datetime(),
  ingestedAt: z.string().datetime(),
  domain: z.enum(riskDomains),
  severityRaw: z.number().optional(),
  severityNormalized: z.number().min(0).max(100).optional(),
  confidence: z.number().min(0).max(1).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type NormalizedEvent = z.infer<typeof normalizedEventSchema>;

export const sourceHealthEntrySchema = z.object({
  sourceKey: z.string(),
  name: z.string(),
  status: z.enum(["operational", "degraded", "offline"]),
  freshness: z.enum(freshnessStates),
  lastSuccessfulSync: z.string().datetime().nullable(),
  lastAttemptAt: z.string().datetime().nullable(),
  outageMessage: z.string().nullable(),
  latencyMs: z.number().int().nonnegative().nullable(),
  active: z.boolean(),
  notes: z.string().optional(),
});

export type SourceHealthEntry = z.infer<typeof sourceHealthEntrySchema>;

export const domainBreakdownSchema = z.object({
  domain: z.enum(riskDomains),
  label: z.string(),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  coverage: z.enum(coverageStates),
  confidence: z.number().min(0).max(1),
  evidenceCount: z.number().int().nonnegative(),
  summary: z.string(),
  topEvidenceIds: z.array(z.string()),
  lastUpdated: z.string().datetime().nullable(),
});

export type DomainBreakdown = z.infer<typeof domainBreakdownSchema>;

export const topDriverSchema = z.object({
  id: z.string(),
  domain: z.enum(riskDomains),
  title: z.string(),
  summary: z.string(),
  direction: z.enum(["up", "down"]),
  effect: z.number(),
  evidenceIds: z.array(z.string()),
});

export type TopDriver = z.infer<typeof topDriverSchema>;

export const evidenceItemSchema = z.object({
  id: z.string(),
  source: z.string(),
  title: z.string(),
  summary: z.string(),
  domain: z.enum(riskDomains),
  url: z.string().url().optional(),
  occurredAt: z.string().datetime(),
  severity: z.number().min(0).max(100),
  countryCodes: z.array(z.string().length(2)),
  tags: z.array(z.string()),
});

export type EvidenceItem = z.infer<typeof evidenceItemSchema>;

export const trendDeltaSchema = z.object({
  window: z.enum(trendWindows),
  delta: z.number().nullable(),
  direction: z.enum(["up", "down", "flat"]),
  available: z.boolean(),
  note: z.string().optional(),
});

export type TrendDelta = z.infer<typeof trendDeltaSchema>;

export const verdictMessageSchema = z.object({
  id: z.string(),
  band: z.number().int().min(0).max(9),
  tone: z.enum(verdictTones),
  text: z.string(),
  allowedScopes: z.array(z.enum(verdictScopes)),
  minConfidence: z.number().min(0).max(1).optional(),
  tags: z.array(z.string()).optional(),
});

export type VerdictMessage = z.infer<typeof verdictMessageSchema>;

export const scoreSnapshotSchema = z.object({
  scope: z.enum(verdictScopes),
  scopeKey: z.string(),
  countryCode: z.string().length(2).optional(),
  countryName: z.string().optional(),
  score: z.number().min(0).max(100),
  band: z.number().int().min(0).max(9),
  shortLabel: z.string(),
  verdictMessage: z.string(),
  confidence: z.number().min(0).max(1),
  freshness: z.enum(freshnessStates),
  summaryBullets: z.array(z.string()).min(1),
  domainBreakdown: z.array(domainBreakdownSchema),
  topDrivers: z.array(topDriverSchema),
  evidence: z.array(evidenceItemSchema),
  sourceHealth: z.array(sourceHealthEntrySchema),
  trend: z.array(trendDeltaSchema),
  methodologyBlurb: z.string(),
  sparseData: z.boolean(),
  sparseReason: z.string().optional(),
  lastUpdated: z.string().datetime().nullable(),
});

export type ScoreSnapshot = z.infer<typeof scoreSnapshotSchema>;

export const countrySummarySchema = z.object({
  code: z.string().length(2),
  name: z.string(),
  region: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  focalCity: z.string(),
});

export type CountrySummary = z.infer<typeof countrySummarySchema>;
