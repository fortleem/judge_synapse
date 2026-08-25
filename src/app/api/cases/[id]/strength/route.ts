import { NextRequest } from "next/server"
import { ok, ensureSeed } from "@/lib/judicial/api-helpers"
import { analyzeLegalStrength } from "@/lib/judicial/contradiction-alerts"

export const dynamic = "force-dynamic"

// GET: analyze legal strength balance between parties
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSeed()
  const { id } = await ctx.params
  const analysis = await analyzeLegalStrength(id)
  return ok(analysis)
}
