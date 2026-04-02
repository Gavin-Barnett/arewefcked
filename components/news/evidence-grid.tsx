import { formatDistanceToNow } from "date-fns";
import { Panel } from "@/components/panel";
import type { EvidenceItem } from "@/lib/types/score";

export function EvidenceGrid(props: { evidence: EvidenceItem[]; limit?: number }) {
  const items = props.evidence.slice(0, props.limit ?? 4);

  return (
    <Panel eyebrow="Key headlines" title="Evidence shaping the score">
      {props.evidence.length === 0 ? (
        <div className="rounded-[1rem] border border-dashed border-white/15 p-5 text-sm leading-6 text-ink/65">
          No evidence item cleared the surfacing threshold during this request. The score can still be low, sparse, or both without pretending otherwise.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="grid gap-4 rounded-[1.05rem] border border-white/10 bg-white/[0.04] p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3 text-[0.68rem] uppercase tracking-[0.24em] text-ink/45">
                  <span className="font-mono text-primary/75">{item.source}</span>
                  <span>{formatDistanceToNow(new Date(item.occurredAt), { addSuffix: true })}</span>
                  <span>{item.domain.replaceAll("_", " ")}</span>
                  {item.countryCodes.length > 0 ? <span>{item.countryCodes.join(", ")}</span> : <span>Global</span>}
                </div>
                <h3 className="clamp-2 mt-3 text-[1.18rem] font-semibold leading-[1.18] tracking-tight text-ink">{item.title}</h3>
                <p className="clamp-2 mt-3 text-sm leading-6 text-ink/70">{item.summary}</p>
              </div>
              <div className="flex flex-col items-start gap-3 md:items-end">
                <p className="font-mono text-4xl leading-none text-ink">{item.severity.toFixed(1)}</p>
                {item.url ? (
                  <a className="text-sm text-primary underline decoration-primary/40 underline-offset-4" href={item.url} target="_blank" rel="noreferrer">
                    Open source
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}