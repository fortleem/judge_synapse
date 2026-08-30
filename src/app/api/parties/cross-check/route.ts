import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, ensureSeed } from "@/lib/judicial/api-helpers"
import { z } from "zod"

export const dynamic = "force-dynamic"

const CrossCheckSchema = z.object({
  nationalId: z.string().nullable().optional(),
  companyReg: z.string().nullable().optional(),
  excludeCaseId: z.string().nullable().optional(),
})

// POST: cross-case check — find if a party (by national ID or company reg)
// is involved in other cases across different courts
export async function POST(req: NextRequest) {
  await ensureSeed()
  const body = await req.json().catch(() => null)
  const parsed = CrossCheckSchema.safeParse(body)
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات غير صحيحة", 422)
  const d = parsed.data

  if (!d.nationalId && !d.companyReg) {
    return ok({ found: false, otherCases: [], message: "لا يوجد رقم قومي أو سجل تجاري للبحث" })
  }

  const where: Record<string, unknown> = {}
  if (d.excludeCaseId) where.caseId = { not: d.excludeCaseId }
  where.OR = [
    ...(d.nationalId ? [{ nationalId: d.nationalId }] : []),
    ...(d.companyReg ? [{ companyReg: d.companyReg }] : []),
  ]

  const otherParties = await db.party.findMany({
    where,
    include: {
      case: {
        select: {
          id: true, caseNumber: true, title: true, court: true,
          circuit: true, proceduralStage: true, riskLevel: true,
        },
      },
    },
  })

  const otherCases = otherParties.map((p) => ({
    caseId: p.case.id,
    caseNumber: p.case.caseNumber,
    title: p.case.title,
    court: p.case.court,
    circuit: p.case.circuit,
    proceduralStage: p.case.proceduralStage,
    riskLevel: p.case.riskLevel,
    partyName: p.name,
    partyRole: p.role,
    partyType: p.type,
    matchedField: d.nationalId && p.nationalId === d.nationalId ? "nationalId" : "companyReg",
    matchedValue: d.nationalId && p.nationalId === d.nationalId ? d.nationalId : d.companyReg,
  }))

  return ok({
    found: otherCases.length > 0,
    count: otherCases.length,
    otherCases,
    message: otherCases.length > 0
      ? `تم العثور على ${otherCases.length} قضية أخرى لنفس الطرف في محاكم أخرى`
      : "لا توجد قضايا أخرى لنفس الطرف",
  })
}
