/**
 * Jupiter Swap API v1 client — the free `lite-api.jup.ag` tier, no API key.
 * https://developers.jup.ag/docs/swap-api/get-quote
 */

const JUPITER_BASE = "https://lite-api.jup.ag/swap/v1";

export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const WSOL_MINT = "So11111111111111111111111111111111111111112";

export type JupiterQuote = {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  priceImpactPct: string;
  slippageBps: number;
  routePlan: unknown[];
};

export type JupiterInstruction = {
  programId: string;
  accounts: { pubkey: string; isSigner: boolean; isWritable: boolean }[];
  data: string; // base64
};

export type SwapInstructionsResponse = {
  computeBudgetInstructions: JupiterInstruction[];
  setupInstructions: JupiterInstruction[];
  swapInstruction: JupiterInstruction;
  cleanupInstruction: JupiterInstruction | null;
  otherInstructions?: JupiterInstruction[];
  addressLookupTableAddresses: string[];
};

export async function getQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: number; // base units (e.g. lamports, or 10^6 for USDC)
  slippageBps?: number;
}): Promise<JupiterQuote> {
  const search = new URLSearchParams({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: String(Math.max(1, Math.floor(params.amount))),
    slippageBps: String(params.slippageBps ?? 100),
  });

  const res = await fetch(`${JUPITER_BASE}/quote?${search.toString()}`);
  if (!res.ok) {
    throw new Error(`Jupiter quote failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

export async function getSwapInstructions(params: {
  quoteResponse: JupiterQuote;
  userPublicKey: string;
}): Promise<SwapInstructionsResponse> {
  const res = await fetch(`${JUPITER_BASE}/swap-instructions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: params.quoteResponse,
      userPublicKey: params.userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
    }),
  });
  if (!res.ok) {
    throw new Error(`Jupiter swap-instructions failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}
