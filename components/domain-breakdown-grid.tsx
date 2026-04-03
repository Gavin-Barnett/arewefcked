import { Panel } from "@/components/panel";
import type { DomainBreakdown } from "@/lib/types/score";

function evidenceCopy(count: number, coverage: DomainBreakdown["coverage"]) {
  if (coverage === "sparse") {
    return `${count} live proxy signal${count === 1 ? "" : "s"} in this window`;
  }

  return `${count} evidence item${count === 1 ? "" : "s"} in this window`;
}

function domainAccent(score: number) {
  if (score >= 70) {
    return "linear-gradient(90deg, rgba(239,68,68,0.2), rgba(239,68,68,0.95))";
  }

  if (score >= 30) {
    return "linear-gradient(90deg, rgba(245,158,11,0.2), rgba(245,158,11,0.95))";
  }

  return "linear-gradient(90deg, rgba(34,197,94,0.2), rgba(34,197,94,0.95))";
}

export function DomainBreakdownGrid(props: { domains: DomainBreakdown[] }) {
  return (
    <Panel eyebrow="Drivers" title="Domain breakdown">
      <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-4">
        {props.domains.map((domain) => (
          <article
            className="relative flex min-h-[20rem] flex-col overflow-hidden rounded-[1.45rem] border border-white/10 bg-white/[0.04] shadow-panel"
            key={domain.domain}
          >
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-1.5"
              style={{
                background: domainAccent(domain.score),
              }}
            />
            <div className="relative flex h-full flex-col p-5">
              <div className="space-y-2">
                <h3 className="max-w-[11ch] font-semibold text-[1.3rem] text-ink leading-[1.2] tracking-tight">
                  {domain.label}
                </h3>
                <p className="text-ink/55 text-sm">
                  Weight {Math.round(domain.weight * 100)}%
                </p>
              </div>

              <div className="mt-6">
                <p className="font-mono text-[2.8rem] text-ink leading-none">
                  {domain.score.toFixed(1)}
                </p>
                <div className="mt-3 space-y-1 text-ink/60 text-sm">
                  <p>Confidence {Math.round(domain.confidence * 100)}%</p>
                  <p>Coverage {domain.coverage}</p>
                  <p>{evidenceCopy(domain.evidenceCount, domain.coverage)}</p>
                </div>
              </div>

              <p className="mt-5 flex-1 text-ink/70 text-sm leading-6">
                {domain.summary}
              </p>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}
