import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, zodError, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeEvidence } from "@/lib/judicial/serialize"
import { CreateEvidenceInputSchema } from "@/lib/judicial/schemas"
import crypto from "crypto"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSeed()
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = CreateEvidenceInputSchema.safeParse(body)
  if (!parsed.success) return zodError(parsed.error)
  const data = parsed.data
  // Generate an integrity hash placeholder (sovereign provenance)
  const seed = `${data.title}|${data.evidenceType}|${data.date ?? Date.now()}`
  const integrityHash = `sha256:${crypto.createHash("sha256").update(seed).digest("hex").slice(0, 16)}`
  const row = await db.evidence.create({
    data: {
      caseId: id,
      title: data.title,
      type: data.type,
      evidenceType: data.evidenceType,
      origin: data.origin ?? null,
      source: data.source ?? null,
      date: data.date ? new Date(data.date) : null,
      integrityHash,
      admissibility: "pending_review",
      judicialTreatment: "unexamined",
      relevance: data.relevance ?? null,
    },
  })
  return ok(serializeEvidence(row))
}
