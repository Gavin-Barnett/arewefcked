import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel(props: { title?: string; eyebrow?: string; className?: string; children: ReactNode }) {
  return (
    <section className={cn("relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 shadow-panel backdrop-blur-xl", props.className)}>
      <div aria-hidden className="absolute inset-y-0 left-0 w-px bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.24),transparent)]" />
      <div className="relative">
        {(props.eyebrow || props.title) && (
          <div className="mb-4 space-y-1.5">
            {props.eyebrow ? <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-primary/76">{props.eyebrow}</p> : null}
            {props.title ? <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{props.title}</h2> : null}
          </div>
        )}
        {props.children}
      </div>
    </section>
  );
}
