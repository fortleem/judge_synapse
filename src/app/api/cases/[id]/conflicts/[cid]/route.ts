import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeConflict } from "@/lib/judicial/serialize"
import { audit } from "@/lib/judicial/audit"
import { z } from "zod"

export const dynamic = "force-dynamic"

const PatchSchema = z.object({
  status: z.enum(["POTENTIAL_CONFLICT", "CONFLICT", "RESOLVED", "FALSE_POSITIVE"]).optional(),
  judgeReview: z.enum(["pending", "reviewed", "dismissed", "confirmed"]).optional(),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string; cid: string }> }) {
  await ensureSeed()
  const { id, cid } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات غير صحيحة", 422)
  const data: Record<string, unknown> = {}
  if (parsed.data.status) data.status = parsed.data.status
  if (parsed.data.judgeReview) data.judgeReview = parsed.data.judgeReview
  const row = await db.conflict.update({ where: { id: cid }, data })
  audit.judgeDecision(id, `conflict_${parsed.data.judgeReview ?? parsed.data.status ?? "updated"}`, "conflict", cid)
  return ok(serializeConflict(row))
}
