import type { PublicIndex } from "@/lib/db/index-stats";

// Holds the last-fetched published-baskets list, scoped to this module (survives
// client-side navigation within the same session, cleared on a full reload). Lets the
// explore page paint instantly on return visits instead of flashing a loading state,
// while a fresh fetch always runs in the background to keep live-price-derived fields
// (like returnSincePublishPct) from drifting out of sync with other pages.
let cache: { data: PublicIndex[]; at: number } | null = null;

export function getCachedIndexes(): PublicIndex[] | null {
  return cache ? cache.data : null;
}

export function setIndexesCache(data: PublicIndex[]) {
  cache = { data, at: Date.now() };
}
