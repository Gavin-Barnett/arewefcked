import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { CountryRankings } from "@/components/country-rankings";
import { DomainBreakdownGrid } from "@/components/domain-breakdown-grid";
import { TrendSummary } from "@/components/charts/trend-summary";
import { EvidenceGrid } from "@/components/news/evidence-grid";
import { Panel } from "@/components/panel";
import { SourceHealthGrid } from "@/components/source-health-grid";
import { SparseBanner } from "@/components/sparse-banner";
import { TopDriverGrid } from "@/components/top-driver-grid";
import { VerdictHero } from "@/components/verdict-hero";
import { resolveCountryInput } from "@/lib/countries/starter-countries";
import { buildCountryLeaderboard, buildScoreSnapshot } from "@/lib/scoring/engine";

export const revalidate = 900;

type HomeSearchParams = {
  country?: string | string[];
  c?: string | string[];
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function updatedLabel(lastUpdated: string | null) {
  if (!lastUpdated) {
    return "Awaiting first successful sync";
  }

  return `Updated ${formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}`;
}

export default async function HomePage(props: { searchParams: Promise<HomeSearchParams> }) {
  const searchParams = await props.searchParams;
  const requestedCountry = firstValue(searchParams.country) ?? firstValue(searchParams.c);
  const resolvedCountry = requestedCountry ? resolveCountryInput(requestedCountry) : null;

  if (resolvedCountry) {
    redirect(`/country/${resolvedCountry.code}`);
  }

  const [snapshot, leaderboard] = await Promise.all([buildScoreSnapshot({ scope: "global" }), buildCountryLeaderboard(5)]);

  return (
    <div className="space-y-8 py-0 sm:space-y-10">
      <VerdictHero
        heading={
          <>
            <span className="block">We&apos;re</span>
            <span className="block text-primary">{snapshot.shortLabel}.</span>
          </>
        }
        description={snapshot.verdictMessage}
        updatedLabel={updatedLabel(snapshot.lastUpdated)}
        score={snapshot.score}
        shortLabel={snapshot.shortLabel}
        confidence={snapshot.confidence}
        freshness={snapshot.freshness}
        scopeLabel="Live global severity index"
      />

      <AdSlot />

      <TopDriverGrid title="What moved the meter" eyebrow="Drivers" drivers={snapshot.topDrivers} evidence={snapshot.evidence} />

      <div className="grid gap-8 xl:grid-cols-[1.14fr_0.86fr] xl:items-start">
        <div className="space-y-8">
          <EvidenceGrid evidence={snapshot.evidence} limit={4} />
          <DomainBreakdownGrid domains={snapshot.domainBreakdown} />
        </div>
        <div className="space-y-8 xl:sticky xl:top-6">
          {snapshot.sparseData && snapshot.sparseReason ? <SparseBanner reason={snapshot.sparseReason} /> : null}
          <Panel eyebrow="Context" title="What is holding this reading up">
            <ul className="space-y-3 text-base leading-7 text-ink/78">
              {snapshot.summaryBullets.map((bullet) => (
                <li key={bullet} className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-4">
                  {bullet}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-ink/68">
              <Link className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 transition hover:border-white/20 hover:text-ink" href="/methodology">
                Read methodology
              </Link>
              <Link className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 transition hover:border-white/20 hover:text-ink" href="/source-health">
                Inspect source health
              </Link>
            </div>
          </Panel>
          <TrendSummary trend={snapshot.trend} />
          <CountryRankings mostFucked={leaderboard.mostFucked} leastFucked={leaderboard.leastFucked} />
        </div>
      </div>

      <SourceHealthGrid sources={snapshot.sourceHealth} />
    </div>
  );
}