"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePrivy, useLogin, useLogout } from "@privy-io/react-auth";

type DbUser = {
  username: string;
  avatarIndex: number | null;
};

type SessionState = {
  ready: boolean;
  signedIn: boolean;
  userId: string | null;
  username: string | null;
  loginMethod: string | null;
  walletLinked: boolean;
  walletAddress: string | null;
  walletShort: string | null;
  avatarIndex: number | null;
  signIn: () => void;
  signOut: () => void;
  linkWallet: () => void;
  setAvatar: (index: number) => void;
  setUsername: (username: string) => Promise<{ ok: boolean; error?: string }>;
};

const SessionContext = createContext<SessionState | null>(null);

function shortenAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, user, logout, linkWallet } = usePrivy();
  const { login } = useLogin();
  useLogout(); // registers the logout listener; we call logout() from usePrivy directly

  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [syncedForId, setSyncedForId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !authenticated || !user) return;
    if (syncedForId === user.id) return;

    const email = user.email?.address ?? user.google?.email;
    const loginMethod = user.google ? "Google account" : (email ?? "Email");

    fetch("/api/users/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ privyUserId: user.id, email, loginMethod }),
    })
      .then((res) => res.json())
      .then((data) => {
        setDbUser({ username: data.user.username, avatarIndex: data.user.avatarIndex });
        setSyncedForId(user.id);
      })
      .catch((err) => console.error("Failed to sync user:", err));
  }, [ready, authenticated, user, syncedForId]);

  const wallet = user?.wallet?.chainType === "solana" ? user.wallet : undefined;

  async function setAvatar(index: number) {
    if (!user) return;
    setDbUser((prev) => (prev ? { ...prev, avatarIndex: index } : prev));
    await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ privyUserId: user.id, avatarIndex: index }),
    }).catch((err) => console.error("Failed to save avatar:", err));
  }

  async function setUsername(username: string): Promise<{ ok: boolean; error?: string }> {
    if (!user) return { ok: false, error: "Not signed in" };
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privyUserId: user.id, username }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error ?? "Failed to update username" };
      setDbUser((prev) => (prev ? { ...prev, username: data.user.username } : prev));
      return { ok: true };
    } catch {
      return { ok: false, error: "Failed to update username" };
    }
  }

  return (
    <SessionContext.Provider
      value={{
        ready,
        signedIn: ready && authenticated,
        userId: ready && authenticated ? (user?.id ?? null) : null,
        username: ready && authenticated ? (dbUser?.username ?? null) : null,
        loginMethod: user?.google ? "Google account" : (user?.email?.address ?? null),
        walletLinked: Boolean(wallet),
        walletAddress: wallet?.address ?? null,
        walletShort: wallet ? shortenAddress(wallet.address) : null,
        avatarIndex: ready && authenticated ? (dbUser?.avatarIndex ?? null) : null,
        signIn: () => login(),
        signOut: async () => {
          setDbUser(null);
          setSyncedForId(null);
          await logout();
        },
        linkWallet: () => linkWallet({ walletChainType: "solana-only" }),
        setAvatar,
        setUsername,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
