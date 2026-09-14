import Link from "next/link";
import { GradientBackground } from "@/components/ui/noisy-gradient-backgrounds";
import ButtonWithIcon from "@/components/ui/button-with-icon";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="relative min-h-screen overflow-hidden">
        <GradientBackground noisePatternRefreshInterval={2} />

        <div className="relative z-10">
          <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
            <span className="font-display text-2xl italic text-foreground">Basket</span>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-base font-semibold text-accent-foreground transition-all hover:-translate-y-0.5 hover:bg-accent-strong"
            >
              Open app
            </Link>
          </header>

          <section className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-6xl flex-col items-center justify-center px-4 pb-16 text-center sm:px-6">
            <h1 className="max-w-3xl font-display text-[clamp(2.75rem,6.5vw,5rem)] font-medium leading-[1.03] tracking-tight text-foreground">
              Create a basket.
              <br />
              Invest in any basket.
            </h1>
            <p className="mx-auto mt-6 max-w-[58ch] text-lg leading-relaxed text-foreground/70 sm:text-xl">
              <span className="text-foreground">
                A community-curated marketplace for stock baskets built from tokenized equities on
                Solana.
              </span>{" "}
              Build your own index like the S&amp;P 500, publish it, and let others invest in the
              whole basket through a single transaction.
            </p>

            <div className="mt-8">
              <ButtonWithIcon href="/explore">Explore</ButtonWithIcon>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
