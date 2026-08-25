import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeCaseDetail } from "@/lib/judicial/serialize"
import {
  ProceduralStageSchema, RiskLevelSchema, OperatingStateSchema,
} from "@/lib/judicial/schemas"
import { z } from "zod"

export const dynamic = "force-dynamic"

const CASE_INCLUDE = {
  facts: { orderBy: { createdAt: "asc" as const } },
  evidence: { orderBy: { createdAt: "asc" as const } },
  timeline: { orderBy: { eventDate: "asc" as const } },
  issues: { orderBy: { sortOrder: "asc" as const } },
  authorities: { orderBy: { createdAt: "asc" as const } },
  judgeFields: true,
  aiAnalyses: { orderBy: { createdAt: "asc" as const } },
  indicators: true,
  conflicts: { orderBy: { createdAt: "asc" as const } },
  adversaryReviews: { orderBy: { createdAt: "asc" as const } },
  notes: { orderBy: { createdAt: "asc" as const } },
  auditLogs: { orderBy: { timestamp: "desc" as const }, take: 100 },
  citationVerifications: { orderBy: { verifiedAt: "desc" as const } },
  deadlines: { orderBy: { computedDeadline: "asc" as const } },
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSeed()
  const { id } = await ctx.params
  const row = await db.case.findUnique({
    where: { id },
    include: CASE_INCLUDE,
  })
  if (!row) return fail("NOT_FOUND", "القضية غير موجودة", 404)
  return ok(serializeCaseDetail(row))
}

const PatchSchema = z.object({
  proceduralStage: ProceduralStageSchema.optional(),
  riskLevel: RiskLevelSchema.optional(),
  operatingState: OperatingStateSchema.optional(),
  summary: z.string().optional(),
  nextHearing: z.string().nullable().optional(),
  aiSyncEnabled: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSeed()
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات غير صحيحة", 422)
  const data: Record<string, unknown> = {}
  if (parsed.data.proceduralStage) data.proceduralStage = parsed.data.proceduralStage
  if (parsed.data.riskLevel) data.riskLevel = parsed.data.riskLevel
  if (parsed.data.operatingState) data.operatingState = parsed.data.operatingState
  if (parsed.data.summary !== undefined) data.summary = parsed.data.summary
  if (parsed.data.nextHearing !== undefined) {
    data.nextHearing = parsed.data.nextHearing ? new Date(parsed.data.nextHearing) : null
  }
  if (parsed.data.aiSyncEnabled !== undefined) data.aiSyncEnabled = parsed.data.aiSyncEnabled
  const row = await db.case.update({ where: { id }, data })
  const full = await db.case.findUnique({ where: { id: row.id }, include: CASE_INCLUDE })
  if (!full) return fail("NOT_FOUND", "القضية غير موجودة", 404)
  return ok(serializeCaseDetail(full))
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSeed()
  const { id } = await ctx.params
  await db.case.delete({ where: { id } }).catch(() => null)
  return ok({ deleted: true })
}
