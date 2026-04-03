import { unstable_cache } from "next/cache";
import { getCountryByCode, starterCountries } from "@/lib/countries/starter-countries";
import { activeSourceAdapters } from "@/lib/sources";
import type { SourceFetchResult, SourceFetchScope } from "@/lib/sources/base";
import { getBand } from "@/lib/scoring/bands";
import { buildTrendDeltas } from "@/lib/scoring/trends";
import { domainLabels, domainWeights } from "@/lib/scoring/weights";
import {
  scoreSnapshotSchema,
  type DomainBreakdown,
  type EvidenceItem,
  type FreshnessState,
  type RiskDomain,
  type ScoreSnapshot,
  type SourceHealthEntry,
  type TopDriver
} from "@/lib/types/score";
import { selectMethodologyBlurb, selectShortLabel, selectVerdictMessage } from "@/lib/verdicts/select";
import { clamp, round } from "@/lib/utils";

const sourceDomainMap: Record<string, RiskDomain[]> = {
  usgs: ["natural_disaster"],
  openmeteo: ["climate_environment"],
  gdelt: ["conflict_security", "civil_unrest", "macroeconomic", "cyber_infra", "governance"],
  who_don: ["public_health"],
  world_bank: ["macroeconomic"],
  current_news: ["conflict_security", "civil_unrest", "macroeconomic", "public_health", "cyber_infra", "governance"]
};

const sourceCoverageMode: Record<string, "measured" | "sparse"> = {
  usgs: "measured",
  openmeteo: "measured",
  gdelt: "sparse",
  who_don: "measured",
  world_bank: "measured",
  current_news: "sparse"
};

const allDomains = Object.keys(domainWeights) as RiskDomain[];
const sustainedWarTags = ["war", "missile", "drone", "airstrike", "shelling", "invasion", "frontline", "bombard", "offensive", "rocket", "artillery", "troop", "troops", "military", "clash", "clashes", "strike", "attack", "casualties", "killed", "war crime"];
const canUseNextCache = process.env.NODE_ENV !== "test" && process.env.VITEST !== "true";

type SustainedConflictProfile = {
  mode: "active_theater" | "sustained";
  signalCount: number;
  averageSeverity: number;
  conflictFloor: number;
  sparseMultiplier: number;
  scoreBoost: number;
};

function getSupportedResultsForDomain(domain: RiskDomain, results: SourceFetchResult[]) {
  return results.filter((result) => (sourceDomainMap[result.sourceKey] ?? []).includes(domain));
}

function computeOperationalCoverage(domain: RiskDomain, results: SourceFetchResult[], scope: SourceFetchScope) {
  const relevantResults = getSupportedResultsForDomain(domain, results);

  if (relevantResults.length === 0) {
    return "unavailable" as const;
  }

  const liveResults = relevantResults.filter((result) => result.health.status !== "offline");

  if (liveResults.length === 0) {
    return "sparse" as const;
  }

  const hasMeasuredSource = liveResults.some((result) => sourceCoverageMode[result.sourceKey] === "measured");

  if (scope.mode === "country" && domain === "natural_disaster") {
    return "sparse" as const;
  }

  return hasMeasuredSource ? ("measured" as const) : ("sparse" as const);
}

function scoreDomain(events: EvidenceItem[], coverage: DomainBreakdown["coverage"]) {
  if (events.length === 0) {
    return 0;
  }

  const severities = events.map((event) => event.severity);
  const peak = Math.max(...severities);
  const averageSeverity = severities.reduce((total, value) => total + value, 0) / severities.length;
  const recentCount = events.filter((event) => Date.now() - new Date(event.occurredAt).getTime() < 1000 * 60 * 60 * 72).length;
  const persistenceBoost = Math.min(events.length * (coverage === "measured" ? 2.6 : 1.8), coverage === "measured" ? 15 : 9);
  const recencyBoost = Math.min(recentCount * (coverage === "measured" ? 4 : 2.4), coverage === "measured" ? 15 : 8);
  const base = averageSeverity * (coverage === "measured" ? 0.58 : 0.46) + peak * (coverage === "measured" ? 0.26 : 0.2);

  return clamp(base + persistenceBoost + recencyBoost, 0, 100);
}

