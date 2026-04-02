import { StatusPill } from "@/components/status-pill";

export function SparseBanner(props: { reason: string }) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-amber/30 bg-[linear-gradient(135deg,rgba(245,158,11,0.16),rgba(245,158,11,0.05))] p-5 shadow-panel backdrop-blur-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <StatusPill label="Sparse data" tone="warning" />
        <p className="text-sm leading-6 text-amber-100">{props.reason}</p>
      </div>
    </div>
  );
}
