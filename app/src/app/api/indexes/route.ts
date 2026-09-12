import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { indexes, type IndexAsset } from "@/lib/db/schema";
import { generateUniqueIndexSlug } from "@/lib/db/slug";
import { hydrateIndexes } from "@/lib/db/index-stats";
import { getLivePrices } from "@/lib/prices/live-price";
import { findXStock } from "@/lib/xstocks/registry";

export async function GET() {
  const rows = await db.select().from(indexes);
  const hydrated = await hydrateIndexes(rows);
  return NextResponse.json({ indexes: hydrated });
}

/**
 * Publishes a real index. Trusts the client-supplied `creatorUserId` for the
 * same reason /api/users/sync does — no Privy app secret available yet to
 * verify server-side. Fine for a hackathon demo, not for production.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const creatorUserId: string | undefined = body?.creatorUserId;
  const name: string | undefined = body?.name;
  const description: string = body?.description ?? "";
  const draftAssets: { symbol: string; weightBps: number }[] | undefined = body?.assets;

  if (!creatorUserId || !name || !draftAssets || draftAssets.length === 0) {
    return NextResponse.json(
      { error: "creatorUserId, name, and at least one asset are required" },
      { status: 400 }
    );
  }

  const totalWeight = draftAssets.reduce((sum, a) => sum + a.weightBps, 0);
  if (totalWeight !== 10_000) {
    return NextResponse.json({ error: "Asset weights must sum to 100%" }, { status: 400 });
  }

  const assets: IndexAsset[] = [];
  for (const draft of draftAssets) {
    const xstock = findXStock(draft.symbol);
    if (!xstock) {
      return NextResponse.json({ error: `Unknown asset: ${draft.symbol}` }, { status: 400 });
    }
    assets.push({ symbol: xstock.underlyingSymbol, mint: xstock.mint, weightBps: draft.weightBps });
  }

  const priceSnapshotUsd = await getLivePrices(assets.map((a) => a.mint));
  // Re-key by symbol (what the rest of the app reads) instead of mint.
  const priceSnapshotBySymbol: Record<string, number> = {};
  for (const asset of assets) {
    const price = priceSnapshotUsd[asset.mint];
    if (price !== undefined) priceSnapshotBySymbol[asset.symbol] = price;
  }

  const id = await generateUniqueIndexSlug(name);

  const [created] = await db
    .insert(indexes)
    .values({
      id,
      name,
      description,
      creatorUserId,
      assets,
      priceSnapshotUsd: priceSnapshotBySymbol,
    })
    .returning();

  const [hydrated] = await hydrateIndexes([created]);
  return NextResponse.json({ index: hydrated }, { status: 201 });
}
