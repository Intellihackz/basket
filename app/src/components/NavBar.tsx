"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, SquarePlus, ShoppingBasket, CircleUserRound } from "lucide-react";
import { useSession } from "@/lib/session";
import Avatar from "@/components/Avatar";
import BottomNav, { type BottomNavItem } from "@/components/ui/bottom-nav";

type NavItem = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
};

export default function NavBar() {
  const { signedIn, username, avatarIndex, walletLinked, signIn } = useSession();
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: "/explore", label: "Explore", match: (p) => p === "/explore" },
    { href: "/create", label: "Create", match: (p) => p === "/create" },
    ...(signedIn && username
      ? [{ href: "/baskets", label: "Baskets", match: (p: string) => p === "/baskets" }]
      : []),
  ];

  const dockItems: BottomNavItem[] = [
    { href: "/explore", label: "Explore", icon: Compass, active: pathname === "/explore" },
    { href: "/create", label: "Create", icon: SquarePlus, active: pathname === "/create" },
    { href: "/baskets", label: "Baskets", icon: ShoppingBasket, active: pathname === "/baskets" },
    { href: "/profile", label: "Profile", icon: CircleUserRound, active: pathname === "/profile" },
  ];

  return (
    <>
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

          <div className="flex shrink-0 items-center">
            {!signedIn ? (
              <button
                onClick={() => signIn()}
                className="rounded-xl bg-accent px-4 py-2.5 text-base font-semibold text-accent-foreground transition-colors hover:bg-accent-strong active:scale-95 cursor-pointer sm:px-6 sm:py-3"
              >
                Sign in
              </button>
            ) : (
              <Link href="/profile" className="relative hidden sm:block" aria-label="Profile">
                <Avatar username={username ?? ""} size={44} styleIndex={avatarIndex} />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
                    walletLinked ? "bg-positive" : "bg-muted/60"
                  }`}
                  title={walletLinked ? "Wallet connected" : "Wallet not linked"}
                />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Bottom tab bar — navigation only, mobile only, signed-in only */}
      {signedIn && username && <BottomNav items={dockItems} />}
    </>
  );
}
