import type { CountrySummary, NormalizedEvent, SourceHealthEntry } from "@/lib/types/score";

export type SourceFetchScope =
  | { mode: "global" }
  | { mode: "country"; country: CountrySummary };

export interface SourceFetchResult {
  sourceKey: string;
  sourceName: string;
  sourceUrl: string;
  events: NormalizedEvent[];
  health: SourceHealthEntry;
  notes: string[];
}

export interface SourceAdapter {
  key: string;
  name: string;
  fetch(scope: SourceFetchScope): Promise<SourceFetchResult>;
}
