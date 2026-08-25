import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, ensureSeed } from "@/lib/judicial/api-helpers"
import { invokeSphinx } from "@/lib/judicial/sphinx-gateway"
import { audit } from "@/lib/judicial/audit"
import { z } from "zod"

export const dynamic = "force-dynamic"

const RequestSchema = z.object({
  task: z.enum(["summary", "adversarial", "research", "drafting", "extraction"]),
  prompt: z.string().min(5),
  maxTokens: z.number().min(100).max(4000).optional(),
})

// POST: invoke the Sphinx Model Gateway for AI-assisted analysis
// All output is non-authoritative — the judge exercises judicial authority
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSeed()
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) return fail("VALIDATION_ERROR", "طلب غير صحيح", 422)

  const { task, prompt, maxTokens } = parsed.data

  // Invoke the gateway (policy-controlled routing)
  const result = await invokeSphinx({ caseId: id, task, prompt, maxTokens })

  // Persist the AI analysis as a non-authoritative record
  if (result.ok && result.content) {
    await db.aIAnalysis.create({
      data: {
        caseId: id,
        analysisType: task,
        title: `تحليل ${task} — ${result.provider}/${result.modelId}`,
        content: result.content,
        responseStatus: result.responseStatus,
        provenance: result.provenance,
        modelId: `${result.provider}/${result.modelId}`,
        nonAuthoritative: true,
      },
    })
    audit.systemProposal(id, `ai_analysis_${task}`, "ai_analysis", undefined, `تحليل ${task} عبر ${result.provider} — غير مُلزِم`)
  } else {
    audit.systemAction(id, `ai_blocked_${task}`, "ai_analysis", undefined, `محظور: ${result.policyNote}`)
  }

  return ok({
    ok: result.ok,
    provider: result.provider,
    modelId: result.modelId,
    content: result.content,
    nonAuthoritative: result.nonAuthoritative,
    provenance: result.provenance,
    responseStatus: result.responseStatus,
    policyNote: result.policyNote,
    tokensUsed: result.tokensUsed,
    latencyMs: result.latencyMs,
    error: result.error,
  })
}
