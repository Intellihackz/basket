import { pgTable, text, integer, timestamp, jsonb, bigint } from "drizzle-orm/pg-core";

/**
 * Offchain identity, keyed by Privy's user id (a stable DID string, e.g.
 * "did:privy:clx..."). Never stores anything that represents real value —
 * asset custody and balances stay onchain and are read live from the
 * connected wallet, not from this row.
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Privy DID
  username: text("username").notNull().unique(),
  email: text("email"),
  loginMethod: text("login_method"), // e.g. "google" | "email"
  walletPubkey: text("wallet_pubkey"), // null until a Solana wallet is linked
  avatarIndex: integer("avatar_index"), // null = derive from username hash
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;

export type IndexAsset = {
  symbol: string; // underlying ticker, e.g. "NVDA"
  mint: string; // xStocks Token-2022 mint
  weightBps: number; // basis points, sums to 10_000
};

/**
 * A published basket. `assets` is the actual fund structure — there is no
 * separate vault or pooled balance; buying an index is a direct multi-asset
 * purchase, so this row is purely the manifest a buy transaction is built from.
 * `priceSnapshotUsd` captures each asset's live Jupiter price at publish time,
 * so "since publish" returns can be computed later without fabricating history.
 */
export const indexes = pgTable("indexes", {
  id: text("id").primaryKey(), // slug, e.g. "ai-infrastructure"
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  creatorUserId: text("creator_user_id")
    .notNull()
    .references(() => users.id),
  assets: jsonb("assets").$type<IndexAsset[]>().notNull(),
  priceSnapshotUsd: jsonb("price_snapshot_usd").$type<Record<string, number>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type IndexRow = typeof indexes.$inferSelect;
export type NewIndexRow = typeof indexes.$inferInsert;

/**
 * A completed real buy, recorded from the actual signed Jupiter transaction(s)
 * BuyPanel gets back — never a simulated fill. `amountBaseUnits` is in the
 * input currency's smallest unit (USDC: 10^6, SOL: 10^9).
 */
export const purchases = pgTable("purchases", {
  id: text("id").primaryKey(),
  indexId: text("index_id")
    .notNull()
    .references(() => indexes.id),
  buyerUserId: text("buyer_user_id")
    .notNull()
    .references(() => users.id),
  walletAddress: text("wallet_address").notNull(),
  currency: text("currency").notNull(), // "USDC" | "SOL"
  amountBaseUnits: bigint("amount_base_units", { mode: "number" }).notNull(),
  amountUsd: integer("amount_usd").notNull(), // whole-dollar snapshot at purchase time, for display only
  // Each constituent's real live price at the moment of purchase, so current position
  // value can be computed later from live prices without re-deriving token quantities.
  priceSnapshotUsd: jsonb("price_snapshot_usd").$type<Record<string, number>>().notNull(),
  signatures: jsonb("signatures").$type<string[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PurchaseRow = typeof purchases.$inferSelect;
export type NewPurchaseRow = typeof purchases.$inferInsert;
