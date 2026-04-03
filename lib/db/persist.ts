import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { SourceFetchResult } from "@/lib/sources/base";
import type { DomainBreakdown, ScoreSnapshot } from "@/lib/types/score";

function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function ensureSource(result: SourceFetchResult) {
  return prisma.source.upsert({
    where: { key: result.sourceKey },
    update: {
      name: result.sourceName,
      baseUrl: result.sourceUrl,
      freshnessTargetMinutes: result.sourceKey === "usgs" ? 15 : 30,
      isActive: true,
    },
    create: {
      key: result.sourceKey,
      name: result.sourceName,
      baseUrl: result.sourceUrl,
      freshnessTargetMinutes: result.sourceKey === "usgs" ? 15 : 30,
      isActive: true,
    },
  });
}

export async function persistSourceResult(result: SourceFetchResult) {
  const source = await ensureSource(result);
  const run = await prisma.ingestionRun.create({
    data: {
      sourceId: source.id,
      status: "running",
      rawCount: result.events.length,
      normalizedCount: result.events.length,
      metadata: toPrismaJson({
        sourceUrl: result.sourceUrl,
        notes: result.notes,
      }),
    },
  });

  try {
    await Promise.all(
      result.events.map(async (event) => {
        await prisma.rawEvent.upsert({
          where: { id: event.id },
          update: {
            sourceKey: result.sourceKey,
            providerEventId: event.id,
            title: event.title,
            occurredAt: new Date(event.occurredAt),
            payload: toPrismaJson(event),
          },
          create: {
            id: event.id,
            sourceKey: result.sourceKey,
            providerEventId: event.id,
            title: event.title,
            occurredAt: new Date(event.occurredAt),
            payload: toPrismaJson(event),
          },
        });

        await prisma.normalizedEvent.upsert({
          where: { id: event.id },
          update: {
            source: event.source,
            sourceType: event.sourceType,
            title: event.title,
            summary: event.summary,
            url: event.url,
            countryCodes: event.countryCodes,
            region: event.region,
            occurredAt: new Date(event.occurredAt),
            ingestedAt: new Date(event.ingestedAt),
            domain: event.domain,
            severityRaw: event.severityRaw,
            severityNormalized: event.severityNormalized,
            confidence: event.confidence,
            tags: event.tags ?? [],
            metadata: event.metadata ? toPrismaJson(event.metadata) : undefined,
          },
          create: {
            id: event.id,
            source: event.source,
            sourceType: event.sourceType,
            title: event.title,
            summary: event.summary,
            url: event.url,
            countryCodes: event.countryCodes,
            region: event.region,
            occurredAt: new Date(event.occurredAt),
            ingestedAt: new Date(event.ingestedAt),
            domain: event.domain,
            severityRaw: event.severityRaw,
            severityNormalized: event.severityNormalized,
            confidence: event.confidence,
            tags: event.tags ?? [],
            metadata: event.metadata ? toPrismaJson(event.metadata) : undefined,
          },
        });
      })
    );

    await prisma.sourceHealth.upsert({
      where: { sourceKey: result.sourceKey },
      update: {
        status: result.health.status,
        freshness: result.health.freshness.replace("-", "_") as
          | "live_ish"
          | "fresh"
          | "delayed"
          | "stale",
        lastSuccessfulSync: result.health.lastSuccessfulSync
          ? new Date(result.health.lastSuccessfulSync)
          : null,
        lastAttemptAt: result.health.lastAttemptAt
          ? new Date(result.health.lastAttemptAt)
          : null,
        outageMessage: result.health.outageMessage,
        latencyMs: result.health.latencyMs,
        metadata: toPrismaJson({
          active: result.health.active,
          notes: result.health.notes,
        }),
      },
      create: {
        sourceKey: result.sourceKey,
        status: result.health.status,
        freshness: result.health.freshness.replace("-", "_") as
          | "live_ish"
          | "fresh"
          | "delayed"
          | "stale",
        lastSuccessfulSync: result.health.lastSuccessfulSync
          ? new Date(result.health.lastSuccessfulSync)
          : null,
        lastAttemptAt: result.health.lastAttemptAt
          ? new Date(result.health.lastAttemptAt)
          : null,
        outageMessage: result.health.outageMessage,
        latencyMs: result.health.latencyMs,
        metadata: toPrismaJson({
          active: result.health.active,
          notes: result.health.notes,
        }),
      },
    });

    await prisma.ingestionRun.update({
      where: { id: run.id },
      data: {
        status: "succeeded",
        finishedAt: new Date(),
      },
    });
  } catch (error) {
    await prisma.ingestionRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        error:
          error instanceof Error ? error.message : "Unknown ingestion failure",
      },
    });

    throw error;
  }
}

export async function persistScoreSnapshot(snapshot: ScoreSnapshot) {
  if (snapshot.scope === "global") {
    await prisma.globalScore.create({
      data: {
        score: snapshot.score,
        band: snapshot.band,
        shortLabel: snapshot.shortLabel,
        verdictMessage: snapshot.verdictMessage,
        confidence: snapshot.confidence,
        freshness: snapshot.freshness.replace("-", "_") as
          | "live_ish"
          | "fresh"
          | "delayed"
          | "stale",
        methodologyBlurb: snapshot.methodologyBlurb,
        sparseReason: snapshot.sparseReason,
      },
    });
  } else if (snapshot.countryCode) {
    await prisma.countryScore.create({
      data: {
        countryCode: snapshot.countryCode,
        score: snapshot.score,
        band: snapshot.band,
        shortLabel: snapshot.shortLabel,
        verdictMessage: snapshot.verdictMessage,
        confidence: snapshot.confidence,
        freshness: snapshot.freshness.replace("-", "_") as
          | "live_ish"
          | "fresh"
          | "delayed"
          | "stale",
        methodologyBlurb: snapshot.methodologyBlurb,
        sparseReason: snapshot.sparseReason,
      },
    });
  }

  await prisma.scoreComponent.createMany({
    data: snapshot.domainBreakdown.map((domain: DomainBreakdown) => ({
      scope: snapshot.scope,
      scopeKey: snapshot.scopeKey,
      domain: domain.domain,
      score: domain.score,
      weight: domain.weight,
      coverage: domain.coverage,
      confidence: domain.confidence,
      evidenceCount: domain.evidenceCount,
      notes: domain.summary,
    })),
  });
}
