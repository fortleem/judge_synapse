import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, zodError, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeJudgeNote } from "@/lib/judicial/serialize"
import { audit } from "@/lib/judicial/audit"
import { z } from "zod"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSeed()
  const { id } = await ctx.params
  const rows = await db.judgeNote.findMany({
    where: { caseId: id },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  })
  return ok(rows.map(serializeJudgeNote))
}

const CreateNoteSchema = z.object({
  content: z.string().min(1),
  itemType: z.string().default("general"),
  itemId: z.string().nullable().optional(),
  pinned: z.boolean().default(false),
})

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSeed()
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = CreateNoteSchema.safeParse(body)
  if (!parsed.success) return zodError(parsed.error)
  const d = parsed.data
  const row = await db.judgeNote.create({
    data: {
      caseId: id,
      content: d.content,
      itemType: d.itemType,
      itemId: d.itemId ?? null,
      pinned: d.pinned,
    },
  })
  audit.judgeDecision(id, "note_created", "judge_note", row.id, `ملاحظة: ${d.content.slice(0, 60)}`)
  return ok(serializeJudgeNote(row))
}
