import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { getQuote, getSwapInstructions, type JupiterInstruction, type JupiterQuote } from "./client";

// Solana's hard cap on a serialized transaction (legacy and v0 alike).
const MAX_TX_BYTES = 1232;

function toInstruction(ix: JupiterInstruction): TransactionInstruction {
  return new TransactionInstruction({
    programId: new PublicKey(ix.programId),
    keys: ix.accounts.map((a) => ({
      pubkey: new PublicKey(a.pubkey),
      isSigner: a.isSigner,
      isWritable: a.isWritable,
    })),
    data: Buffer.from(ix.data, "base64"),
  });
}

async function resolveLookupTables(
  connection: Connection,
  addresses: string[]
): Promise<AddressLookupTableAccount[]> {
  if (addresses.length === 0) return [];
  const infos = await connection.getMultipleAccountsInfo(addresses.map((a) => new PublicKey(a)));
  const tables: AddressLookupTableAccount[] = [];
  infos.forEach((info, i) => {
    if (!info) return;
    tables.push(
      new AddressLookupTableAccount({
        key: new PublicKey(addresses[i]),
        state: AddressLookupTableAccount.deserialize(info.data),
      })
    );
  });
  return tables;
}

export type BasketLeg = {
  symbol: string;
  mint: string;
  quote: JupiterQuote;
};

export type BasketBuyPlan = {
  legs: BasketLeg[];
  /** One transaction per batch — usually 1, more only when a large basket can't fit in a single tx. */
  transactions: Uint8Array[];
  legsPerTransaction: number[][]; // indices into `legs`, grouped by which tx they landed in
};

/**
 * Quotes every asset in the basket, then packs as many of the resulting swaps as will
 * fit into a single versioned transaction (using Jupiter's address lookup tables to stay
 * under Solana's 1232-byte limit). Baskets too large for one transaction spill into
 * additional transactions — each is still one wallet approval, just not a single atomic tx.
 */
export async function planBasketBuy(params: {
  connection: Connection;
  userPublicKey: string;
  inputMint: string;
  totalAmountBaseUnits: number;
  assets: { symbol: string; mint: string; weightBps: number }[];
  slippageBps?: number;
}): Promise<BasketBuyPlan> {
  const { connection, userPublicKey, inputMint, totalAmountBaseUnits, assets, slippageBps } = params;

  // 1. Quote every leg (skip the leg entirely if the asset *is* the input currency).
  const legs: BasketLeg[] = [];
  for (const asset of assets) {
    if (asset.mint === inputMint) continue;
    const legAmount = Math.floor((totalAmountBaseUnits * asset.weightBps) / 10_000);
    if (legAmount <= 0) continue;
    const quote = await getQuote({
      inputMint,
      outputMint: asset.mint,
      amount: legAmount,
      slippageBps,
    });
    legs.push({ symbol: asset.symbol, mint: asset.mint, quote });
  }

  if (legs.length === 0) {
    throw new Error("No swappable legs in this basket for the given input currency.");
  }

  // 2. Fetch swap instructions for every leg up front.
  const swapIx = await Promise.all(
    legs.map((leg) => getSwapInstructions({ quoteResponse: leg.quote, userPublicKey }))
  );

  const { blockhash } = await connection.getLatestBlockhash();

  // 3. Greedily pack legs into transactions, largest-fit-first is unnecessary here —
  // basket order is stable, so we just fill in order and start a new tx when one overflows.
  const transactions: Uint8Array[] = [];
  const legsPerTransaction: number[][] = [];

  let cursor = 0;
  while (cursor < legs.length) {
    let end = legs.length;
    let built: VersionedTransaction | null = null;
    let usedIndices: number[] = [];

    // Try packing as many remaining legs as possible, shrinking the batch until it fits.
    for (; end > cursor; end--) {
      const batchIndices = Array.from({ length: end - cursor }, (_, i) => cursor + i);
      const batch = batchIndices.map((i) => swapIx[i]);

      const setupIxs = batch.flatMap((b) => b.setupInstructions.map(toInstruction));
      const swapIxs = batch.map((b) => toInstruction(b.swapInstruction));
      const cleanupIxs = batch.flatMap((b) => (b.cleanupInstruction ? [toInstruction(b.cleanupInstruction)] : []));

      // One shared compute-budget instruction, not one per leg (duplicates are invalid).
      const computeIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: Math.min(1_400_000, 200_000 * batch.length + 100_000),
      });

      const lookupAddresses = Array.from(
        new Set(batch.flatMap((b) => b.addressLookupTableAddresses))
      );
      const lookupTables = await resolveLookupTables(connection, lookupAddresses);

      const message = new TransactionMessage({
        payerKey: new PublicKey(userPublicKey),
        recentBlockhash: blockhash,
        instructions: [computeIx, ...setupIxs, ...swapIxs, ...cleanupIxs],
      }).compileToV0Message(lookupTables);

      const tx = new VersionedTransaction(message);
      const size = tx.serialize().length;

      if (size <= MAX_TX_BYTES) {
        built = tx;
        usedIndices = batchIndices;
        break;
      }
    }

    if (!built) {
      // Even a single leg didn't fit — nothing more we can do for that leg.
      throw new Error(
        `The swap for ${legs[cursor].symbol} alone doesn't fit in one transaction. Try a smaller basket.`
      );
    }

    transactions.push(built.serialize());
    legsPerTransaction.push(usedIndices);
    cursor = usedIndices[usedIndices.length - 1] + 1;
  }

  return { legs, transactions, legsPerTransaction };
}
