import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeImportJob } from "@/lib/judicial/serialize"
import { z } from "zod"

export const dynamic = "force-dynamic"

const PatchSchema = z.object({
  status: z.enum(["QUEUED", "IN_PROGRESS", "COMPLETED", "FAILED", "BLOCKED"]).optional(),
  priority: z.number().min(1).max(10).optional(),
  notes: z.string().nullable().optional(),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSeed()
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات غير صحيحة", 422)
  const data: Record<string, unknown> = {}
  if (parsed.data.status) {
    data.status = parsed.data.status
    data.lastAttempt = new Date()
  }
  if (parsed.data.priority !== undefined) data.priority = parsed.data.priority
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes
  const row = await db.importJob.update({ where: { id }, data })
  return ok(serializeImportJob(row))
}
