import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, zodError, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeCase, serializeCaseDetail } from "@/lib/judicial/serialize"
import { CreateCaseInputSchema } from "@/lib/judicial/schemas"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  await ensureSeed()
  const { searchParams } = req.nextUrl
  const stage = searchParams.get("stage")
  const risk = searchParams.get("risk")
  const state = searchParams.get("state")
  const q = searchParams.get("q")?.trim()

  const where: Record<string, unknown> = {}
  if (stage) where.proceduralStage = stage
  if (risk) where.riskLevel = risk
  if (state) where.operatingState = state
  if (q) {
    where.OR = [
      { caseNumber: { contains: q } },
      { title: { contains: q } },
      { parties: { contains: q } },
      { subjectMatter: { contains: q } },
      { court: { contains: q } },
    ]
  }

  const rows = await db.case.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 200,
  })
  return ok(rows.map(serializeCase))
}

export async function POST(req: NextRequest) {
  await ensureSeed()
  const body = await req.json().catch(() => null)
  const parsed = CreateCaseInputSchema.safeParse(body)
  if (!parsed.success) return zodError(parsed.error)
  const data = parsed.data
  const row = await db.case.create({
    data: {
      caseNumber: data.caseNumber,
      title: data.title,
      court: data.court,
      circuit: data.circuit,
      caseType: data.caseType,
      parties: data.parties,
      subjectMatter: data.subjectMatter,
      proceduralStage: data.proceduralStage,
      riskLevel: data.riskLevel,
      operatingState: data.operatingState,
      summary: data.summary,
      filedDate: data.filedDate ? new Date(data.filedDate) : null,
      nextHearing: data.nextHearing ? new Date(data.nextHearing) : null,
    },
  })
  // ensure judge fields + indicators exist
  for (const fieldType of ["judge_results", "judge_reasoning", "draft", "integrity_review"]) {
    await db.judgeField.create({ data: { caseId: row.id, fieldType, content: "", status: "empty" } })
  }
  for (const indicatorType of ["citation_soundness", "legal_version", "defense_coverage", "evidence_consistency"]) {
    await db.indicator.create({ data: { caseId: row.id, indicatorType, score: 0, status: "pending" } })
  }
  const full = await db.case.findUnique({ where: { id: row.id }, include: { facts: true, evidence: true, timeline: true, issues: true, authorities: true, judgeFields: true, aiAnalyses: true, indicators: true, conflicts: true, adversaryReviews: true, notes: true, auditLogs: true, citationVerifications: true, deadlines: true } })
  if (!full) return fail("INTERNAL_ERROR", "فشل إنشاء القضية", 500)
  return ok(serializeCaseDetail(full))
}
