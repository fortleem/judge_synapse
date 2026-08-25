import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, ensureSeed } from "@/lib/judicial/api-helpers"

export const dynamic = "force-dynamic"

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; iid: string }> }) {
  await ensureSeed()
  const { iid } = await ctx.params
  await db.legalIssue.delete({ where: { id: iid } }).catch(() => null)
  return ok({ deleted: true })
}
