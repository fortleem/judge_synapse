import { NextRequest } from "next/server"
import { ok, fail, ensureSeed } from "@/lib/judicial/api-helpers"
import { checkLaw } from "@/lib/judicial/law-check"
import { z } from "zod"

export const dynamic = "force-dynamic"

const CheckSchema = z.object({
  lawNumber: z.string().min(2),
  courtType: z.string().min(2),
})

// POST: check a law number against a court type
// Returns: law verification + jurisdiction check + similar web cases + contradictions + AI analysis
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSeed()
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = CheckSchema.safeParse(body)
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات غير صحيحة", 422)

  const result = await checkLaw(parsed.data.lawNumber, parsed.data.courtType, id)
  return ok(result)
}
