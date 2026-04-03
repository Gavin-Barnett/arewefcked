import { bandDefinitions, bandLabelOptions } from "@/lib/scoring/bands";
import { domainWeights } from "@/lib/scoring/weights";
import { methodologyBlurbs } from "@/lib/verdicts/methodology-blurbs";

export function GET() {
  return Response.json({
    bands: bandDefinitions,
    shortLabels: bandLabelOptions,
    weights: domainWeights,
    methodologyBlurbs,
    activeSources: [
      "usgs",
      "openmeteo",
      "gdelt",
      "who_don",
      "world_bank",
      "current_news",
    ],
    note: "All live score inputs come from real sources, with confidence reduced when coverage is thin or delayed.",
  });
}
