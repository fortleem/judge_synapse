import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeAdversaryReview } from "@/lib/judicial/serialize"
import { runAdversaryReview } from "@/lib/judicial/adversary"
import { audit } from "@/lib/judicial/audit"
import { z } from "zod"

export const dynamic = "force-dynamic"

// POST: generate an adversary review for a given proposition
// This is the "Judicial Shadow" (§34, §36) — tests from 4 angles
// WITHOUT issuing a verdict or confidence score
const GenerateSchema = z.object({
  proposition: z.string().min(5),
  targetType: z.enum(["ai_analysis", "fact", "authority", "judge_field", "proposition"]).default("proposition"),
  targetId: z.string().nullable().optional(),
})

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSeed()
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = GenerateSchema.safeParse(body)
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات غير صحيحة", 422)

  const caseData = await db.case.findUnique({
    where: { id },
    include: { facts: true, authorities: true, issues: true, evidence: true, timeline: true, aiAnalyses: true },
  })
  if (!caseData) return fail("NOT_FOUND", "القضية غير موجودة", 404)

  // Run the 4-angle adversarial test
  const result = runAdversaryReview(
    {
      facts: caseData.facts as any,
      authorities: caseData.authorities as any,
      issues: caseData.issues as any,
      evidence: caseData.evidence as any,
      timeline: caseData.timeline as any,
      proceduralStage: caseData.proceduralStage,
      operatingState: caseData.operatingState,
      aiAnalyses: caseData.aiAnalyses as any,
    },
    parsed.data.proposition,
    parsed.data.targetType,
    parsed.data.targetId ?? undefined,
  )

  const row = await db.adversaryReview.create({
    data: {
      caseId: id,
      targetType: result.targetType,
      targetId: result.targetId ?? null,
      proposition: result.proposition,
      factsAngle: result.factsAngle,
      textAngle: result.textAngle,
      defenseAngle: result.defenseAngle,
      proceduralAngle: result.proceduralAngle,
      vulnerabilities: result.vulnerabilities,
      transferStatus: "none",
    },
  })

  audit.systemAction(id, "adversary_review_generated", "adversary_review", row.id, `مراجعة خصومية: ${parsed.data.proposition.slice(0, 80)}`)
  return ok(serializeAdversaryReview(row))
}
