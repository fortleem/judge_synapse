import { NextRequest } from "next/server"
import { ok, ensureSeed } from "@/lib/judicial/api-helpers"
import { scanCaseForContradictions } from "@/lib/judicial/contradiction-alerts"

export const dynamic = "force-dynamic"

// GET: scan case for contradictions and return proactive alerts
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSeed()
  const { id } = await ctx.params
  const report = await scanCaseForContradictions(id)
  return ok(report)
}
