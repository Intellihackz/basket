import { Connection } from "@solana/web3.js";

/** Falls back to Solana's shared public RPC, which rate-limits and intermittently 403s real
 * traffic (getLatestBlockhash especially). Set NEXT_PUBLIC_SOLANA_RPC_URL to a real provider
 * (e.g. Helius) for reliable buy-flow and live-price behavior. */
export const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

export function getConnection(): Connection {
  return new Connection(RPC_URL, "confirmed");
}

/**
 * Polls until a signature is actually confirmed onchain, or throws.
 *
 * `signAndSendTransaction` resolving with a signature is NOT proof of success: a signature is
 * a deterministic artifact of signing, produced before the transaction is ever broadcast. A
 * wallet's own preflight check (insufficient balance, a stale blockhash, a failed simulation)
 * can silently stop the send while still handing back a signature that never lands onchain.
 * Never treat that signature as confirmation — always wait for the network to say so.
 */
export async function confirmSignature(
  connection: Connection,
  signature: string,
  timeoutMs = 45_000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { value } = await connection.getSignatureStatus(signature, { searchTransactionHistory: true });
    if (value?.err) {
      throw new Error(`Transaction failed onchain: ${JSON.stringify(value.err)}`);
    }
    if (value?.confirmationStatus === "confirmed" || value?.confirmationStatus === "finalized") {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error("Transaction was not confirmed onchain in time. It may not have gone through.");
}
