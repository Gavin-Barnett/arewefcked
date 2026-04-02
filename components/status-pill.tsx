import { cn } from "@/lib/utils";

const toneClasses = {
  accent: "border-primary/35 bg-primary/12 text-primary",
  danger: "border-danger/35 bg-danger/12 text-red-100",
  warning: "border-amber/35 bg-amber/12 text-amber-100",
  neutral: "border-white/10 bg-white/[0.04] text-ink/75",
  success: "border-moss/35 bg-moss/12 text-emerald-100"
} as const;

export function StatusPill(props: { label: string; tone?: keyof typeof toneClasses }) {
  return (
    <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] backdrop-blur-md", toneClasses[props.tone ?? "neutral"])}>
      {props.label}
    </span>
  );
}