function mergeFreshness(healthEntries: SourceHealthEntry[]): FreshnessState {
  if (healthEntries.every((entry) => entry.status === "offline")) {
    return "stale";
  }

  if (healthEntries.some((entry) => entry.freshness === "stale" || entry.status === "offline")) {
    return "delayed";
  }

  if (healthEntries.some((entry) => entry.freshness === "delayed" || entry.status === "degraded")) {
    return "delayed";
  }

  if (healthEntries.some((entry) => entry.freshness === "fresh")) {
    return "fresh";
  }

  return "live-ish";
}

function isRecentEvent(occurredAt: string, hours: number) {
  return Date.now() - new Date(occurredAt).getTime() <= hours * 60 * 60 * 1000;
}

function isWarLinkedConflict(event: EvidenceItem) {
  if (event.domain !== "conflict_security" || event.tags.includes("country:indirect")) {
    return false;
  }

  const haystack = `${event.title} ${event.summary} ${event.tags.join(" ")}`.toLowerCase();
  return sustainedWarTags.some((tag) => haystack.includes(tag));
}

function buildSustainedConflictProfile(evidence: EvidenceItem[], scope: SourceFetchScope): SustainedConflictProfile | null {
  if (scope.mode !== "country") {
    return null;
  }

  const warSignals = evidence.filter((event) => isWarLinkedConflict(event) && isRecentEvent(event.occurredAt, 21 * 24));

  if (warSignals.length === 0) {
    return null;
  }

  const averageSeverity = warSignals.reduce((total, event) => total + event.severity, 0) / warSignals.length;
  const peakSeverity = Math.max(...warSignals.map((event) => event.severity));
  const severeSignalCount = warSignals.filter((event) => event.severity >= 70).length;

  if (warSignals.length === 1) {
    if (peakSeverity < 72) {
      return null;
    }

    return {
      mode: "active_theater",
      signalCount: 1,
      averageSeverity,
      conflictFloor: clamp(62 + (peakSeverity - 72) * 0.7, 62, 78),
      sparseMultiplier: 1,
      scoreBoost: clamp(14 + (peakSeverity - 72) * 0.35, 14, 20)
    };
  }

  if (averageSeverity < 45 || peakSeverity < 55) {
    return null;
  }

  return {
    mode: "sustained",
    signalCount: warSignals.length,
    averageSeverity,
    conflictFloor: clamp(66 + warSignals.length * 2.1 + severeSignalCount * 2.5 + (averageSeverity - 45) * 0.45, 66, 90),
    sparseMultiplier: 1,
    scoreBoost: clamp(9 + warSignals.length * 1.6 + severeSignalCount * 2.2 + (averageSeverity - 50) * 0.22, 9, 28)
  };
}

function getCoverageMultiplier(
  entry: Pick<DomainBreakdown, "coverage" | "domain">,
  scope: SourceFetchScope,
  sustainedConflictProfile: SustainedConflictProfile | null
) {
  if (entry.coverage === "measured") {
    return 1;
  }

  if (entry.coverage === "unavailable") {
    return 0;
  }

  if (scope.mode === "country" && entry.domain === "conflict_security" && sustainedConflictProfile) {
    return sustainedConflictProfile.sparseMultiplier;
  }

  return 0.55;
}

function toEvidenceItems(results: SourceFetchResult[], scope: SourceFetchScope) {
  return results
    .flatMap((result) => result.events)
    .filter((event) => {
      if (scope.mode === "global") {
        return true;
      }

      return event.countryCodes.includes(scope.country.code);
    })
    .map<EvidenceItem>((event) => ({
      id: event.id,
      source: event.source,
      title: event.title,
      summary: event.summary ?? "No summary provided.",
      domain: event.domain,
      url: event.url,
      occurredAt: event.occurredAt,
      severity: event.severityNormalized ?? 0,
      countryCodes: event.countryCodes,
      tags: event.tags ?? []
    }))
    .sort((left, right) => right.severity - left.severity);
}

