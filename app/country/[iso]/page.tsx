import { formatDistanceToNow } from "date-fns";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { TrendSummary } from "@/components/charts/trend-summary";
import { DomainBreakdownGrid } from "@/components/domain-breakdown-grid";
import { EvidenceGrid } from "@/components/news/evidence-grid";
import { Panel } from "@/components/panel";
import { SourceHealthGrid } from "@/components/source-health-grid";
import { SparseBanner } from "@/components/sparse-banner";
import { TopDriverGrid } from "@/components/top-driver-grid";
import { VerdictHero } from "@/components/verdict-hero";
import { getCountryByCode } from "@/lib/countries/starter-countries";
import { buildScoreSnapshot } from "@/lib/scoring/engine";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 900;

function updatedLabel(lastUpdated: string | null) {
  if (!lastUpdated) {
    return "Awaiting first successful sync";
  }

  return `Updated ${formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}`;
}

function comparisonLabel(delta: number) {
  if (delta > 0) {
    return "hotter";
  }

  if (delta < 0) {
    return "cooler";
  }

  return "roughly in line";
}

export async function generateMetadata(props: {
  params: Promise<{ iso: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const country = getCountryByCode(params.iso);

  if (!country) {
    return {
      title: "Country not found",
    };
  }

  const description = `Live severity index for ${country.name}, backed by real-world events, risk signals, and current news.`;
  const siteUrl = getSiteUrl();
  const socialImage = {
    url: `/country/${country.code}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: `${country.name} share card with country risk dial`,
  };

  return {
    title: country.name,
    description,
    alternates: {
      canonical: `/country/${country.code}`,
    },
    openGraph: {
      title: `${country.name} | Are we Fcked?`,
      description,
      url: new URL(`/country/${country.code}`, siteUrl).toString(),
      type: "website",
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${country.name} | Are we Fcked?`,
      description,
      images: [socialImage],
    },
  };
}

export default async function CountryPage(props: {
  params: Promise<{ iso: string }>;
}) {
  const params = await props.params;
  const country = getCountryByCode(params.iso);

  if (!country) {
    notFound();
  }

  const [countrySnapshot, globalSnapshot] = await Promise.all([
    buildScoreSnapshot({ scope: "country", countryCode: country.code }),
    buildScoreSnapshot({ scope: "global" }),
  ]);

  const delta = Number(
    (countrySnapshot.score - globalSnapshot.score).toFixed(1)
  );

  return (
    <div className="space-y-8 py-0 sm:space-y-10">
      <VerdictHero
        confidence={countrySnapshot.confidence}
        currentCountryCode={country.code}
        description={countrySnapshot.verdictMessage}
        freshness={countrySnapshot.freshness}
        heading={
          <>
            <span className="block">{country.name} is</span>
            <span className="block text-primary">
              {countrySnapshot.shortLabel}.
            </span>
          </>
        }
        scopeLabel={`${country.name} severity index`}
        score={countrySnapshot.score}
        shortLabel={countrySnapshot.shortLabel}
        updatedLabel={updatedLabel(countrySnapshot.lastUpdated)}
      />

      <AdSlot />

      <TopDriverGrid
        drivers={countrySnapshot.topDrivers}
        evidence={countrySnapshot.evidence}
        eyebrow="Drivers"
        title={`What moved ${country.name}`}
      />

      <div className="grid gap-8 xl:grid-cols-[1.14fr_0.86fr] xl:items-start">
        <div className="space-y-8">
          <EvidenceGrid evidence={countrySnapshot.evidence} limit={4} />
          <DomainBreakdownGrid domains={countrySnapshot.domainBreakdown} />
        </div>
        <div className="space-y-8 xl:sticky xl:top-6">
          {countrySnapshot.sparseData && countrySnapshot.sparseReason ? (
            <SparseBanner reason={countrySnapshot.sparseReason} />
          ) : null}
          <Panel eyebrow="Context" title={`What is shaping ${country.name}`}>
            <ul className="space-y-3 text-base text-ink/78 leading-7">
              {countrySnapshot.summaryBullets.map((bullet) => (
                <li
                  className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-4"
                  key={bullet}
                >
                  {bullet}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3 text-ink/68 text-sm">
              <Link
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 transition hover:border-white/20 hover:text-ink"
                href="/methodology"
              >
                Read methodology
              </Link>
              <Link
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 transition hover:border-white/20 hover:text-ink"
                href="/"
              >
                Back to global
              </Link>
            </div>
          </Panel>

          <Panel
            eyebrow="Comparison"
            title={`${country.name} versus the global baseline`}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] p-5">
                <p className="font-mono text-[0.68rem] text-primary/72 uppercase tracking-[0.28em]">
                  {country.name}
                </p>
                <p className="mt-3 font-mono text-4xl text-ink">
                  {countrySnapshot.score.toFixed(1)}
                </p>
                <p className="mt-2 text-ink/60 text-sm">
                  {countrySnapshot.shortLabel}
                </p>
              </div>
              <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] p-5">
                <p className="font-mono text-[0.68rem] text-primary/72 uppercase tracking-[0.28em]">
                  Global baseline
                </p>
                <p className="mt-3 font-mono text-4xl text-ink">
                  {globalSnapshot.score.toFixed(1)}
                </p>
                <p className="mt-2 text-ink/60 text-sm">
                  {globalSnapshot.shortLabel}
                </p>
              </div>
            </div>
            <p className="mt-4 text-ink/68 text-sm leading-6">
              {country.name} currently reads {comparisonLabel(delta)} than the
              global baseline by {Math.abs(delta).toFixed(1)} points.
            </p>
          </Panel>

          <TrendSummary trend={countrySnapshot.trend} />
        </div>
      </div>

      <SourceHealthGrid sources={countrySnapshot.sourceHealth} />
    </div>
  );
}
