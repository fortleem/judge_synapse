import { db } from "@/lib/db"
import { ok, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeCase } from "@/lib/judicial/serialize"
import { PROCEDURAL_STAGES, RISK_LEVELS, OPERATING_STATES } from "@/lib/judicial/constants"

export const dynamic = "force-dynamic"

export async function GET() {
  await ensureSeed()
  const [cases, facts, evidence, authorities] = await Promise.all([
    db.case.findMany({ orderBy: { updatedAt: "desc" }, take: 50 }),
    db.fact.count(),
    db.evidence.count(),
    db.authority.count(),
  ])

  const pendingReview = cases.filter((c) => c.operatingState === "REVIEW").length
  const conflicts = cases.filter((c) => c.operatingState === "CONFLICT").length
  const degradedCases = cases.filter((c) => c.operatingState === "SYSTEM_DEGRADED").length
  const systemState =
    degradedCases > 0 ? "SYSTEM_DEGRADED" : conflicts > 0 ? "CONFLICT" : "NOMINAL"

  const byStage = PROCEDURAL_STAGES.map((s) => ({
    stage: s.value,
    count: cases.filter((c) => c.proceduralStage === s.value).length,
  }))
  const byRisk = RISK_LEVELS.map((r) => ({
    risk: r.value,
    count: cases.filter((c) => c.riskLevel === r.value).length,
  }))
  const byOperatingState = OPERATING_STATES.map((o) => ({
    state: o.value,
    count: cases.filter((c) => c.operatingState === o.value).length,
  }))

  return ok({
    totals: {
      cases: cases.length,
      facts,
      evidence,
      authorities,
      pendingReview,
      conflicts,
    },
    byStage,
    byRisk,
    byOperatingState,
    recentCases: cases.slice(0, 6).map(serializeCase),
    corpusVersion: "EJB-CORPUS-2026.08-R1",
    systemState,
    degraded: degradedCases > 0,
  })
}
