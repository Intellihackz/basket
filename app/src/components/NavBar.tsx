"use client";

import Link from "next/link";
import { useState } from "react";
import { useMockSession } from "@/lib/mock-session";
import SignInModal from "@/components/SignInModal";
import Avatar from "@/components/Avatar";

export default function NavBar() {
  const { signedIn, username, avatarIndex, walletLinked, walletShort, signOut } = useMockSession();
  const [signInOpen, setSignInOpen] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyAddress() {
    if (!walletShort) return;
    navigator.clipboard?.writeText(walletShort);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="sticky top-0 z-40 px-4 pt-3 sm:px-6">
      <header className="elevated mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl border border-border-subtle bg-surface/90 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <Link href="/explore" className="group flex items-baseline gap-2">
            <span className="font-display text-xl font-bold tracking-tight text-foreground group-hover:text-accent transition-colors">
              Basket
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
              on Solana
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Solana network badge with dropdown */}
          <div className="relative">
            <button
              onClick={() => walletLinked && setWalletMenuOpen(!walletMenuOpen)}
              className="flex items-center gap-1.5 rounded-xl border border-border-subtle bg-background/80 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-foreground/20 hover:text-foreground cursor-pointer"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  walletLinked ? "bg-positive animate-pulse" : "bg-muted/50"
                }`}
              />
              <span className="font-mono text-[11px]">
                {walletLinked ? walletShort : "Solana"}
              </span>
              {walletLinked && <span className="text-[10px] opacity-70">▼</span>}
            </button>

            {/* Wallet Dropdown Popover */}
            {walletMenuOpen && walletLinked && (
              <div className="elevated absolute right-0 mt-2 w-64 rounded-2xl border border-border-subtle bg-surface p-4 shadow-xl z-50">
                <div className="flex items-center justify-between border-b border-border-subtle/80 pb-2.5">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                      Connected Wallet
                    </span>
                    <p className="font-mono text-xs font-bold text-foreground mt-0.5">{walletShort}</p>
                  </div>
                  <button
                    onClick={copyAddress}
                    className="rounded-md bg-background px-2 py-1 text-[11px] font-medium text-accent hover:bg-surface-hover"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted">
                    <span>Network</span>
                    <span className="font-medium text-foreground">Solana Mainnet</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>SOL Balance</span>
                    <span className="font-mono font-medium text-foreground">4.82 SOL</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>USDC Balance</span>
                    <span className="font-mono font-medium text-foreground">1,450.00 USDC</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setWalletMenuOpen(false);
                    signOut();
                  }}
                  className="mt-4 w-full rounded-lg border border-border-subtle py-1.5 text-center text-xs font-medium text-muted hover:border-negative/30 hover:text-negative transition-colors"
                >
                  Disconnect Wallet
                </button>
              </div>
            )}
          </div>

          {!signedIn ? (
            <button
              onClick={() => setSignInOpen(true)}
              className="rounded-xl bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground shadow-sm transition-all duration-150 hover:bg-accent-strong active:scale-95 cursor-pointer"
            >
              Sign in
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/create"
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-foreground shadow-sm transition-all duration-150 hover:bg-accent-strong active:scale-95"
              >
                <PlusIcon />
                <span className="hidden sm:inline">Create</span>
              </Link>

              <Link
                href={`/u/${username}`}
                className="flex items-center gap-2 rounded-xl border border-border-subtle bg-background py-1 pl-1.5 pr-3 transition-colors duration-150 hover:bg-surface-hover hover:border-foreground/20"
                title="Portfolio & Profile"
              >
                <Avatar username={username ?? ""} size={24} styleIndex={avatarIndex} />
                <span className="text-xs font-semibold text-foreground">@{username}</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M8 2.5V13.5M2.5 8H13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}


