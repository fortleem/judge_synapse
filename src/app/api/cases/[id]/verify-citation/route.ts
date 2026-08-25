import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeCitationVerification } from "@/lib/judicial/serialize"
import { audit } from "@/lib/judicial/audit"
import { z } from "zod"

export const dynamic = "force-dynamic"

// POST: verify a citation against the canonical legal corpus (§64)
// A failed citation becomes BLOCKED — never silently corrected
const VerifySchema = z.object({
  citation: z.string().min(2),
  claimedSource: z.string().nullable().optional(),
})

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSeed()
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = VerifySchema.safeParse(body)
  if (!parsed.success) return fail("VALIDATION_ERROR", "استشهاد غير صحيح", 422)

  const citation = parsed.data.citation.trim()
  const claimedSource = parsed.data.claimedSource?.trim() ?? null

  // Search the canonical legal texts by citation (exact or contains)
  const matches = await db.legalText.findMany({
    where: {
      OR: [
        { citation: { contains: citation } },
        { citation: citation },
      ],
    },
    take: 5,
    include: { source: true },
  })

  let verificationStatus = "unverified"
  let canonicalMatch: string | null = null
  let sourceHash: string | null = null
  let legalTextId: string | null = null
  const notes: string[] = []

  if (matches.length > 0) {
    const best = matches[0]
    legalTextId = best.id
    sourceHash = best.sourceHash
    canonicalMatch = best.citation

    if (best.verificationStatus === "verified" && best.temporalStatus === "current") {
      verificationStatus = "verified"
      notes.push(`مطابقة كاملة — النص متحقَّق منه وساري. المصدر: ${best.source?.name ?? "غير محدد"}`)
    } else if (best.verificationStatus === "verified" && best.temporalStatus === "historical") {
      verificationStatus = "partially_verified"
      notes.push("مطابقة جزئية — النص متحقَّق منه لكنه تاريخي (قد يكون منسوخاً). يجب التحقق من النسخة السارية.")
    } else if (best.verificationStatus === "partially_verified") {
      verificationStatus = "partially_verified"
      notes.push("مطابقة جزئية — النص متحقَّق منه جزئياً. يلزم مراجعة إضافية.")
    } else {
      verificationStatus = "blocked"
      notes.push("محظور — النص موجود لكن غير متحقَّق منه. لا يجوز الاعتماد عليه في الوضع القضائي.")
    }

    if (claimedSource && best.source) {
      if (best.source.name.includes(claimedSource) || claimedSource.includes(best.source.name)) {
        notes.push("المصدر المُدّعى يطابق المصدر المسجَّل.")
      } else {
        notes.push(`⚠ المصدر المُدّعى («${claimedSource}») لا يطابق المصدر المسجَّل («${best.source.name}»).`)
        if (verificationStatus === "verified") verificationStatus = "partially_verified"
      }
    }
  } else {
    verificationStatus = "blocked"
    notes.push("محظور — لم يُعثر على الاستشهاد في السجل القانوني الموثَّق. لا يجوز استخدامه حتى يُتحقَّق منه.")
    notes.push("هذا ليس فشلاً للنظام بل نتيجة ناجحة — منع استشهاد غير موثَّق من الدخول في التسبيب القضائي.")
  }

  const row = await db.citationVerification.create({
    data: {
      caseId: id,
      citation,
      claimedSource,
      verificationStatus,
      canonicalMatch,
      sourceHash,
      legalTextId,
      notes: notes.join(" | "),
    },
  })

  audit.systemAction(id, `citation_${verificationStatus}`, "citation_verification", row.id, `تحقق استشهاد: ${citation} → ${verificationStatus}`)
  return ok(serializeCitationVerification(row))
}
