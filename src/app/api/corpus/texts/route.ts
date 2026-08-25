import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, zodError, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeLegalText } from "@/lib/judicial/serialize"
import { audit } from "@/lib/judicial/audit"
import { z } from "zod"
import crypto from "crypto"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  await ensureSeed()
  const { searchParams } = req.nextUrl
  const q = searchParams.get("q")?.trim()
  const legalDomain = searchParams.get("legalDomain")
  const documentType = searchParams.get("documentType")
  const verificationStatus = searchParams.get("verificationStatus")
  const temporalStatus = searchParams.get("temporalStatus")
  const sourceId = searchParams.get("sourceId")

  const where: Record<string, unknown> = {}
  if (legalDomain) where.legalDomain = legalDomain
  if (documentType) where.documentType = documentType
  if (verificationStatus) where.verificationStatus = verificationStatus
  if (temporalStatus) where.temporalStatus = temporalStatus
  if (sourceId) where.sourceId = sourceId
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { citation: { contains: q } },
      { exactText: { contains: q } },
    ]
  }

  const rows = await db.legalText.findMany({
    where,
    orderBy: { effectiveFrom: "desc" },
    take: 100,
    include: { source: true },
  })
  return ok(rows.map((r) => ({ ...serializeLegalText(r), source: r.source ? { name: r.source.name, portalUrl: r.source.portalUrl } : null })))
}

const CreateTextSchema = z.object({
  sourceId: z.string().min(1),
  title: z.string().min(1),
  citation: z.string().min(1),
  documentType: z.string().min(1),
  legalDomain: z.string().nullable().optional(),
  legalForce: z.string().default("statute"),
  effectiveFrom: z.string(),
  effectiveTo: z.string().nullable().optional(),
  versionLabel: z.string().default(""),
  publicationDate: z.string().nullable().optional(),
  officialJournalRef: z.string().nullable().optional(),
  verificationStatus: z.string().default("verified"),
  temporalStatus: z.string().default("current"),
  exactText: z.string().min(1),
  sourceUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export async function POST(req: NextRequest) {
  await ensureSeed()
  const body = await req.json().catch(() => null)
  const parsed = CreateTextSchema.safeParse(body)
  if (!parsed.success) return zodError(parsed.error)
  const d = parsed.data
  const sourceHash = `sha256:${crypto.createHash("sha256").update(d.exactText).digest("hex").slice(0, 24)}`
  const row = await db.legalText.create({
    data: {
      sourceId: d.sourceId,
      title: d.title,
      citation: d.citation,
      documentType: d.documentType,
      legalDomain: d.legalDomain ?? null,
      legalForce: d.legalForce,
      effectiveFrom: new Date(d.effectiveFrom),
      effectiveTo: d.effectiveTo ? new Date(d.effectiveTo) : null,
      versionLabel: d.versionLabel || `نسخة ${d.effectiveFrom.slice(0, 10)}`,
      sourceHash,
      publicationDate: d.publicationDate ? new Date(d.publicationDate) : null,
      officialJournalRef: d.officialJournalRef ?? null,
      verificationStatus: d.verificationStatus,
      temporalStatus: d.temporalStatus,
      exactText: d.exactText,
      sourceUrl: d.sourceUrl ?? null,
      notes: d.notes ?? null,
    },
  })
  audit.systemAction(undefined, "legal_text_registered", "legal_text", row.id, `تسجيل نص قانوني: ${d.citation}`)
  return ok(serializeLegalText(row))
}
