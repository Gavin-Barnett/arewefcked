import { Panel } from "@/components/panel";
import type { DomainBreakdown } from "@/lib/types/score";

function statusLabel(score: number) {
  if (score >= 80) {
    return "Critical pressure";
  }

  if (score >= 60) {
    return "Heavy pressure";
  }

  if (score >= 35) {
    return "Elevated";
  }

  if (score >= 15) {
    return "Active";
  }

  if (score > 0) {
    return "Low";
  }

  return "Quiet";
}

function confidenceLabel(confidence: number) {
  if (confidence >= 0.8) {
    return "High confidence";
  }

  if (confidence >= 0.55) {
    return "Solid confidence";
  }

  if (confidence >= 0.3) {
    return "Limited confidence";
  }

  return "Thin confidence";
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
            className="relative flex min-h-[17.5rem] flex-col overflow-hidden rounded-[1.45rem] border border-white/10 bg-white/[0.04] shadow-panel"
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
              <div className="h-[6.5rem] space-y-2">
                <h3 className="max-w-[11ch] font-semibold text-[1.3rem] text-ink leading-[1.2] tracking-tight">
                  {domain.label}
                </h3>
                <p className="text-ink/55 text-sm">
                  Share of overall score {Math.round(domain.weight * 100)}%
                </p>
              </div>

              <div className="mt-4 h-[8.5rem]">
                <p className="font-mono text-[2.8rem] text-ink leading-none">
                  {domain.score.toFixed(1)}
                </p>
                <div className="mt-5 flex flex-col items-start gap-3">
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[0.72rem] text-ink/80 uppercase tracking-[0.24em]">
                    {statusLabel(domain.score)}
                  </span>
                  <p className="text-[0.72rem] text-ink/45 uppercase tracking-[0.24em]">
                    {confidenceLabel(domain.confidence)}
                  </p>
                </div>
              </div>

              <p className="mt-auto border-white/8 border-t pt-4 text-ink/55 text-sm">
                Confidence {Math.round(domain.confidence * 100)}%
              </p>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}
