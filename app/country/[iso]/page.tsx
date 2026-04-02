import type { Metadata } from "next";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { DomainBreakdownGrid } from "@/components/domain-breakdown-grid";
import { TrendSummary } from "@/components/charts/trend-summary";
import { EvidenceGrid } from "@/components/news/evidence-grid";
import { Panel } from "@/components/panel";
import { SourceHealthGrid } from "@/components/source-health-grid";
import { SparseBanner } from "@/components/sparse-banner";
import { TopDriverGrid } from "@/components/top-driver-grid";
import { VerdictHero } from "@/components/verdict-hero";
import { getCountryByCode } from "@/lib/countries/starter-countries";
import { buildScoreSnapshot } from "@/lib/scoring/engine";

export const revalidate = 900;

function updatedLabel(lastUpdated: string | null) {
  if (!lastUpdated) {
    return "Awaiting first successful sync";
  }

  return `Updated ${formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}`;
}

export async function generateMetadata(props: { params: Promise<{ iso: string }> }): Promise<Metadata> {
  const params = await props.params;
  const country = getCountryByCode(params.iso);

  if (!country) {
    return {
      title: "Country not found"
    };
  }

  const description = `Live severity index for ${country.name}, backed by real-world events, risk signals, and current news.`;

  return {
    title: country.name,
    description,
    alternates: {
      canonical: `/country/${country.code}`
    },
    openGraph: {
      title: `${country.name} | Are we Fcked?`,
      description,
      url: `/country/${country.code}`,
      type: "website",
      images: [{ url: `/country/${country.code}/opengraph-image` }]
    },
    twitter: {
      card: "summary_large_image",
      title: `${country.name} | Are we Fcked?`,
      description,
      images: [`/country/${country.code}/opengraph-image`]
    }
  };
}

export default async function CountryPage(props: { params: Promise<{ iso: string }> }) {
  const params = await props.params;
  const country = getCountryByCode(params.iso);

  if (!country) {
    notFound();
  }

  const [countrySnapshot, globalSnapshot] = await Promise.all([
    buildScoreSnapshot({ scope: "country", countryCode: country.code }),
    buildScoreSnapshot({ scope: "global" })
  ]);

  const delta = Number((countrySnapshot.score - globalSnapshot.score).toFixed(1));

  return (
    <div className="space-y-8 py-0 sm:space-y-10">
      <VerdictHero
        heading={
          <>
            <span className="block">{country.name} is</span>
            <span className="block text-primary">{countrySnapshot.shortLabel}.</span>
          </>
        }
        description={countrySnapshot.verdictMessage}
        updatedLabel={updatedLabel(countrySnapshot.lastUpdated)}
        score={countrySnapshot.score}
        shortLabel={countrySnapshot.shortLabel}
        confidence={countrySnapshot.confidence}
        freshness={countrySnapshot.freshness}
        scopeLabel={`${country.name} severity index`}
        currentCountryCode={country.code}
      />

      <AdSlot />

      <TopDriverGrid title={`What moved ${country.name}`} eyebrow="Drivers" drivers={countrySnapshot.topDrivers} evidence={countrySnapshot.evidence} />

      <div className="grid gap-8 xl:grid-cols-[1.14fr_0.86fr] xl:items-start">
        <div className="space-y-8">
          <EvidenceGrid evidence={countrySnapshot.evidence} limit={4} />
          <DomainBreakdownGrid domains={countrySnapshot.domainBreakdown} />
        </div>
        <div className="space-y-8 xl:sticky xl:top-6">
          {countrySnapshot.sparseData && countrySnapshot.sparseReason ? <SparseBanner reason={countrySnapshot.sparseReason} /> : null}
          <Panel eyebrow="Context" title={`What is shaping ${country.name}`}>
            <ul className="space-y-3 text-base leading-7 text-ink/78">
              {countrySnapshot.summaryBullets.map((bullet) => (
                <li key={bullet} className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-4">
                  {bullet}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-ink/68">
              <Link className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 transition hover:border-white/20 hover:text-ink" href="/methodology">
                Read methodology
              </Link>
              <Link className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 transition hover:border-white/20 hover:text-ink" href="/">
                Back to global
              </Link>
            </div>
          </Panel>

          <Panel eyebrow="Comparison" title={`${country.name} versus the global baseline`}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] p-5">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-primary/72">{country.name}</p>
                <p className="mt-3 font-mono text-4xl text-ink">{countrySnapshot.score.toFixed(1)}</p>
                <p className="mt-2 text-sm text-ink/60">{countrySnapshot.shortLabel}</p>
              </div>
              <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] p-5">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-primary/72">Global baseline</p>
                <p className="mt-3 font-mono text-4xl text-ink">{globalSnapshot.score.toFixed(1)}</p>
                <p className="mt-2 text-sm text-ink/60">{globalSnapshot.shortLabel}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-ink/68">
              {country.name} currently reads {delta >= 0 ? "hotter" : delta < 0 ? "cooler" : "roughly in line"} than the global baseline by {Math.abs(delta).toFixed(1)} points.
            </p>
          </Panel>

          <TrendSummary trend={countrySnapshot.trend} />
        </div>
      </div>

      <SourceHealthGrid sources={countrySnapshot.sourceHealth} />
    </div>
  );
}