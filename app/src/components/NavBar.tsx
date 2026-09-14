"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session";
import Avatar from "@/components/Avatar";

type NavItem = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
};

function MenuIcon({ open, className = "" }: { open: boolean; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 16" fill="none">
      {open ? (
        <path d="M2 2L18 14M18 2L2 14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      ) : (
        <path d="M2 2H18M2 8H18M2 14H18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      )}
    </svg>
  );
}

export default function NavBar() {
  const { signedIn, username, avatarIndex, walletLinked, signIn } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { href: "/explore", label: "Explore", match: (p) => p === "/explore" },
    { href: "/create", label: "Create", match: (p) => p === "/create" },
    ...(signedIn && username
      ? [{ href: "/baskets", label: "Baskets", match: (p: string) => p === "/baskets" }]
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

        <nav className="hidden items-center gap-8 sm:flex">
          {navItems.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative py-1 text-lg font-medium transition-colors ${
                  active ? "text-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                {item.label}
                {active && <span className="absolute -bottom-[19px] left-0 right-0 h-0.5 bg-accent" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          {!signedIn ? (
            <button
              onClick={() => signIn()}
              className="rounded-xl bg-accent px-4 py-2.5 text-base font-semibold text-accent-foreground transition-colors hover:bg-accent-strong active:scale-95 cursor-pointer sm:px-6 sm:py-3"
            >
              Sign in
            </button>
          ) : (
            <Link href="/profile" className="relative block" aria-label="Profile">
              <Avatar username={username ?? ""} size={44} styleIndex={avatarIndex} />
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
                  walletLinked ? "bg-positive" : "bg-muted/60"
                }`}
                title={walletLinked ? "Wallet connected" : "Wallet not linked"}
              />
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            className="rounded-lg p-1.5 text-foreground transition-colors hover:bg-surface-hover cursor-pointer sm:hidden"
          >
            <MenuIcon open={mobileMenuOpen} className="h-4 w-5" />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="flex flex-col gap-1 border-t border-border-subtle px-4 py-3 sm:hidden">
          {navItems.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-lg font-medium transition-colors ${
                  active ? "bg-accent-soft text-accent-strong" : "text-muted hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
