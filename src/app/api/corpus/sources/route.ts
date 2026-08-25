import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, zodError, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeLegalSource } from "@/lib/judicial/serialize"
import { audit } from "@/lib/judicial/audit"
import { z } from "zod"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  await ensureSeed()
  const { searchParams } = req.nextUrl
  const sourceType = searchParams.get("sourceType")
  const accessStatus = searchParams.get("accessStatus")
  const q = searchParams.get("q")?.trim()

  const where: Record<string, unknown> = {}
  if (sourceType) where.sourceType = sourceType
  if (accessStatus) where.accessStatus = accessStatus
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { nameEn: { contains: q } },
      { issuingBody: { contains: q } },
    ]
  }

  const rows = await db.legalSource.findMany({
    where,
    orderBy: [{ sourceTier: "asc" }, { name: "asc" }],
  })
  return ok(rows.map(serializeLegalSource))
}

const CreateSourceSchema = z.object({
  name: z.string().min(1),
  nameEn: z.string().nullable().optional(),
  portalUrl: z.string().nullable().optional(),
  sourceType: z.string().min(1),
  issuingBody: z.string().min(1),
  jurisdiction: z.string().nullable().optional(),
  accessStatus: z.string().default("QUEUED"),
  sourceTier: z.number().min(1).max(6).default(3),
  contentAvailable: z.string().nullable().optional(),
  accessNotes: z.string().nullable().optional(),
  verified: z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  await ensureSeed()
  const body = await req.json().catch(() => null)
  const parsed = CreateSourceSchema.safeParse(body)
  if (!parsed.success) return zodError(parsed.error)
  const d = parsed.data
  const row = await db.legalSource.create({
    data: {
      name: d.name,
      nameEn: d.nameEn ?? null,
      portalUrl: d.portalUrl ?? null,
      sourceType: d.sourceType,
      issuingBody: d.issuingBody,
      jurisdiction: d.jurisdiction ?? null,
      accessStatus: d.accessStatus,
      sourceTier: d.sourceTier,
      contentAvailable: d.contentAvailable ?? null,
      accessNotes: d.accessNotes ?? null,
      verified: d.verified,
      lastChecked: d.verified ? new Date() : null,
    },
  })
  audit.systemAction(undefined, "source_registered", "legal_source", row.id, `تسجيل مصدر: ${d.name}`)
  return ok(serializeLegalSource(row))
}
