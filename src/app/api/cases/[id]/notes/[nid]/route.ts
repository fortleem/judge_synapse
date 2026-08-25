import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeJudgeNote } from "@/lib/judicial/serialize"
import { audit } from "@/lib/judicial/audit"
import { z } from "zod"

export const dynamic = "force-dynamic"

const PatchSchema = z.object({
  content: z.string().optional(),
  pinned: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string; nid: string }> }) {
  await ensureSeed()
  const { id, nid } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات غير صحيحة", 422)
  const row = await db.judgeNote.update({ where: { id: nid }, data: parsed.data })
  audit.judgeDecision(id, "note_updated", "judge_note", nid)
  return ok(serializeJudgeNote(row))
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; nid: string }> }) {
  await ensureSeed()
  const { id, nid } = await ctx.params
  await db.judgeNote.delete({ where: { id: nid } }).catch(() => null)
  audit.judgeDecision(id, "note_deleted", "judge_note", nid)
  return ok({ deleted: true })
}
