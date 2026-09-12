import { NextResponse } from "next/server";
import { getLivePrices } from "@/lib/prices/live-price";
import { findXStock } from "@/lib/xstocks/registry";

/** GET /api/prices?symbols=NVDA,AAPL,... -> { prices: { NVDA: 128.4, AAPL: 224.1 } } */
export async function GET(request: Request) {
  const symbolsParam = new URL(request.url).searchParams.get("symbols");
  if (!symbolsParam) {
    return NextResponse.json({ error: "symbols query param is required" }, { status: 400 });
  }

  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const mintBySymbol = new Map<string, string>();
  for (const symbol of symbols) {
    const xstock = findXStock(symbol);
    if (xstock) mintBySymbol.set(symbol, xstock.mint);
  }

  const livePricesByMint = await getLivePrices(Array.from(mintBySymbol.values()));

  const prices: Record<string, number> = {};
  for (const [symbol, mint] of mintBySymbol) {
    const price = livePricesByMint[mint];
    if (price !== undefined) prices[symbol] = price;
  }

  return NextResponse.json({ prices });
}
