import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, zodError, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeAuthority } from "@/lib/judicial/serialize"
import { CreateAuthorityInputSchema } from "@/lib/judicial/schemas"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSeed()
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = CreateAuthorityInputSchema.safeParse(body)
  if (!parsed.success) return zodError(parsed.error)
  const data = parsed.data
  const row = await db.authority.create({
    data: {
      caseId: id,
      title: data.title,
      issuingAuthority: data.issuingAuthority ?? null,
      judicialBody: data.judicialBody ?? null,
      court: data.court ?? null,
      chamber: data.chamber ?? null,
      documentType: data.documentType ?? null,
      legalDomain: data.legalDomain ?? null,
      jurisdiction: data.jurisdiction ?? null,
      citation: data.citation ?? null,
      referenceDate: data.referenceDate ? new Date(data.referenceDate) : null,
      stance: data.stance,
      legalForce: data.legalForce,
      verificationStatus: data.verificationStatus,
      exactPassage: data.exactPassage ?? null,
      sourceUrl: data.sourceUrl ?? null,
      relationNote: data.relationNote ?? null,
    },
  })
  return ok(serializeAuthority(row))
}
