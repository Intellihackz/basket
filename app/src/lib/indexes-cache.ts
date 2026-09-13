import type { PublicIndex } from "@/lib/db/index-stats";

// A simple stale-while-revalidate cache for the published-baskets list, scoped to this
// module (survives client-side navigation within the same session, cleared on a full
// reload). Lets the explore page show the last-known list instantly on return visits
// instead of flashing a loading state, while a fresh fetch still updates it quietly.
const TTL_MS = 60_000;

let cache: { data: PublicIndex[]; at: number } | null = null;

export function getCachedIndexes(): PublicIndex[] | null {
  return cache ? cache.data : null;
}

export function isIndexesCacheStale(): boolean {
  return !cache || Date.now() - cache.at > TTL_MS;
}

export function setIndexesCache(data: PublicIndex[]) {
  cache = { data, at: Date.now() };
}
