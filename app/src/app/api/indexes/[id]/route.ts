import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { indexes } from "@/lib/db/schema";
import { hydrateIndexes } from "@/lib/db/index-stats";

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const rows = await db.select().from(indexes).where(eq(indexes.id, id));
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const [hydrated] = await hydrateIndexes(rows);
  return NextResponse.json({ index: hydrated });
}
