import { formatDistanceToNow } from "date-fns";
import { redirect } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { TrendSummary } from "@/components/charts/trend-summary";
import { CountryRankings } from "@/components/country-rankings";
import { DomainBreakdownGrid } from "@/components/domain-breakdown-grid";
import { EvidenceGrid } from "@/components/news/evidence-grid";
import { Panel } from "@/components/panel";
import { SourceHealthGrid } from "@/components/source-health-grid";
import { SparseBanner } from "@/components/sparse-banner";
import { TopDriverGrid } from "@/components/top-driver-grid";
import { VerdictHero } from "@/components/verdict-hero";
import { resolveCountryInput } from "@/lib/countries/starter-countries";
import {
  buildCountryLeaderboard,
  buildScoreSnapshot,
} from "@/lib/scoring/engine";

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

export default async function HomePage(props: {
  searchParams: Promise<HomeSearchParams>;
}) {
  const searchParams = await props.searchParams;
  const requestedCountry =
    firstValue(searchParams.country) ?? firstValue(searchParams.c);
  const resolvedCountry = requestedCountry
    ? resolveCountryInput(requestedCountry)
    : null;

  if (resolvedCountry) {
    redirect(`/country/${resolvedCountry.code}`);
  }

  const [snapshot, leaderboard] = await Promise.all([
    buildScoreSnapshot({ scope: "global" }),
    buildCountryLeaderboard(5),
  ]);

  return (
    <div className="space-y-8 py-0 sm:space-y-10">
      <VerdictHero
        confidence={snapshot.confidence}
        description={snapshot.verdictMessage}
        freshness={snapshot.freshness}
        heading={
          <>
            <span className="block">We&apos;re</span>
            <span className="block text-primary">{snapshot.shortLabel}.</span>
          </>
        }
        scopeLabel="Live global severity index"
        score={snapshot.score}
        shortLabel={snapshot.shortLabel}
        updatedLabel={updatedLabel(snapshot.lastUpdated)}
      />

      <AdSlot />

      <TopDriverGrid
        drivers={snapshot.topDrivers}
        evidence={snapshot.evidence}
        eyebrow="Drivers"
        title="What moved the meter"
      />

      <div className="grid gap-8 xl:grid-cols-[1.14fr_0.86fr] xl:items-start">
        <div className="space-y-8">
          <EvidenceGrid evidence={snapshot.evidence} limit={4} />
          <DomainBreakdownGrid domains={snapshot.domainBreakdown} />
        </div>
        <div className="space-y-8 xl:sticky xl:top-6">
          {snapshot.sparseData && snapshot.sparseReason ? (
            <SparseBanner reason={snapshot.sparseReason} />
          ) : null}
          <Panel eyebrow="Context" title="What is holding this reading up">
            <ul className="space-y-3 text-base text-ink/78 leading-7">
              {snapshot.summaryBullets.map((bullet) => (
                <li
                  className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-4"
                  key={bullet}
                >
                  {bullet}
                </li>
              ))}
            </ul>
          </Panel>
          <TrendSummary trend={snapshot.trend} />
          <div className="hidden xl:block">
            <CountryRankings
              leastFucked={leaderboard.leastFucked}
              mostFucked={leaderboard.mostFucked}
            />
          </div>
        </div>
      </div>

      <div className="xl:hidden">
        <CountryRankings
          leastFucked={leaderboard.leastFucked}
          mostFucked={leaderboard.mostFucked}
        />
      </div>

      <SourceHealthGrid sources={snapshot.sourceHealth} />
    </div>
  );
}
