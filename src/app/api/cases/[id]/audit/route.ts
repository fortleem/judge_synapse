import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeAuditLog } from "@/lib/judicial/serialize"

export const dynamic = "force-dynamic"

// GET: case-scoped audit log, with optional source filter
// source filter: system_proposal | judge_decision | system_action | adversary_transfer
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSeed()
  const { id } = await ctx.params
  const source = req.nextUrl.searchParams.get("source")
  const where: Record<string, unknown> = { caseId: id }
  if (source) where.source = source
  const rows = await db.auditLog.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take: 200,
  })
  return ok(rows.map(serializeAuditLog))
}
