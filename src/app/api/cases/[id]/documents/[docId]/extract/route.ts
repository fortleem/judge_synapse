import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeDocument } from "@/lib/judicial/serialize"
import { audit } from "@/lib/judicial/audit"
import { extractFromDocument } from "@/lib/judicial/extraction"

export const dynamic = "force-dynamic"

// POST: run AI extraction on a document
// Uses the Sphinx Gateway to analyze document text and extract structured data
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string; docId: string }> }) {
  await ensureSeed()
  const { id, docId } = await ctx.params

  const body = await req.json().catch(() => ({}))
  const manualText = typeof body.text === "string" ? body.text : null

  const doc = await db.storedDocument.findUnique({ where: { id: docId } })
  if (!doc) return fail("NOT_FOUND", "المستند غير موجود", 404)
  if (doc.caseId !== id) return fail("MISMATCH", "المستند لا ينتمي لهذه القضية", 422)

  // Determine text source: manual paste, or OCR text from upload
  const documentText = manualText ?? doc.ocrText
  if (!documentText || documentText.trim().length < 20) {
    // Update status to indicate OCR needed
    await db.storedDocument.update({
      where: { id: docId },
      data: {
        ocrStatus: "failed",
        notes: (doc.notes ?? "") + " | لا يوجد نص للاستخراج — الرجاء لصق النص يدوياً",
      },
    })
    return fail("NO_TEXT", "لا يوجد نص قابل للاستخراج. الرجاء لصق نص المستند يدوياً.", 422)
  }

  // Update status to processing
  await db.storedDocument.update({
    where: { id: docId },
    data: { ocrStatus: "completed", ocrText: documentText, extractionStatus: "processing" },
  })

  // Run extraction via Sphinx Gateway
  const result = await extractFromDocument(id, documentText, doc.originalName)

  // Store the extracted data as JSON
  const extractedJson = JSON.stringify(result.data)

  await db.storedDocument.update({
    where: { id: docId },
    data: {
      extractionStatus: result.ok ? "completed" : "failed",
      extractedData: extractedJson,
      extractionSummary: result.data.summary,
      verified: false, // extractions are always candidate until verified
      notes: result.error ? `${doc.notes ?? ""} | خطأ الاستخراج: ${result.error}`.trim() : doc.notes,
    },
  })

  audit.systemProposal(id, "document_extracted", "stored_document", docId,
    `استخراج آلي من ${doc.originalName} — ${result.data.facts.length} وقائع، ${result.data.timeline.length} أحداث، ${result.data.citations.length} استشهادات`)

  const updated = await db.storedDocument.findUnique({ where: { id: docId } })
  return ok({
    document: updated ? serializeDocument(updated) : null,
    extraction: result.data,
    ok: result.ok,
    modelId: result.modelId,
    provenance: result.provenance,
    error: result.error,
  })
}
