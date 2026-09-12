import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { indexes, purchases, type IndexAsset } from "@/lib/db/schema";
import { getLivePrices } from "@/lib/prices/live-price";

export type PublicPosition = {
  indexId: string;
  indexName: string;
  assets: IndexAsset[];
  investedUsd: number;
  currentValueUsd: number;
  purchasedAt: string;
};

export async function GET(request: Request) {
  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const rows = await db.select().from(purchases).where(eq(purchases.buyerUserId, userId));
  if (rows.length === 0) {
    return NextResponse.json({ positions: [] satisfies PublicPosition[] });
  }

  const indexIds = Array.from(new Set(rows.map((r) => r.indexId)));
  const indexRows = await db.select().from(indexes).where(inArray(indexes.id, indexIds));
  const indexById = new Map(indexRows.map((i) => [i.id, i]));

  const allMints = Array.from(
    new Set(indexRows.flatMap((i) => i.assets.map((a) => a.mint)))
  );
  const livePrices = await getLivePrices(allMints);

  const positions: PublicPosition[] = rows.map((purchase) => {
    const index = indexById.get(purchase.indexId);

    let sumWeightedPct = 0;
    let weightCovered = 0;
    if (index) {
      for (const asset of index.assets) {
        const current = livePrices[asset.mint];
        const atPurchase = purchase.priceSnapshotUsd[asset.symbol];
        if (current === undefined || !atPurchase) continue;
        sumWeightedPct += ((current / atPurchase - 1) * 100) * asset.weightBps;
        weightCovered += asset.weightBps;
      }
    }
    const returnPct = weightCovered > 0 ? sumWeightedPct / weightCovered : 0;

    return {
      indexId: purchase.indexId,
      indexName: index?.name ?? purchase.indexId,
      assets: index?.assets ?? [],
      investedUsd: purchase.amountUsd,
      currentValueUsd: Math.round(purchase.amountUsd * (1 + returnPct / 100)),
      purchasedAt: purchase.createdAt.toISOString(),
    };
  });

  return NextResponse.json({ positions });
}
