"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type MockSessionState = {
  signedIn: boolean;
  username: string | null;
  loginMethod: string | null;
  walletLinked: boolean;
  walletShort: string | null;
  avatarIndex: number | null;
  signIn: (username: string, loginMethod?: string) => void;
  signOut: () => void;
  linkWallet: () => void;
  setAvatar: (index: number) => void;
};

const MockSessionContext = createContext<MockSessionState | null>(null);

/**
 * Stand-in for Privy during the UI-first build phase. Deliberately models
 * auth and wallet-linking as two separate actions (never called together)
 * so the real Privy integration slots in without reshaping the UI.
 */
export function MockSessionProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loginMethod, setLoginMethod] = useState<string | null>(null);
  const [walletLinked, setWalletLinked] = useState(false);
  const [walletShort, setWalletShort] = useState<string | null>(null);
  const [avatarIndex, setAvatarIndex] = useState<number | null>(null);

  return (
    <MockSessionContext.Provider
      value={{
        signedIn,
        username,
        loginMethod,
        walletLinked,
        walletShort,
        avatarIndex,
        signIn: (name: string, method?: string) => {
          setUsername(name);
          setLoginMethod(method ?? null);
          setSignedIn(true);
        },
        signOut: () => {
          setSignedIn(false);
          setUsername(null);
          setLoginMethod(null);
          setWalletLinked(false);
          setWalletShort(null);
          setAvatarIndex(null);
        },
        linkWallet: () => {
          setWalletLinked(true);
          setWalletShort("8fRj...k3Qz");
        },
        setAvatar: (index: number) => setAvatarIndex(index),
      }}
    >
      {children}
    </MockSessionContext.Provider>
  );
}

export function useMockSession(): MockSessionState {
  const ctx = useContext(MockSessionContext);
  if (!ctx) throw new Error("useMockSession must be used within MockSessionProvider");
  return ctx;
}
