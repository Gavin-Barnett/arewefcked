import { formatDistanceToNow } from "date-fns";
import { Panel } from "@/components/panel";
import { StatusPill } from "@/components/status-pill";
import type { EvidenceItem, TopDriver } from "@/lib/types/score";

function resolveEvidence(driver: TopDriver, evidence: EvidenceItem[]) {
  return evidence.find((item) => driver.evidenceIds.includes(item.id));
}

export function TopDriverGrid(props: { title: string; subtitle?: string; eyebrow?: string; drivers: TopDriver[]; evidence: EvidenceItem[]; limit?: number }) {
  const cards = props.drivers.slice(0, props.limit ?? 3).map((driver) => ({
    driver,
    evidence: resolveEvidence(driver, props.evidence)
  }));

  if (cards.length === 0) {
    return (
      <Panel eyebrow={props.eyebrow} title={props.title}>
        <p className="text-sm leading-6 text-ink/65">No single evidence item cleared the driver threshold. That usually means the reading is calm, thin, or both.</p>
      </Panel>
    );
  }

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        {props.eyebrow ? <p className="font-mono text-[0.72rem] uppercase tracking-[0.34em] text-primary/75">{props.eyebrow}</p> : null}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-[2.2rem]">{props.title}</h2>
          {props.subtitle ? <p className="max-w-2xl text-sm leading-6 text-ink/65">{props.subtitle}</p> : null}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {cards.map(({ driver, evidence }) => (
          <article key={driver.id} className="relative overflow-hidden rounded-[1.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-panel backdrop-blur-xl">
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-1.5"
              style={{
                background:
                  driver.direction === "up"
                    ? "linear-gradient(90deg, rgba(249,115,22,0.15), rgba(249,115,22,0.98))"
                    : "linear-gradient(90deg, rgba(34,197,94,0.15), rgba(34,197,94,0.98))"
              }}
            />
            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <StatusPill label={driver.domain.replaceAll("_", " ")} tone={driver.direction === "up" ? "warning" : "success"} />
                <p className="font-mono text-2xl text-ink">
                  {driver.effect > 0 ? "+" : ""}
                  {driver.effect.toFixed(1)}
                </p>
              </div>
              <h3 className="clamp-2 mt-4 text-[1.28rem] font-semibold leading-[1.12] tracking-tight text-ink">{driver.title}</h3>
              <p className="clamp-3 mt-3 flex-1 text-sm leading-6 text-ink/70">{driver.summary}</p>
              <div className="mt-5 border-t border-white/10 pt-4 text-sm text-ink/55">
                <p>{evidence ? formatDistanceToNow(new Date(evidence.occurredAt), { addSuffix: true }) : "Current window"}</p>
                <p className="mt-1 font-mono text-[0.72rem] uppercase tracking-[0.24em] text-primary/72">{evidence?.source ?? "Composite driver"}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}