import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeAdversaryReview } from "@/lib/judicial/serialize"
import { audit } from "@/lib/judicial/audit"
import { z } from "zod"

export const dynamic = "force-dynamic"

// PATCH: transfer an adversary finding to the judge's space
// This requires explicit confirmation — the judge must review before transfer
// The transfer is logged as "adversary_transfer" — distinct from judge_decision
const TransferSchema = z.object({
  transferStatus: z.enum(["requested", "transferred", "rejected"]),
  judgeNote: z.string().nullable().optional(),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string; aid: string }> }) {
  await ensureSeed()
  const { id, aid } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = TransferSchema.safeParse(body)
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات غير صحيحة", 422)

  const data: Record<string, unknown> = {
    transferStatus: parsed.data.transferStatus,
    judgeNote: parsed.data.judgeNote ?? null,
  }
  if (parsed.data.transferStatus === "transferred") {
    data.transferredAt = new Date()
  }

  const row = await db.adversaryReview.update({ where: { id: aid }, data })

  // Log the transfer with clear source separation
  if (parsed.data.transferStatus === "transferred") {
    audit.adversaryTransfer(id, "transferred_to_judge", aid, `نقل مراجعة خصومية لمساحة القاضي: ${row.proposition.slice(0, 80)}`)
  } else if (parsed.data.transferStatus === "rejected") {
    audit.adversaryTransfer(id, "transfer_rejected", aid, `رفض نقل مراجعة خصومية: ${parsed.data.judgeNote ?? ""}`)
  } else {
    audit.adversaryTransfer(id, "transfer_requested", aid, `طلب نقل مراجعة خصومية`)
  }

  return ok(serializeAdversaryReview(row))
}
