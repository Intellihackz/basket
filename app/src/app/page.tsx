"use client";

import Link from "next/link";
import { useSession } from "@/lib/session";

export default function LandingPage() {
  const { signIn } = useSession();

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Hero — nav, claim, and a demo card flanked by annotation labels */}
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-background">
        <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-7 sm:px-6">
          <span className="font-display text-2xl font-bold tracking-tight text-foreground">Basket</span>
          <nav className="flex items-center gap-6">
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-base font-semibold text-accent-foreground transition-all hover:-translate-y-0.5 hover:bg-accent-strong"
            >
              Open app
              <span aria-hidden>↗</span>

            </Link>
          </nav>
        </header>

        <section className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
          <h1 className="max-w-3xl font-display text-[clamp(2.75rem,7vw,5.5rem)] font-bold leading-[0.98] tracking-[-0.02em] text-foreground">
            Create a basket.
            <br />
            Invest in any basket.
          </h1>
          <p className="mt-6 max-w-[60ch] text-base leading-relaxed sm:text-lg">
            <span className="text-foreground">
              A community-curated marketplace for stock baskets built from tokenized
              equities on Solana.
            </span>{" "}
            <span className="text-muted">
              Build your own index (Basket) like the S&amp;P 500, publish it, and let others
              invest in the whole basket.
            </span>
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-all hover:-translate-y-0.5 hover:bg-accent-strong"
            >
              Create a basket
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-xl border border-border-subtle px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-foreground/30"
            >
              Discover baskets
              <span aria-hidden>↗</span>
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Create <span aria-hidden>→</span> Publish <span aria-hidden>→</span> Discover{" "}
            <span aria-hidden>→</span> Invest
          </div>
        </section>
      </div>
    </div>
  );
}
