import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, zodError, ensureSeed } from "@/lib/judicial/api-helpers"
import { audit } from "@/lib/judicial/audit"
import { z } from "zod"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSeed()
  const { id } = await ctx.params
  const parties = await db.party.findMany({ where: { caseId: id }, orderBy: { createdAt: "asc" } })
  return ok(parties)
}

const CreatePartySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["person", "company"]).default("person"),
  role: z.enum(["plaintiff", "defendant", "witness", "expert", "representative", "other"]).default("plaintiff"),
  nationalId: z.string().nullable().optional(),
  companyReg: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSeed()
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = CreatePartySchema.safeParse(body)
  if (!parsed.success) return zodError(parsed.error)
  const d = parsed.data

  const party = await db.party.create({
    data: {
      caseId: id,
      name: d.name,
      type: d.type,
      role: d.role,
      nationalId: d.nationalId ?? null,
      companyReg: d.companyReg ?? null,
      address: d.address ?? null,
      phone: d.phone ?? null,
      email: d.email ?? null,
      notes: d.notes ?? null,
    },
  })

  // Cross-case check: if nationalId or companyReg exists, find other cases
  let crossCaseAlert: { found: boolean; otherCases: Array<{ caseId: string; caseNumber: string; title: string; court: string; role: string }> } = { found: false, otherCases: [] }

  if (d.nationalId || d.companyReg) {
    const otherParties = await db.party.findMany({
      where: {
        AND: [
          { caseId: { not: id } },
          {
            OR: [
              ...(d.nationalId ? [{ nationalId: d.nationalId }] : []),
              ...(d.companyReg ? [{ companyReg: d.companyReg }] : []),
            ],
          },
        ],
      },
      include: { case: { select: { id: true, caseNumber: true, title: true, court: true, proceduralStage: true } } },
    })

    if (otherParties.length > 0) {
      crossCaseAlert = {
        found: true,
        otherCases: otherParties.map((p) => ({
          caseId: p.case.id,
          caseNumber: p.case.caseNumber,
          title: p.case.title,
          court: p.case.court,
          role: p.role,
        })),
      }
      audit.systemProposal(id, "cross_case_detected", "party", party.id,
        `تم اكتشاف ${otherParties.length} قضية أخرى لنفس الطرف (${d.nationalId ?? d.companyReg}) في محاكم أخرى`)
    }
  }

  audit.systemAction(id, "party_added", "party", party.id, `إضافة طرف: ${d.name} (${d.role})`)
  return ok({ party, crossCaseAlert })
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSeed()
  const { id } = await ctx.params
  const url = new URL(req.url)
  const partyId = url.searchParams.get("partyId")
  if (!partyId) return fail("VALIDATION_ERROR", "معرف الطرف مطلوب", 422)
  await db.party.delete({ where: { id: partyId } }).catch(() => null)
  return ok({ deleted: true })
}
