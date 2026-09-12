import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { indexes, purchases } from "@/lib/db/schema";
import { getLivePrices } from "@/lib/prices/live-price";
import { WSOL_MINT } from "@/lib/jupiter/client";

/**
 * Records a completed real buy — called by BuyPanel only after Jupiter transactions
 * are actually signed and sent. Never speculative; `signatures` are real tx signatures.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const indexId: string | undefined = body?.indexId;
  const buyerUserId: string | undefined = body?.buyerUserId;
  const walletAddress: string | undefined = body?.walletAddress;
  const currency: "USDC" | "SOL" | undefined = body?.currency;
  const amountBaseUnits: number | undefined = body?.amountBaseUnits;
  const signatures: string[] | undefined = body?.signatures;

  if (!indexId || !buyerUserId || !walletAddress || !currency || !amountBaseUnits || !signatures?.length) {
    return NextResponse.json({ error: "Missing required purchase fields" }, { status: 400 });
  }

  const [index] = await db.select().from(indexes).where(eq(indexes.id, indexId));
  if (!index) {
    return NextResponse.json({ error: "Index not found" }, { status: 404 });
  }

  const priceSnapshotUsd = await getLivePrices(index.assets.map((a) => a.mint));
  const priceSnapshotBySymbol: Record<string, number> = {};
  for (const asset of index.assets) {
    const price = priceSnapshotUsd[asset.mint];
    if (price !== undefined) priceSnapshotBySymbol[asset.symbol] = price;
  }

  let amountUsd: number;
  if (currency === "USDC") {
    amountUsd = amountBaseUnits / 1_000_000;
  } else {
    const solPriceMap = await getLivePrices([WSOL_MINT]);
    const solPrice = solPriceMap[WSOL_MINT] ?? 0;
    amountUsd = (amountBaseUnits / 1_000_000_000) * solPrice;
  }

  const [created] = await db
    .insert(purchases)
    .values({
      id: crypto.randomUUID(),
      indexId,
      buyerUserId,
      walletAddress,
      currency,
      amountBaseUnits,
      amountUsd: Math.round(amountUsd),
      priceSnapshotUsd: priceSnapshotBySymbol,
      signatures,
    })
    .returning();

  return NextResponse.json({ purchase: created }, { status: 201 });
}
