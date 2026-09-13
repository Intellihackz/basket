import { PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { getConnection } from "@/lib/solana/connection";
import { findXStockByMint, type XStock } from "@/lib/xstocks/registry";

export type WalletHolding = {
  mint: string;
  symbol: string;
  name: string;
  logo: string | null;
  uiAmount: number;
};

/** Reads real xStock token balances directly from the wallet on Solana — no purchase history involved. */
export async function getWalletHoldings(walletAddress: string): Promise<WalletHolding[]> {
  const connection = getConnection();
  const owner = new PublicKey(walletAddress);

  const { value } = await connection.getParsedTokenAccountsByOwner(owner, {
    programId: TOKEN_2022_PROGRAM_ID,
  });

  const holdings: WalletHolding[] = [];
  for (const { account } of value) {
    const info = account.data.parsed?.info;
    const mint: string | undefined = info?.mint;
    const uiAmount: number | null = info?.tokenAmount?.uiAmount;
    if (!mint || !uiAmount || uiAmount <= 0) continue;

    const stock: XStock | undefined = findXStockByMint(mint);
    if (!stock) continue; // ignore non-xStock Token-2022 balances

    holdings.push({
      mint,
      symbol: stock.underlyingSymbol || stock.symbol,
      name: stock.name,
      logo: stock.logo,
      uiAmount,
    });
  }

  return holdings.sort((a, b) => a.symbol.localeCompare(b.symbol));
}
