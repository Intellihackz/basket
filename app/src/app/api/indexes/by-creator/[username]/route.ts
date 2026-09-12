import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { indexes, users } from "@/lib/db/schema";
import { hydrateIndexes } from "@/lib/db/index-stats";

export async function GET(_request: Request, props: { params: Promise<{ username: string }> }) {
  const { username } = await props.params;

  const [creator] = await db.select({ id: users.id }).from(users).where(eq(users.username, username));
  if (!creator) {
    return NextResponse.json({ indexes: [] });
  }

  const rows = await db.select().from(indexes).where(eq(indexes.creatorUserId, creator.id));
  const hydrated = await hydrateIndexes(rows);
  return NextResponse.json({ indexes: hydrated });
}
