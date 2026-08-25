import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, ensureSeed } from "@/lib/judicial/api-helpers"

export const dynamic = "force-dynamic"

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; aid: string }> }) {
  await ensureSeed()
  const { aid } = await ctx.params
  await db.authority.delete({ where: { id: aid } }).catch(() => null)
  return ok({ deleted: true })
}
