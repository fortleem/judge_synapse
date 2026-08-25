import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeFact } from "@/lib/judicial/serialize"
import { z } from "zod"

export const dynamic = "force-dynamic"

const PatchFact = z.object({
  statement: z.string().optional(),
  status: z.enum(["alleged","admitted","denied","undisputed","supported","contradicted","judicially_established","unresolved"]).optional(),
  materiality: z.enum(["outcome_material","supporting","immaterial"]).optional(),
  party: z.string().nullable().optional(),
  sourceNote: z.string().nullable().optional(),
  aiExtracted: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string; fid: string }> }) {
  await ensureSeed()
  const { fid } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = PatchFact.safeParse(body)
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات غير صحيحة", 422)
  const row = await db.fact.update({ where: { id: fid }, data: parsed.data })
  return ok(serializeFact(row))
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; fid: string }> }) {
  await ensureSeed()
  const { fid } = await ctx.params
  await db.fact.delete({ where: { id: fid } }).catch(() => null)
  return ok({ deleted: true })
}
