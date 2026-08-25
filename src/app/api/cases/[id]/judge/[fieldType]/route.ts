import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeJudgeField } from "@/lib/judicial/serialize"
import { UpdateJudgeFieldInputSchema } from "@/lib/judicial/schemas"
import type { JudgeFieldT } from "@/lib/judicial/schemas"

export const dynamic = "force-dynamic"

const VALID_TYPES: JudgeFieldT["fieldType"][] = ["judge_results", "judge_reasoning", "draft", "integrity_review"]

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string; fieldType: string }> }) {
  await ensureSeed()
  const { id, fieldType } = await ctx.params
  if (!VALID_TYPES.includes(fieldType as JudgeFieldT["fieldType"])) {
    return fail("VALIDATION_ERROR", "نوع الحقل غير صحيح", 422)
  }
  const body = await req.json().catch(() => null)
  const parsed = UpdateJudgeFieldInputSchema.safeParse(body)
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات غير صحيحة", 422)

  // Determine status: if AI content being accepted, mark judge_accepted; etc.
  let status: JudgeFieldT["status"] | undefined = parsed.data.status
  if (!status) {
    const existing = await db.judgeField.findUnique({ where: { caseId_fieldType: { caseId: id, fieldType } } })
    if (existing?.status === "empty" && parsed.data.content.trim()) {
      status = "judge_reviewing"
    } else if (existing?.status === "ai_proposed" && parsed.data.content !== existing.content) {
      status = "judge_modified"
    } else {
      status = (existing?.status as JudgeFieldT["status"] | undefined) ?? "judge_reviewing"
    }
  }

  const row = await db.judgeField.upsert({
    where: { caseId_fieldType: { caseId: id, fieldType } },
    update: { content: parsed.data.content, status },
    create: { caseId: id, fieldType, content: parsed.data.content, status: status ?? "judge_reviewing" },
  })
  return ok(serializeJudgeField(row))
}
