# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two roles, one audience: **curators**, who assemble and publish a weighted basket ("index") of tokenized equities around a thesis, and **backers**, who discover an index and buy into it. The same person is expected to move between both roles. A backer today is a plausible curator tomorrow. Design and copy address both without foregrounding either.

## Product Purpose

Basket is a user-curated marketplace for creating and investing in stock baskets built from tokenized equities on Solana. Instead of limiting investors to individual stocks or predefined market indexes, the platform lets anyone create their own custom basket: choose the equities, define each asset's allocation, name and describe the thesis, and publish it for others to discover.

A basket functions like a custom stock index. Just as the S&P 500 represents a predefined basket of companies, users can create their own index around any collection of stocks they believe belongs together. The difference is the composition is completely user-defined, not set by a committee.

Once published, a basket becomes an investable product: others browse the marketplace, see exactly how it's allocated, check its performance since publish, and invest in the whole thing through a single transaction instead of manually buying each underlying stock.

**Core loop: Create → Publish → Discover → Invest.** The goal is to make custom index creation as accessible as buying a single stock, turning the community's collective knowledge and conviction into an on-chain marketplace of investable baskets.

## Positioning

Basket is **entirely community-curated**: the community creates the baskets, the community determines what gets discovered (via real holders/return, not editorial placement), and investors decide which baskets deserve capital. There is no central authority deciding which stocks belong together, no gatekeeper, no application, no minimum AUM.

The product is two-sided by design: every user can be both a creator and an investor. Someone might build and publish an "AI Infrastructure" basket while also discovering and investing in baskets other people built. (Internally these roles are called **curator** and **backer**; "creator" and "investor" are the reader-facing equivalents for the same duality.)

Mechanically, this is not a fund: buying a basket is not buying shares in a pooled vault. It's a single bundled transaction (Jupiter swaps) that lands the actual underlying tokenized stocks directly in the buyer's own wallet. No custodian, no manager risk, no fund structure standing between the investor and the assets.

The claim a competitor (a traditional ETF issuer, or a pooled crypto index fund) cannot truthfully copy: **you can launch a custom index in minutes with no gatekeeper, and everyone who invests in it actually owns the underlying stocks in their own wallet, not a claim on a fund.**

## Operating Context

- Runs on Solana. Underlying assets are tokenized US equities/ETFs from xStocks (Backed Finance), sourced from their public API.
- Buying an index bundles per-asset Jupiter swaps into one transaction; tokens settle directly into the backer's linked wallet.
- Auth is Privy (Google or email login, plus linking an external Solana wallet, Phantom etc., for onchain actions). No embedded/custodial wallet is auto-created.
- Index and user metadata lives in Neon Postgres (Drizzle ORM); prices/quotes come from Jupiter and xStocks, not a local price feed of record.

## Capabilities and Constraints

- No custom Anchor program or vault contract. This is deliberate; the product's ownership claim depends on backers holding real tokens directly, not LP/share tokens in a pool.
- Terminology: an **index** is a published basket; a **curator** publishes one; a **backer** buys into one. Avoid "fund," "shares," or "AUM held by the platform" in copy. Those describe the pooled model this product explicitly is not.
- Real buy/sell execution via Jupiter is not yet wired end-to-end (currently simulated in the UI). This is a functional gap, not a positioning one. Copy and design should describe the real intended mechanism.
- Server-side verification of Privy auth tokens is not implemented (hackathon-scope limitation); not a product-facing fact.
- Undecided: whether curators earn anything (fee, reputation only, etc.) for a backer buying their index. Not yet a product decision; do not invent an economic model in copy.

## Brand Commitments

Name is final: **Basket**. Existing wordmark/name treatment in the codebase is binding; redesign styling and copy, not the name.

## Evidence on Hand

- Existing hero copy on the explore page ("Your thesis. Your index." / "798 tokenized equities on Solana") reflects the current best framing attempt and is a starting reference, not necessarily final.
- Existing example indexes in mock data (AI Infrastructure, Robotics Revolution, Big Tech 10, Nuclear Future, Dividend Kings, Space Economy) are real xStocks-backed except 5 flagged placeholder tickers (CCJ, VST, ASTS, LUNR, ABB) pending reconciliation with the real registry. Treat those 5 as known-fake, not evidence of a real thesis.
- 798 real tokenized equities are available via the xStocks registry (`src/lib/xstocks/registry.ts`), giving genuine long-tail thesis coverage (not just mega-cap tech).

## Product Principles

1. **Ownership, not a claim on a fund.** Every buy lands real tokens in the backer's own wallet, never a pooled vault, never a share certificate. This is the product's core differentiation and must survive every redesign.
2. **Permissionless publishing.** No gatekeeper decides which thesis gets to exist as an index. The long tail of ideas is the point.
3. **One thesis, one transaction.** Diversified exposure to a whole idea should feel as fast and atomic as a single swap.
4. **Curator and backer are one audience.** Never design or write as if only one role matters; the loop between the two is the growth mechanism.
