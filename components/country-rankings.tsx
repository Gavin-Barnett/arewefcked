import Link from "next/link";
import { Panel } from "@/components/panel";
import { StatusPill } from "@/components/status-pill";
import type { ScoreSnapshot } from "@/lib/types/score";

type RankedSnapshot = ScoreSnapshot & { deltaVsGlobal: number };

function deltaTone(delta: number) {
  if (delta > 0) return "danger" as const;
  if (delta < 0) return "success" as const;
  return "neutral" as const;
}

export function CountryRankings(props: { mostFucked: RankedSnapshot[]; leastFucked: RankedSnapshot[] }) {
  return (
    <Panel eyebrow="Rankings" title="Most and least fucked tracked countries">
      <div className="space-y-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-ink">Most fucked</h3>
            <StatusPill label="Tracked top 5" tone="danger" />
          </div>
          {props.mostFucked.map((entry, index) => (
            <Link key={entry.scopeKey} href={`/country/${entry.countryCode}`} className="grid gap-3 rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-4 transition hover:border-white/20 hover:bg-white/[0.06] md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-danger/30 bg-danger/10 font-mono text-sm text-red-100">{String(index + 1).padStart(2, "0")}</div>
              <div>
                <p className="text-base font-semibold text-ink">{entry.countryName}</p>
                <p className="mt-1 text-sm text-ink/58">{entry.shortLabel}</p>
              </div>
              <div className="text-left md:text-right">
                <p className="font-mono text-3xl leading-none text-ink">{entry.score.toFixed(1)}</p>
                <p className="mt-1 text-sm text-danger">{entry.deltaVsGlobal >= 0 ? "+" : ""}{entry.deltaVsGlobal.toFixed(1)} vs global</p>
              </div>
            </Link>
          ))}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-ink">Least fucked</h3>
            <StatusPill label="Tracked bottom 5" tone="success" />
          </div>
          {props.leastFucked.map((entry, index) => (
            <Link key={entry.scopeKey} href={`/country/${entry.countryCode}`} className="grid gap-3 rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-4 transition hover:border-white/20 hover:bg-white/[0.06] md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-moss/30 bg-moss/10 font-mono text-sm text-emerald-100">{String(index + 1).padStart(2, "0")}</div>
              <div>
                <p className="text-base font-semibold text-ink">{entry.countryName}</p>
                <p className="mt-1 text-sm text-ink/58">{entry.shortLabel}</p>
              </div>
              <div className="flex flex-col items-start gap-2 md:items-end">
                <p className="font-mono text-3xl leading-none text-ink">{entry.score.toFixed(1)}</p>
                <StatusPill label={`${entry.deltaVsGlobal >= 0 ? "+" : ""}${entry.deltaVsGlobal.toFixed(1)} vs global`} tone={deltaTone(entry.deltaVsGlobal)} />
              </div>
            </Link>
          ))}
        </section>
      </div>
    </Panel>
  );
}


