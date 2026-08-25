import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeConflict } from "@/lib/judicial/serialize"
import { detectConflicts } from "@/lib/judicial/adversary"
import { audit } from "@/lib/judicial/audit"

export const dynamic = "force-dynamic"

// GET: auto-detect and return conflicts for this case
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSeed()
  const { id } = await ctx.params

  const caseData = await db.case.findUnique({
    where: { id },
    include: { facts: true, authorities: true, issues: true, evidence: true, timeline: true },
  })
  if (!caseData) return ok([])

  // Auto-detect conflicts using the engine
  const detected = detectConflicts({
    facts: caseData.facts as any,
    authorities: caseData.authorities as any,
    issues: caseData.issues as any,
    evidence: caseData.evidence as any,
    timeline: caseData.timeline as any,
    proceduralStage: caseData.proceduralStage,
    operatingState: caseData.operatingState,
    aiAnalyses: [],
  })

  // Persist detected conflicts (upsert — don't duplicate)
  for (const c of detected) {
    const existing = await db.conflict.findFirst({
      where: { caseId: id, conflictType: c.conflictType, description: c.description },
    })
    if (!existing) {
      await db.conflict.create({ data: { caseId: id, ...c } })
      audit.systemAction(id, "conflict_detected", "conflict", undefined, `اكتشاف تعارض: ${c.description}`)
    }
  }

  const rows = await db.conflict.findMany({ where: { caseId: id }, orderBy: { createdAt: "asc" } })
  return ok(rows.map(serializeConflict))
}
