"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import type { ReactNode } from "react";

export default function AppPrivyProvider({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ["google", "email"],
        appearance: {
          walletChainType: "solana-only",
        },
        // We never auto-create a Privy wallet on login — wallet linking is a
        // separate, explicit action from identity (see product plan). Users
        // connect an *external* Solana wallet (Phantom/Solflare/etc.) only
        // when they're ready to actually invest.
        embeddedWallets: {
          solana: { createOnLogin: "off" },
        },
        externalWallets: {
          solana: { connectors: toSolanaWalletConnectors() },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
