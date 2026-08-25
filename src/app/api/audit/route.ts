import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeAuditLog } from "@/lib/judicial/serialize"

export const dynamic = "force-dynamic"

// GET: global audit log with filters
// Filters: source (system_proposal | judge_decision | system_action | adversary_transfer)
//          caseId, actor, entityType
export async function GET(req: NextRequest) {
  await ensureSeed()
  const { searchParams } = req.nextUrl
  const source = searchParams.get("source")
  const caseId = searchParams.get("caseId")
  const actor = searchParams.get("actor")
  const entityType = searchParams.get("entityType")
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 500)

  const where: Record<string, unknown> = {}
  if (source) where.source = source
  if (caseId) where.caseId = caseId
  if (actor) where.actor = actor
  if (entityType) where.entityType = entityType

  const rows = await db.auditLog.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take: limit,
  })
  return ok(rows.map(serializeAuditLog))
}
