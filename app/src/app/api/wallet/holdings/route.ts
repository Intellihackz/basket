import { NextResponse } from "next/server";
import { getWalletHoldings } from "@/lib/solana/wallet-holdings";
import { getLivePrices } from "@/lib/prices/live-price";

export type WalletHoldingWithValue = {
  mint: string;
  symbol: string;
  name: string;
  logo: string | null;
  uiAmount: number;
  priceUsd: number | null;
  valueUsd: number | null;
};

export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  let holdings;
  try {
    holdings = await getWalletHoldings(address);
  } catch {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  const livePrices = await getLivePrices(holdings.map((h) => h.mint));

  const withValue: WalletHoldingWithValue[] = holdings.map((h) => {
    const priceUsd = livePrices[h.mint] ?? null;
    return {
      ...h,
      priceUsd,
      valueUsd: priceUsd !== null ? priceUsd * h.uiAmount : null,
    };
  });

  return NextResponse.json({ holdings: withValue });
}
