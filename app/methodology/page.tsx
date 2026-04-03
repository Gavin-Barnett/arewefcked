import Link from "next/link";
import { Panel } from "@/components/panel";
import { bandDefinitions, bandLabelOptions } from "@/lib/scoring/bands";
import { domainLabels, domainWeights } from "@/lib/scoring/weights";
import { methodologyBlurbs } from "@/lib/verdicts/methodology-blurbs";

export default function MethodologyPage() {
  return (
    <div className="space-y-8 py-2">
      <div className="max-w-4xl space-y-4">
        <Link className="text-sky text-xs uppercase tracking-[0.4em]" href="/">
          arewefcked.com
        </Link>
        <h1 className="font-semibold text-3xl text-ink tracking-tight sm:text-4xl">
          Methodology
        </h1>
        <p className="max-w-3xl text-base text-ink/68 leading-7 sm:text-lg">
          The copy can swear. The math has to keep receipts.
        </p>
      </div>

      <Panel eyebrow="Methodology" title="How the score works">
        <div className="max-w-4xl space-y-5 text-base text-ink/72 leading-8">
          <p>
            The score is a weighted composite risk index from 0 to 100. In this
            build it blends structured disaster and climate signals with
            lower-confidence current-news signals for conflict, unrest,
            governance, macro stress, public health, and cyber disruption.
          </p>
          <p>
            Structured providers remain the gold standard. Headline-derived
            domains stay visibly sparse in the UI so the site does not pretend a
            story-cluster heuristic is equal to a clean event dataset.
          </p>
          <p>
            Verdict copy comes from a fixed reviewed library rather than being
            improvised at runtime, so the editorial layer rotates without
            drifting into nonsense.
          </p>
        </div>
      </Panel>

      <Panel eyebrow="Weights" title="Domain weights">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(domainWeights).map(([domain, weight]) => (
            <article
              className="rounded-3xl border border-line/80 bg-haze p-4"
              key={domain}
            >
              <h2 className="font-semibold text-ink text-lg">
                {domainLabels[domain as keyof typeof domainLabels]}
              </h2>
              <p className="mt-3 font-mono text-3xl text-ink">
                {Math.round(weight * 100)}%
              </p>
            </article>
          ))}
        </div>
      </Panel>

      <Panel eyebrow="Bands" title="Band map">
        <div className="grid gap-4 lg:grid-cols-2">
          {bandDefinitions.map((band) => (
            <article
              className="rounded-3xl border border-line/80 bg-haze p-4"
              key={band.band}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sky text-xs uppercase tracking-[0.2em]">
                    Band {band.band}
                  </p>
                  <h2 className="mt-2 font-semibold text-ink text-lg">
                    {band.defaultLabel}
                  </h2>
                </div>
                <p className="font-mono text-ink text-xl">
                  {band.min}-{band.max}
                </p>
              </div>
              <p className="mt-4 text-ink/68 text-sm leading-6">
                Alt labels: {bandLabelOptions[band.band].slice(0, 5).join(", ")}
              </p>
            </article>
          ))}
        </div>
      </Panel>

      <Panel eyebrow="Editorial" title="Methodology blurbs and verdicts">
        <p className="max-w-3xl text-ink/68 text-sm leading-6">
          The build includes 300 stored verdict messages and 20 methodology
          blurbs. Messages are selected by band, scope, confidence, and a
          deterministic salt so the site rotates copy without inventing new text
          at runtime.
        </p>
        <ul className="mt-6 grid gap-3 lg:grid-cols-2">
          {methodologyBlurbs.map((blurb) => (
            <li
              className="rounded-2xl border border-line/80 bg-haze px-4 py-3 text-ink/70 text-sm leading-6"
              key={blurb}
            >
              {blurb}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