function summarizeDomain(domain: RiskDomain, events: EvidenceItem[], coverage: DomainBreakdown["coverage"], scope: SourceFetchScope) {
  if (coverage === "unavailable") {
    return "No live source is wired for this domain yet, so it stays explicitly uncovered.";
  }

  if (events.length === 0) {
    return coverage === "measured"
      ? "Measured sources are live here, but current stress is limited."
      : "Proxy monitoring is live here, but it did not surface a strong enough signal in this window.";
  }

  if (scope.mode === "country" && domain === "natural_disaster") {
    return `${events.length} nearby seismic event${events.length === 1 ? " is" : "s are"} influencing this reading via a focal-city radius sample.`;
  }

  if (coverage === "sparse") {
    return `${events.length} live proxy signal${events.length === 1 ? " is" : "s are"} contributing here while fuller structured coverage is still being built out.`;
  }

  return `${events.length} evidence item${events.length === 1 ? " is" : "s are"} currently lifting this domain.`;
}

function buildTopDrivers(evidence: EvidenceItem[]): TopDriver[] {
  return evidence.slice(0, 4).map((item) => ({
    id: `driver:${item.id}`,
    domain: item.domain,
    title: item.title,
    summary: item.summary,
    direction: "up",
    effect: round(item.severity / 10, 1),
    evidenceIds: [item.id]
  }));
}

async function collectSourceResults(scope: SourceFetchScope) {
  const settled = await Promise.allSettled(activeSourceAdapters.map((adapter) => adapter.fetch(scope)));

  return settled.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }

    const adapter = activeSourceAdapters[index];
    const message = result.reason instanceof Error ? result.reason.message : `Unknown ${adapter.name} error`;

    return {
      sourceKey: adapter.key,
      sourceName: adapter.name,
      sourceUrl: "",
      events: [],
      notes: [],
      health: {
        sourceKey: adapter.key,
        name: adapter.name,
        status: "offline" as const,
        freshness: "stale" as const,
        lastSuccessfulSync: null,
        lastAttemptAt: new Date().toISOString(),
        outageMessage: message,
        latencyMs: null,
        active: true,
        notes: `${adapter.name} threw before returning a health payload.`
      }
    };
  });
}

