-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RiskDomain" AS ENUM ('conflict_security', 'civil_unrest', 'macroeconomic', 'public_health', 'natural_disaster', 'climate_environment', 'cyber_infra', 'governance');

-- CreateEnum
CREATE TYPE "FreshnessState" AS ENUM ('live_ish', 'fresh', 'delayed', 'stale');

-- CreateEnum
CREATE TYPE "VerdictTone" AS ENUM ('dry', 'grim', 'wry', 'clinical');

-- CreateEnum
CREATE TYPE "CoverageState" AS ENUM ('measured', 'sparse', 'unavailable');

-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('running', 'succeeded', 'failed');

-- CreateEnum
CREATE TYPE "SourceHealthStatus" AS ENUM ('operational', 'degraded', 'offline');

-- CreateEnum
CREATE TYPE "ScoreScope" AS ENUM ('global', 'country');

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT,
    "freshnessTargetMinutes" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionRun" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" "IngestionStatus" NOT NULL DEFAULT 'running',
    "rawCount" INTEGER NOT NULL DEFAULT 0,
    "normalizedCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "metadata" JSONB,

    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawArticle" (
    "id" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "url" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "countryCodes" TEXT[],
    "clusterKey" TEXT,
    "publishedAt" TIMESTAMP(3),
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,

    CONSTRAINT "RawArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawEvent" (
    "id" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "providerEventId" TEXT,
    "title" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,

    CONSTRAINT "RawEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NormalizedEvent" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "url" TEXT,
    "countryCodes" TEXT[],
    "region" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "ingestedAt" TIMESTAMP(3) NOT NULL,
    "domain" "RiskDomain" NOT NULL,
    "severityRaw" DOUBLE PRECISION,
    "severityNormalized" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "tags" TEXT[],
    "metadata" JSONB,

    CONSTRAINT "NormalizedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalScore" (
    "id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "band" INTEGER NOT NULL,
    "shortLabel" TEXT NOT NULL,
    "verdictMessage" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "freshness" "FreshnessState" NOT NULL,
    "methodologyBlurb" TEXT,
    "sparseReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlobalScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CountryScore" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "band" INTEGER NOT NULL,
    "shortLabel" TEXT NOT NULL,
    "verdictMessage" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "freshness" "FreshnessState" NOT NULL,
    "methodologyBlurb" TEXT,
    "sparseReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CountryScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreComponent" (
    "id" TEXT NOT NULL,
    "scope" "ScoreScope" NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "domain" "RiskDomain" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "coverage" "CoverageState" NOT NULL,
    "confidence" DOUBLE PRECISION,
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "change24h" DOUBLE PRECISION,
    "change7d" DOUBLE PRECISION,
    "change30d" DOUBLE PRECISION,
    "notes" TEXT,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerdictMessage" (
    "id" TEXT NOT NULL,
    "band" INTEGER NOT NULL,
    "tone" "VerdictTone" NOT NULL,
    "text" TEXT NOT NULL,
    "allowedScopes" TEXT[],
    "minConfidence" DOUBLE PRECISION,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerdictMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsCluster" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "affectedDomain" "RiskDomain",
    "whyItMatters" TEXT,
    "representativeUrls" TEXT[],
    "countryCodes" TEXT[],
    "sourceMix" JSONB,
    "measuredImpact" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "SourceHealth" (
    "id" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "status" "SourceHealthStatus" NOT NULL,
    "freshness" "FreshnessState" NOT NULL,
    "lastSuccessfulSync" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),
    "outageMessage" TEXT,
    "latencyMs" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceHealth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Source_key_key" ON "Source"("key");

-- CreateIndex
CREATE INDEX "IngestionRun_startedAt_idx" ON "IngestionRun"("startedAt");

-- CreateIndex
CREATE INDEX "RawArticle_sourceKey_publishedAt_idx" ON "RawArticle"("sourceKey", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RawEvent_providerEventId_key" ON "RawEvent"("providerEventId");

-- CreateIndex
CREATE INDEX "RawEvent_sourceKey_occurredAt_idx" ON "RawEvent"("sourceKey", "occurredAt");

-- CreateIndex
CREATE INDEX "NormalizedEvent_domain_occurredAt_idx" ON "NormalizedEvent"("domain", "occurredAt");

-- CreateIndex
CREATE INDEX "GlobalScore_createdAt_idx" ON "GlobalScore"("createdAt");

-- CreateIndex
CREATE INDEX "CountryScore_countryCode_createdAt_idx" ON "CountryScore"("countryCode", "createdAt");

-- CreateIndex
CREATE INDEX "ScoreComponent_scope_scopeKey_measuredAt_idx" ON "ScoreComponent"("scope", "scopeKey", "measuredAt");

-- CreateIndex
CREATE INDEX "VerdictMessage_band_idx" ON "VerdictMessage"("band");

-- CreateIndex
CREATE UNIQUE INDEX "SourceHealth_sourceKey_key" ON "SourceHealth"("sourceKey");

-- AddForeignKey
ALTER TABLE "IngestionRun" ADD CONSTRAINT "IngestionRun_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountryScore" ADD CONSTRAINT "CountryScore_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE CASCADE ON UPDATE CASCADE;
