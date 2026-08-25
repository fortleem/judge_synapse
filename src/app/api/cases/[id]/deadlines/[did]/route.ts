import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, ensureSeed } from "@/lib/judicial/api-helpers"

export const dynamic = "force-dynamic"

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; did: string }> }) {
  await ensureSeed()
  const { did } = await ctx.params
  await db.caseDeadline.delete({ where: { id: did } }).catch(() => null)
  return ok({ deleted: true })
}
