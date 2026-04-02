import type { CSSProperties, ReactNode } from "react";
import { CountryAutocomplete } from "@/components/country-autocomplete";
import { RiskDial } from "@/components/dial/risk-dial";
import { getSeverityTheme } from "@/lib/scoring/severity-theme";

export function VerdictHero(props: {
  heading: ReactNode;
  description: string;
  updatedLabel: string;
  score: number;
  shortLabel: string;
  confidence: number;
  freshness: string;
  scopeLabel: string;
  currentCountryCode?: string;
}) {
  const theme = getSeverityTheme(props.score);
  const heroVars = {
    "--primary": theme.primary,
    "--ring": theme.primary
  } as CSSProperties;

  return (
    <section className="full-bleed relative py-3 sm:py-5" style={heroVars}>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 18% 18%, ${theme.glowSoft}, transparent 24%), radial-gradient(circle at 72% 12%, ${theme.glow}, transparent 18%), linear-gradient(180deg, ${theme.topWash}, rgba(9,9,11,0.88) 44%, rgba(7,7,8,1) 100%)`
        }}
      />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[#070708]" />

      <div className="relative mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <div className="hidden justify-end pt-4 sm:flex">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-ink/45">{props.updatedLabel}</p>
        </div>

        <div className="grid gap-8 pb-8 pt-3 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] xl:items-center">
          <div className="relative z-30 order-1 space-y-6 xl:pr-4">
            <div>
              <h1 className="hero-title-shadow text-[clamp(3.5rem,8.5vw,6.3rem)] font-semibold leading-[0.9] tracking-[-0.065em] text-ink">{props.heading}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/78 sm:text-xl">{props.description}</p>
            </div>
            <CountryAutocomplete currentCountryCode={props.currentCountryCode} className="max-w-2xl" />
          </div>

          <div className="order-2 xl:pl-4">
            <RiskDial
              score={props.score}
              shortLabel={props.shortLabel}
              confidence={props.confidence}
              freshness={props.freshness}
              scopeLabel={props.scopeLabel}
            />
          </div>
        </div>
      </div>
    </section>
  );
}