import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, zodError, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeDeadline } from "@/lib/judicial/serialize"
import { LEGAL_DEADLINES, computeDeadline, getDeadlineStatus } from "@/lib/judicial/deadlines"
import { audit } from "@/lib/judicial/audit"
import { z } from "zod"

export const dynamic = "force-dynamic"

const CreateSchema = z.object({
  deadlineType: z.string().min(1),
  startDate: z.string(),
  defendantAbroad: z.boolean().default(false),
  notes: z.string().nullable().optional(),
})

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSeed()
  const { id } = await ctx.params
  const rows = await db.caseDeadline.findMany({ where: { caseId: id }, orderBy: { computedDeadline: "asc" } })
  return ok(rows.map(serializeDeadline))
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSeed()
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return zodError(parsed.error)
  const d = parsed.data

  const computed = computeDeadline(new Date(d.startDate), d.deadlineType, d.defendantAbroad)
  if (!computed) return fail("VALIDATION_ERROR", "نوع الميعاد غير معروف", 422)

  const row = await db.caseDeadline.create({
    data: {
      caseId: id,
      deadlineType: d.deadlineType,
      title: computed.definition.label,
      legalBasis: computed.definition.legalBasis,
      startDate: new Date(d.startDate),
      computedDeadline: computed.deadline,
      daysAllowed: computed.daysAllowed,
      defendantAbroad: d.defendantAbroad,
      status: getDeadlineStatus(computed.deadline),
      notes: d.notes ?? null,
    },
  })

  audit.systemAction(id, "deadline_computed", "case_deadline", row.id, `حساب ميعاد: ${computed.definition.label} — ينتهي ${computed.deadline.toISOString().slice(0, 10)}`)
  return ok(serializeDeadline(row))
}
