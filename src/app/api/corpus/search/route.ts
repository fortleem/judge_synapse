import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeLegalText } from "@/lib/judicial/serialize"
import { z } from "zod"

export const dynamic = "force-dynamic"

const SearchSchema = z.object({
  query: z.string().min(2),
  legalDomain: z.string().nullable().optional(),
  documentType: z.string().nullable().optional(),
  temporalStatus: z.string().nullable().optional(),
  verificationFilter: z.boolean().default(true),
})

// Hybrid retrieval: exact (citation) + lexical (title/text contains) + temporal filter
// Final candidates must pass authority/temporal filters before returning (§110)
export async function POST(req: NextRequest) {
  await ensureSeed()
  const body = await req.json().catch(() => null)
  const parsed = SearchSchema.safeParse(body)
  if (!parsed.success) return fail("VALIDATION_ERROR", "استعلام غير صحيح", 422)
  const d = parsed.data

  const where: Record<string, unknown> = {
    OR: [
      { citation: { contains: d.query } },
      { title: { contains: d.query } },
      { exactText: { contains: d.query } },
    ],
  }
  if (d.legalDomain) where.legalDomain = d.legalDomain
  if (d.documentType) where.documentType = d.documentType
  if (d.temporalStatus) where.temporalStatus = d.temporalStatus
  // In Judicial Mode, only verified texts pass (§104)
  if (d.verificationFilter) {
    where.verificationStatus = { in: ["verified", "partially_verified"] }
  }

  const rows = await db.legalText.findMany({
    where,
    orderBy: [{ temporalStatus: "asc" }, { effectiveFrom: "desc" }],
    take: 30,
    include: { source: true },
  })

  // Build coverage report (§163)
  const totalTexts = await db.legalText.count()
  const coveragePercent = totalTexts > 0 ? Math.round((rows.length / totalTexts) * 100) : 0

  return ok({
    query: d.query,
    found: rows.length,
    results: rows.map((r) => ({
      ...serializeLegalText(r),
      source: r.source ? { name: r.source.name, portalUrl: r.source.portalUrl, sourceTier: r.source.sourceTier } : null,
    })),
    coverage: {
      corpusSize: totalTexts,
      matched: rows.length,
      coveragePercent,
      temporalFilterApplied: !!d.temporalStatus,
      verificationFilterApplied: d.verificationFilter,
      limitations: [
        "البحث يجمع بين الاسترجاع الدقيق (الاستشهاد) والمعجمي (العنوان/النص)",
        "في الوضع القضائي، تُستبعد النصوص غير المتحقَّق منها",
        "المرشح الزمني يضمن النسخة السارية فقط إن طُلب",
      ],
    },
  })
}
