import { formatDistanceToNow } from "date-fns";
import { Panel } from "@/components/panel";
import { StatusPill } from "@/components/status-pill";
import type { SourceHealthEntry } from "@/lib/types/score";

function sourceTone(status: SourceHealthEntry["status"]) {
  if (status === "operational") {
    return "success";
  }

  if (status === "degraded") {
    return "warning";
  }

  return "danger";
}

export function SourceHealthGrid(props: { sources: SourceHealthEntry[] }) {
  return (
    <Panel eyebrow="Integrity" title="Source health and freshness">
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {props.sources.map((source) => (
          <article
            className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5"
            key={source.sourceKey}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-ink text-lg">
                  {source.name}
                </h3>
                <p className="mt-1 text-ink/55 text-sm">
                  Freshness: {source.freshness}
                </p>
              </div>
              <StatusPill
                label={source.status}
                tone={sourceTone(source.status)}
              />
            </div>
            <p className="mt-4 text-ink/70 text-sm leading-6">
              {source.outageMessage ??
                source.notes ??
                "Source is responding normally."}
            </p>
            <div className="mt-4 grid gap-2 text-ink/65 text-sm">
              <p>
                Last success:{" "}
                {source.lastSuccessfulSync
                  ? formatDistanceToNow(new Date(source.lastSuccessfulSync), {
                      addSuffix: true,
                    })
                  : "None yet"}
              </p>
              <p>
                Latency: {source.latencyMs ? `${source.latencyMs} ms` : "n/a"}
              </p>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}
