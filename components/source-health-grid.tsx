import { formatDistanceToNow } from "date-fns";
import { Panel } from "@/components/panel";
import { StatusPill } from "@/components/status-pill";
import type { SourceHealthEntry } from "@/lib/types/score";

export function SourceHealthGrid(props: { sources: SourceHealthEntry[] }) {
  return (
    <Panel eyebrow="Integrity" title="Source health and freshness">
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {props.sources.map((source) => (
          <article key={source.sourceKey} className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-ink">{source.name}</h3>
                <p className="mt-1 text-sm text-ink/55">Freshness: {source.freshness}</p>
              </div>
              <StatusPill label={source.status} tone={source.status === "operational" ? "success" : source.status === "degraded" ? "warning" : "danger"} />
            </div>
            <p className="mt-4 text-sm leading-6 text-ink/70">{source.outageMessage ?? source.notes ?? "Source is responding normally."}</p>
            <div className="mt-4 grid gap-2 text-sm text-ink/65">
              <p>
                Last success:{" "}
                {source.lastSuccessfulSync ? formatDistanceToNow(new Date(source.lastSuccessfulSync), { addSuffix: true }) : "None yet"}
              </p>
              <p>Latency: {source.latencyMs ? `${source.latencyMs} ms` : "n/a"}</p>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}
