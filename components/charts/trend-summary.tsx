import { Panel } from "@/components/panel";
import { StatusPill } from "@/components/status-pill";
import type { TrendDelta } from "@/lib/types/score";

function directionTone(direction: TrendDelta["direction"], available: boolean) {
  if (!available) {
    return "neutral" as const;
  }
  if (direction === "up") {
    return "danger" as const;
  }
  if (direction === "down") {
    return "success" as const;
  }
  return "neutral" as const;
}

function unavailableLabel(note?: string) {
  if (!note) {
    return "needs history";
  }

  return note.toLowerCase().includes("offline") ? "offline" : "needs history";
}

export function TrendSummary(props: { trend: TrendDelta[] }) {
  return (
    <Panel className="h-full" eyebrow="Trend" title="Score drift">
      <div className="grid auto-rows-fr gap-4 md:grid-cols-3">
        {props.trend.map((item) => (
          <article
            className="flex h-full flex-col rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5"
            key={item.window}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.7rem] text-ink/45 uppercase tracking-[0.3em]">
                  {item.window}
                </p>
                <p className="mt-3 font-semibold text-4xl text-ink tracking-tight">
                  {item.available && item.delta !== null
                    ? `${item.delta > 0 ? "+" : ""}${item.delta.toFixed(1)}`
                    : "--"}
                </p>
              </div>
              <StatusPill
                label={
                  item.available ? item.direction : unavailableLabel(item.note)
                }
                tone={directionTone(item.direction, item.available)}
              />
            </div>
            {item.available ? (
              <p className="mt-4 flex-1 text-ink/68 text-sm leading-6">
                {item.note ?? "Historical comparisons are available."}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </Panel>
  );
}
