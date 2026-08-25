import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, ensureSeed } from "@/lib/judicial/api-helpers"
import { audit } from "@/lib/judicial/audit"
import { z } from "zod"

export const dynamic = "force-dynamic"

const PromoteSchema = z.object({
  items: z.array(z.object({
    type: z.enum(["fact", "timeline", "citation", "evidence"]),
    data: z.record(z.string(), z.unknown()),
  })),
})

// POST: promote candidate extractions to actual case entities
// Each promotion is logged — the judge/rapporteur explicitly accepts extracted items
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string; docId: string }> }) {
  await ensureSeed()
  const { id, docId } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = PromoteSchema.safeParse(body)
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات غير صحيحة", 422)

  const doc = await db.storedDocument.findUnique({ where: { id: docId } })
  if (!doc) return fail("NOT_FOUND", "المستند غير موجود", 404)

  const promoted: string[] = []

  for (const item of parsed.data.items) {
    try {
      if (item.type === "fact") {
        const d = item.data
        const fact = await db.fact.create({
          data: {
            caseId: id,
            statement: String(d.statement ?? ""),
            status: String(d.status ?? "alleged"),
            materiality: String(d.materiality ?? "supporting"),
            party: d.party ? String(d.party) : null,
            sourceNote: `مستخرج آليًا من: ${doc.originalName}`,
            aiExtracted: true,
          },
        })
        promoted.push(`fact:${fact.id}`)
        audit.systemProposal(id, "fact_promoted_from_extraction", "fact", fact.id,
          `ترقية واقعة مستخرجة آليًا من ${doc.originalName}`)
      } else if (item.type === "timeline") {
        const d = item.data
        const eventDateStr = String(d.eventDate ?? new Date().toISOString())
        let eventDate: Date
        try {
          eventDate = new Date(eventDateStr)
          if (isNaN(eventDate.getTime())) eventDate = new Date()
        } catch {
          eventDate = new Date()
        }
        const event = await db.timelineEvent.create({
          data: {
            caseId: id,
            title: String(d.title ?? "حدث"),
            description: d.description ? String(d.description) : null,
            eventDate,
            eventType: String(d.eventType ?? "other"),
            legalRegime: d.legalRegime ? String(d.legalRegime) : null,
          },
        })
        promoted.push(`timeline:${event.id}`)
        audit.systemProposal(id, "timeline_promoted_from_extraction", "timeline_event", event.id,
          `ترقية حدث زمني مستخرج آليًا من ${doc.originalName}`)
      } else if (item.type === "citation") {
        const d = item.data
        const authority = await db.authority.create({
          data: {
            caseId: id,
            title: String(d.title ?? d.citation ?? "سلطة مستخرجة"),
            citation: String(d.citation ?? ""),
            stance: "neutral",
            legalForce: "court_judgment",
            authorityStatus: "active",
            temporalStatus: "current",
            sourceTier: 3,
            verificationStatus: "unverified", // extracted citations start unverified
            relationNote: `مستخرج آليًا من: ${doc.originalName} — يحتاج تحقق`,
          },
        })
        promoted.push(`citation:${authority.id}`)
        audit.systemProposal(id, "citation_promoted_from_extraction", "authority", authority.id,
          `ترقية استشهاد مستخرج آليًا من ${doc.originalName} — غير متحقَّق منه`)
      } else if (item.type === "evidence") {
        const d = item.data
        const evidence = await db.evidence.create({
          data: {
            caseId: id,
            title: String(d.title ?? "دليل مستخرج"),
            type: "document",
            evidenceType: String(d.evidenceType ?? "other"),
            relevance: d.relevance ? String(d.relevance) : null,
            admissibility: "pending_review",
            judicialTreatment: "unexamined",
            origin: `مستخرج آليًا من: ${doc.originalName}`,
          },
        })
        promoted.push(`evidence:${evidence.id}`)
        audit.systemProposal(id, "evidence_promoted_from_extraction", "evidence", evidence.id,
          `ترقية دليل مستخرج آليًا من ${doc.originalName}`)
      }
    } catch (err) {
      console.error("[promote] failed for item:", item, err)
    }
  }

  // Mark document as verified if any items promoted
  if (promoted.length > 0) {
    await db.storedDocument.update({
      where: { id: docId },
      data: { verified: true },
    })
  }

  return ok({ promoted, count: promoted.length })
}
