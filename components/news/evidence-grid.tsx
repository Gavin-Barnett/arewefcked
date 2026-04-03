import { formatDistanceToNow } from "date-fns";
import { Panel } from "@/components/panel";
import type { EvidenceItem } from "@/lib/types/score";

export function EvidenceGrid(props: {
  evidence: EvidenceItem[];
  limit?: number;
}) {
  const items = props.evidence.slice(0, props.limit ?? 4);

  return (
    <Panel eyebrow="Key headlines" title="Evidence shaping the score">
      {props.evidence.length === 0 ? (
        <div className="rounded-[1rem] border border-white/15 border-dashed p-5 text-ink/65 text-sm leading-6">
          No evidence item cleared the surfacing threshold during this request.
          The score can still be low, sparse, or both without pretending
          otherwise.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              className="grid gap-4 rounded-[1.05rem] border border-white/10 bg-white/[0.04] p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
              key={item.id}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3 text-[0.68rem] text-ink/45 uppercase tracking-[0.24em]">
                  <span className="font-mono text-primary/75">
                    {item.source}
                  </span>
                  <span>
                    {formatDistanceToNow(new Date(item.occurredAt), {
                      addSuffix: true,
                    })}
                  </span>
                  <span>{item.domain.replaceAll("_", " ")}</span>
                  {item.countryCodes.length > 0 ? (
                    <span>{item.countryCodes.join(", ")}</span>
                  ) : (
                    <span>Global</span>
                  )}
                </div>
                <h3 className="clamp-2 mt-3 font-semibold text-[1.18rem] text-ink leading-[1.18] tracking-tight">
                  {item.title}
                </h3>
                <p className="clamp-2 mt-3 text-ink/70 text-sm leading-6">
                  {item.summary}
                </p>
              </div>
              <div className="flex flex-col items-start gap-3 md:items-end">
                <p className="font-mono text-4xl text-ink leading-none">
                  {item.severity.toFixed(1)}
                </p>
                {item.url ? (
                  <a
                    className="text-primary text-sm underline decoration-primary/40 underline-offset-4"
                    href={item.url}
                    rel="noreferrer"
                    target="_blank"
                  >
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
