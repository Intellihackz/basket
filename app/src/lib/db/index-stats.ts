import { db } from "./client";
import { purchases, users, type IndexRow } from "./schema";
import { inArray, sql } from "drizzle-orm";
import { getLivePrices } from "@/lib/prices/live-price";

export type PublicIndex = {
  id: string;
  name: string;
  description: string;
  creatorUsername: string;
  assets: IndexRow["assets"];
  createdAt: string;
  livePricesUsd: Record<string, number>; // symbol -> current live price
  /** Weighted return since publish, computed live from real prices vs. the real snapshot taken at
   * publish time. `null` when none of the constituents currently have a live price available. */
  returnSincePublishPct: number | null;
  holders: number;
  totalInvestedUsd: number;
};

/** Attaches real, live-computed stats to raw DB rows — no fabricated history or benchmarks. */
export async function hydrateIndexes(rows: IndexRow[]): Promise<PublicIndex[]> {
  if (rows.length === 0) return [];

  const creatorIds = Array.from(new Set(rows.map((r) => r.creatorUserId)));
  const allMints = Array.from(new Set(rows.flatMap((r) => r.assets.map((a) => a.mint))));
  const indexIds = rows.map((r) => r.id);

  const [creators, livePrices, purchaseStats] = await Promise.all([
    db.select({ id: users.id, username: users.username }).from(users).where(inArray(users.id, creatorIds)),
    getLivePrices(allMints),
    db
      .select({
        indexId: purchases.indexId,
        holders: sql<number>`count(distinct ${purchases.buyerUserId})::int`,
        totalInvestedUsd: sql<number>`coalesce(sum(${purchases.amountUsd}), 0)::int`,
      })
      .from(purchases)
      .where(inArray(purchases.indexId, indexIds))
      .groupBy(purchases.indexId),
  ]);

  const creatorMap = new Map(creators.map((c) => [c.id, c.username]));
  const statsMap = new Map(purchaseStats.map((s) => [s.indexId, s]));

  return rows.map((row) => {
    const stats = statsMap.get(row.id);

    let sumWeightedPct = 0;
    let weightCovered = 0;
    const livePricesUsd: Record<string, number> = {};

    for (const asset of row.assets) {
      const current = livePrices[asset.mint];
      if (current === undefined) continue;
      livePricesUsd[asset.symbol] = current;

      const published = row.priceSnapshotUsd[asset.symbol];
      if (!published) continue;
      sumWeightedPct += ((current / published - 1) * 100) * asset.weightBps;
      weightCovered += asset.weightBps;
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      creatorUsername: creatorMap.get(row.creatorUserId) ?? "unknown",
      assets: row.assets,
      createdAt: row.createdAt.toISOString(),
      livePricesUsd,
      returnSincePublishPct: weightCovered > 0 ? sumWeightedPct / weightCovered : null,
      holders: stats?.holders ?? 0,
      totalInvestedUsd: stats?.totalInvestedUsd ?? 0,
    };
  });
}
