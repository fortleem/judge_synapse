import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, ensureSeed } from "@/lib/judicial/api-helpers"

export const dynamic = "force-dynamic"

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; tid: string }> }) {
  await ensureSeed()
  const { tid } = await ctx.params
  await db.timelineEvent.delete({ where: { id: tid } }).catch(() => null)
  return ok({ deleted: true })
}