async function buildScoreSnapshotInternal(scope: SourceFetchScope, options: { scope: "global" } | { scope: "country"; countryCode: string }) {
  const sourceResults = await collectSourceResults(scope);
  const evidence = toEvidenceItems(sourceResults, scope);
  const sustainedConflictProfile = buildSustainedConflictProfile(evidence, scope);

  const domainBreakdown: DomainBreakdown[] = allDomains.map((domain) => {
    const coverage = computeOperationalCoverage(domain, sourceResults, scope);
    const domainEvidence = evidence.filter((event) => event.domain === domain);
    const baseScore = scoreDomain(domainEvidence, coverage);
    const score =
      scope.mode === "country" && domain === "conflict_security" && sustainedConflictProfile
        ? round(Math.max(baseScore, sustainedConflictProfile.conflictFloor), 1)
        : round(baseScore, 1);
    const confidence =
      coverage === "measured"
        ? round(clamp(0.56 + Math.min(domainEvidence.length, 5) * 0.07, 0.56, 0.9), 2)
        : coverage === "sparse"
          ? round(clamp(0.24 + Math.min(domainEvidence.length, 6) * 0.05, 0.24, 0.58), 2)
          : 0.12;
    const adjustedConfidence =
      scope.mode === "country" && domain === "conflict_security" && sustainedConflictProfile && coverage === "sparse"
        ? round(Math.max(confidence, 0.58), 2)
        : confidence;

    return {
      domain,
      label: domainLabels[domain],
      score,
      weight: domainWeights[domain],
      coverage,
      confidence: adjustedConfidence,
      evidenceCount: domainEvidence.length,
      summary:
        scope.mode === "country" && domain === "conflict_security" && sustainedConflictProfile
          ? sustainedConflictProfile.mode === "sustained"
            ? `${sustainedConflictProfile.signalCount} recent war-linked signals are recurring often enough to treat this as sustained active-war stress, even before fuller structured conflict coverage lands.`
            : "A smaller number of direct war-linked signals are still severe enough to treat this as active-war stress, even before fuller structured conflict coverage lands."
          : summarizeDomain(domain, domainEvidence, coverage, scope),
      topEvidenceIds: domainEvidence.slice(0, 3).map((item) => item.id),
      lastUpdated: domainEvidence[0]?.occurredAt ?? null
    };
  });

  const measuredWeight = domainBreakdown.filter((entry) => entry.coverage === "measured").reduce((total, entry) => total + entry.weight, 0);
  const effectiveWeight = domainBreakdown.reduce((total, entry) => {
    const multiplier = getCoverageMultiplier(entry, scope, sustainedConflictProfile);
    return total + entry.weight * multiplier;
  }, 0);
  const weightedObserved = domainBreakdown.reduce((total, entry) => {
    const multiplier = getCoverageMultiplier(entry, scope, sustainedConflictProfile);
    return total + entry.score * entry.weight * multiplier;
  }, 0);
  const observedAverage = effectiveWeight > 0 ? weightedObserved / effectiveWeight : 0;
  const multiDomainBoost = clamp(domainBreakdown.filter((entry) => entry.score >= 45).length * 3.5, 0, 12);
  const breadthBoost = clamp(domainBreakdown.filter((entry) => entry.coverage !== "unavailable" && entry.score >= 28).length * 1.4, 0, 7);
  const sustainedConflictBoost = scope.mode === "country" ? sustainedConflictProfile?.scoreBoost ?? 0 : 0;
  const score = round(clamp(observedAverage * (0.35 + effectiveWeight * 0.65) + multiDomainBoost + breadthBoost + sustainedConflictBoost, 0, 100), 1);
  const confidence = round(
    clamp(
      domainBreakdown.reduce((total, entry) => total + entry.confidence * entry.weight, 0) * (0.45 + effectiveWeight * 0.45),
      0.08,
      0.96
    ),
    2
  );
  const lastUpdated = sourceResults
    .map((result) => result.health.lastSuccessfulSync)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null;
  const freshness = mergeFreshness(sourceResults.map((result) => result.health));
  const sparseData = measuredWeight < 0.45 || effectiveWeight < 0.72;
  const sparseReason = sparseData
    ? scope.mode === "global"
      ? "Live coverage is thinner than intended because some domains still rely on proxy monitoring or a delayed source. The score is still real, but confidence is reduced until those feeds thicken up."
      : "Country coverage is thinner than the global read because some lanes still rely on proxy matching or focal-city sampling instead of fully local structured feeds."
    : undefined;
  const hottestDomain = [...domainBreakdown].sort((left, right) => right.score - left.score)[0];
  const supportedDomains = domainBreakdown.filter((entry) => entry.coverage !== "unavailable");
  const liveSourceNames = sourceResults
    .filter((result) => result.health.status !== "offline")
    .map((result) => result.sourceName)
    .join(", ");
  const summaryBullets = [
    `${hottestDomain?.label ?? "No measured domain"} is currently the hottest live lane.`,
    `${evidence.length} live evidence item${evidence.length === 1 ? "" : "s"} are shaping this reading across ${supportedDomains.length} covered domain${supportedDomains.length === 1 ? "" : "s"}.`,
    sustainedConflictProfile && scope.mode === "country"
      ? sustainedConflictProfile.mode === "sustained"
        ? "Sustained active-war reporting is materially lifting the country score rather than being treated as a one-off headline spike."
        : "Direct active-war reporting is materially lifting the country score even though the live proxy count is still thin."
      : sparseReason ?? `Live inputs now include ${liveSourceNames}.`
  ];
  const shortLabel = selectShortLabel(score, options.scope === "global" ? "global" : options.countryCode);
  const verdictMessage = selectVerdictMessage({
    score,
    scope: options.scope,
    scopeKey: options.scope === "global" ? "global" : options.countryCode,
    confidence,
    salt: lastUpdated ?? "initial"
  }).text;
  const methodologyBlurb = selectMethodologyBlurb(`${options.scope}:${lastUpdated ?? "initial"}`);

  const snapshot: ScoreSnapshot = {
    scope: options.scope,
    scopeKey: options.scope === "global" ? "global" : options.countryCode,
    countryCode: options.scope === "country" ? options.countryCode : undefined,
    countryName: scope.mode === "country" ? scope.country.name : undefined,
    score,
    band: getBand(score),
    shortLabel,
    verdictMessage,
    confidence,
    freshness,
    summaryBullets,
    domainBreakdown,
    topDrivers: buildTopDrivers(evidence),
    evidence: evidence.slice(0, 10),
    sourceHealth: sourceResults.map((result) => result.health),
    trend: options.scope === "global" ? await buildTrendDeltas({ scope: "global", score }) : await buildTrendDeltas({ scope: "country", countryCode: options.countryCode, score }),
    methodologyBlurb,
    sparseData,
    sparseReason,
    lastUpdated
  };

  return scoreSnapshotSchema.parse(snapshot);
}

