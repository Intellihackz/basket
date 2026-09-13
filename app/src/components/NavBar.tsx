"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/lib/session";
import Avatar from "@/components/Avatar";

type NavItem = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
};

export default function NavBar() {
  const { signedIn, username, avatarIndex, walletLinked, walletShort, signIn, signOut } = useSession();
  const pathname = usePathname();
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyAddress() {
    if (!walletShort) return;
    navigator.clipboard?.writeText(walletShort);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const navItems: NavItem[] = [
    { href: "/explore", label: "Explore", match: (p) => p === "/explore" },
    { href: "/create", label: "Create", match: (p) => p === "/create" },
    ...(signedIn && username
      ? [{ href: `/u/${username}`, label: "Profile", match: (p: string) => p.startsWith(`/u/${username}`) }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-5 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-baseline">
          <span className="font-display text-2xl italic text-foreground transition-colors group-hover:text-accent">
            Basket
          </span>
        </Link>

        <nav className="flex items-center gap-8">
          {navItems.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative py-1 text-base font-medium transition-colors ${
                  active ? "text-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                {item.label}
                {active && <span className="absolute -bottom-[19px] left-0 right-0 h-0.5 bg-accent" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-4">
          {walletLinked && (
            <div className="relative">
              <button
                onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                className="hidden items-center gap-2 rounded-xl border border-border-subtle px-4 py-2.5 text-sm text-muted transition-colors hover:border-foreground/20 hover:text-foreground cursor-pointer sm:flex"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-positive" />
                <span className="font-mono text-sm">{walletShort}</span>
                <ChevronDownIcon className="h-3 w-3 opacity-60" />
              </button>

              {walletMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border-subtle bg-surface p-4 shadow-lg z-50">
                  <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                        Connected wallet
                      </span>
                      <p className="font-mono text-xs font-semibold text-foreground mt-0.5">{walletShort}</p>
                    </div>
                    <button
                      onClick={copyAddress}
                      className="rounded-lg px-2 py-1 text-[11px] font-medium text-accent hover:bg-surface-hover"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>

                  <div className="mt-3 flex justify-between text-xs text-muted">
                    <span>Network</span>
                    <span className="font-medium text-foreground">Solana Mainnet</span>
                  </div>

                  <button
                    onClick={() => {
                      setWalletMenuOpen(false);
                      signOut();
                    }}
                    className="mt-4 w-full rounded-xl border border-border-subtle py-1.5 text-center text-xs font-medium text-muted hover:border-negative/30 hover:text-negative transition-colors"
                  >
                    Disconnect wallet
                  </button>
                </div>
              )}
            </div>
          )}

          {!signedIn ? (
            <button
              onClick={() => signIn()}
              className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong active:scale-95 cursor-pointer"
            >
              Sign in
            </button>
          ) : (
            <div className="relative">
              <Avatar username={username ?? ""} size={44} styleIndex={avatarIndex} />
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
                  walletLinked ? "bg-positive" : "bg-muted/60"
                }`}
                title={walletLinked ? "Wallet connected" : "Wallet not linked"}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function ChevronDownIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 10 6" fill="none">
      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
