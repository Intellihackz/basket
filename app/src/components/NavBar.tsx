"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/lib/session";
import Avatar from "@/components/Avatar";

type NavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
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
    { href: "/explore", label: "Explore", icon: CompassIcon, match: (p) => p === "/explore" },
    { href: "/create", label: "Create", icon: PlusIcon, match: (p) => p === "/create" },
    ...(signedIn && username
      ? [
          {
            href: `/u/${username}`,
            label: "Profile",
            icon: PersonIcon,
            match: (p: string) => p.startsWith(`/u/${username}`),
          },
        ]
      : []),
  ];

  return (
    <div className="sticky top-0 z-40 px-4 pt-3 sm:px-6">
      <header className="elevated mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl border border-border-subtle bg-surface/90 px-4 py-4 backdrop-blur-md sm:px-5">
        <Link href="/" className="group flex shrink-0 items-baseline gap-2">
          <span className="font-display text-2xl font-bold tracking-tight text-foreground group-hover:text-accent transition-colors">
            Basket
          </span>
        </Link>

        {/* Segmented pill nav track */}
        <nav className="flex items-center gap-1 rounded-2xl bg-background p-1.5">
          {navItems.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                  active
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          {/* Wallet badge with dropdown */}
          {walletLinked && (
            <div className="relative">
              <button
                onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                className="hidden items-center gap-2 rounded-xl border border-border-subtle bg-background/80 px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-foreground/20 hover:text-foreground cursor-pointer sm:flex"
              >
                <span className="h-2 w-2 rounded-full bg-positive animate-pulse" />
                <span className="font-mono text-xs">{walletShort}</span>
                <span className="text-[10px] opacity-70">▼</span>
              </button>

              {walletMenuOpen && (
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
          )}

          {!signedIn ? (
            <button
              onClick={() => signIn()}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition-all duration-150 hover:bg-accent-strong active:scale-95 cursor-pointer"
            >
              Sign in
            </button>
          ) : (
            <div className="relative">
              <Avatar username={username ?? ""} size={40} styleIndex={avatarIndex} />
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface ${
                  walletLinked ? "bg-positive" : "bg-muted/60"
                }`}
                title={walletLinked ? "Wallet connected" : "Wallet not linked"}
              />
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M8 2.5V13.5M2.5 8H13.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function CompassIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10.2 5.8 8.9 8.9l-3.1 1.3 1.3-3.1 3.1-1.3Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PersonIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5.2" r="2.7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.8 13.2c.9-2.6 2.9-4 5.2-4s4.3 1.4 5.2 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