const buildGlobalScoreSnapshotCached = canUseNextCache
  ? unstable_cache(async () => buildScoreSnapshotInternal({ mode: "global" }, { scope: "global" }), ["score-snapshot:global"], {
      revalidate: 900,
      tags: ["score:global"]
    })
  : async () => buildScoreSnapshotInternal({ mode: "global" }, { scope: "global" });

function buildCountryScoreSnapshotCached(countryCode: string) {
  const normalizedCode = countryCode.toUpperCase();
  const run = async () => {
    const country = getCountryByCode(normalizedCode);

    if (!country) {
      throw new Error(`Unsupported country code: ${normalizedCode}`);
    }

    return buildScoreSnapshotInternal({ mode: "country", country }, { scope: "country", countryCode: country.code });
  };

  return canUseNextCache
    ? unstable_cache(run, [`score-snapshot:country:${normalizedCode}`], {
        revalidate: 900,
        tags: ["scores:countries", `score:country:${normalizedCode}`]
      })()
    : run();
}

const buildAllCountrySnapshotsCached = canUseNextCache
  ? unstable_cache(async () => Promise.all(starterCountries.map((country) => buildCountryScoreSnapshotCached(country.code))), ["score-snapshot:leaderboard"], {
      revalidate: 900,
      tags: ["scores:countries"]
    })
  : async () => Promise.all(starterCountries.map((country) => buildCountryScoreSnapshotCached(country.code)));

const buildSourceHealthSnapshotCached = canUseNextCache
  ? unstable_cache(
      async () => {
        const results = await collectSourceResults({ mode: "global" });
        return results.map((result) => result.health);
      },
      ["source-health"],
      { revalidate: 300, tags: ["source-health"] }
    )
  : async () => {
      const results = await collectSourceResults({ mode: "global" });
      return results.map((result) => result.health);
    };

export async function buildScoreSnapshot(options: { scope: "global" } | { scope: "country"; countryCode: string }) {
  return options.scope === "global" ? buildGlobalScoreSnapshotCached() : buildCountryScoreSnapshotCached(options.countryCode);
}

export async function buildCountryLeaderboard(limit = 5) {
  const [globalSnapshot, countrySnapshots] = await Promise.all([buildGlobalScoreSnapshotCached(), buildAllCountrySnapshotsCached()]);
  const ranked = [...countrySnapshots].sort((left, right) => right.score - left.score);

  const enrich = (snapshot: ScoreSnapshot) => ({
    ...snapshot,
    deltaVsGlobal: round(snapshot.score - globalSnapshot.score, 1)
  });

  return {
    mostFucked: ranked.slice(0, limit).map(enrich),
    leastFucked: [...ranked].reverse().slice(0, limit).map(enrich)
  };
}

export async function buildSourceHealthSnapshot() {
  return buildSourceHealthSnapshotCached();
}

