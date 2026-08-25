import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, ensureSeed } from "@/lib/judicial/api-helpers"

export const dynamic = "force-dynamic"

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; eid: string }> }) {
  await ensureSeed()
  const { eid } = await ctx.params
  await db.evidence.delete({ where: { id: eid } }).catch(() => null)
  return ok({ deleted: true })
}
