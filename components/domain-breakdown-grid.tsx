import { Panel } from "@/components/panel";
import type { DomainBreakdown } from "@/lib/types/score";

function evidenceCopy(count: number, coverage: DomainBreakdown["coverage"]) {
  if (coverage === "sparse") {
    return `${count} live proxy signal${count === 1 ? "" : "s"} in this window`;
  }

  return `${count} evidence item${count === 1 ? "" : "s"} in this window`;
}

export function DomainBreakdownGrid(props: { domains: DomainBreakdown[] }) {
  return (
    <Panel eyebrow="Drivers" title="Domain breakdown">
      <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-4">
        {props.domains.map((domain) => (
          <article key={domain.domain} className="relative flex min-h-[20rem] flex-col overflow-hidden rounded-[1.45rem] border border-white/10 bg-white/[0.04] shadow-panel">
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-1.5"
              style={{
                background:
                  domain.score >= 70
                    ? "linear-gradient(90deg, rgba(239,68,68,0.2), rgba(239,68,68,0.95))"
                    : domain.score >= 30
                      ? "linear-gradient(90deg, rgba(245,158,11,0.2), rgba(245,158,11,0.95))"
                      : "linear-gradient(90deg, rgba(34,197,94,0.2), rgba(34,197,94,0.95))"
              }}
            />
            <div className="relative flex h-full flex-col p-5">
              <div className="space-y-2">
                <h3 className="max-w-[11ch] text-[1.3rem] font-semibold leading-[1.2] tracking-tight text-ink">{domain.label}</h3>
                <p className="text-sm text-ink/55">Weight {Math.round(domain.weight * 100)}%</p>
              </div>

              <div className="mt-6">
                <p className="font-mono text-[2.8rem] leading-none text-ink">{domain.score.toFixed(1)}</p>
                <div className="mt-3 space-y-1 text-sm text-ink/60">
                  <p>Confidence {Math.round(domain.confidence * 100)}%</p>
                  <p>Coverage {domain.coverage}</p>
                  <p>{evidenceCopy(domain.evidenceCount, domain.coverage)}</p>
                </div>
              </div>

              <p className="mt-5 flex-1 text-sm leading-6 text-ink/70">{domain.summary}</p>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}