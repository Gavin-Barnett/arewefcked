import type {
  CountrySummary,
  NormalizedEvent,
  SourceHealthEntry,
} from "@/lib/types/score";

export type SourceFetchScope =
  | { mode: "global" }
  | { mode: "country"; country: CountrySummary };

export interface SourceFetchResult {
  events: NormalizedEvent[];
  health: SourceHealthEntry;
  notes: string[];
  sourceKey: string;
  sourceName: string;
  sourceUrl: string;
}

export interface SourceAdapter {
  fetch(scope: SourceFetchScope): Promise<SourceFetchResult>;
  key: string;
  name: string;
}
