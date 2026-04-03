import { bandLabelOptions } from "@/lib/scoring/bands";
import { type VerdictMessage, verdictMessageSchema } from "@/lib/types/score";
import messages from "@/lib/verdicts/messages.json";
import { methodologyBlurbs } from "@/lib/verdicts/methodology-blurbs";

export const verdictMessages = messages.map((message) =>
  verdictMessageSchema.parse(message)
) satisfies VerdictMessage[];
export const verdictCountByBand = verdictMessages.reduce<
  Record<number, number>
>((counts, message) => {
  counts[message.band] = (counts[message.band] ?? 0) + 1;
  return counts;
}, {});

export const verdictLabelOptions = bandLabelOptions;
export const methodologyBlurbCatalog = [...methodologyBlurbs];
