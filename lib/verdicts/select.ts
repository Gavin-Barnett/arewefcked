import { getBand, pickShortLabel } from "@/lib/scoring/bands";
import type { VerdictMessage, VerdictScope } from "@/lib/types/score";
import { hashString } from "@/lib/utils";
import {
  methodologyBlurbCatalog,
  verdictMessages,
} from "@/lib/verdicts/catalog";

export function selectVerdictMessage(options: {
  score: number;
  scope: VerdictScope;
  scopeKey: string;
  confidence: number;
  salt?: string;
}) {
  const band = getBand(options.score);
  const pool = verdictMessages.filter((message) => {
    return (
      message.band === band &&
      message.allowedScopes.includes(options.scope) &&
      (message.minConfidence === undefined ||
        options.confidence >= message.minConfidence)
    );
  });

  const fallbackPool =
    pool.length > 0
      ? pool
      : verdictMessages.filter((message) => message.band === band);
  const seed = `${options.scope}:${options.scopeKey}:${options.salt ?? Math.round(options.score)}`;

  return fallbackPool[hashString(seed) % fallbackPool.length] as VerdictMessage;
}

export function selectShortLabel(score: number, seed: string) {
  return pickShortLabel(getBand(score), seed);
}

export function selectMethodologyBlurb(seed: string) {
  return methodologyBlurbCatalog[
    hashString(seed) % methodologyBlurbCatalog.length
  ];
}
