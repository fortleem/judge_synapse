// Egyptian Judicial Brain V2.1 — Document Extraction Engine
// Takes document text (from OCR or direct text) and uses the Sphinx Gateway
// to extract structured legal data: facts, timeline events, citations, parties, evidence.
// All extractions are "candidate" — marked aiExtracted=true, need human verification (§60).

import { invokeSphinx } from "./sphinx-gateway"

export interface ExtractedData {
  facts: Array<{
    statement: string
    status: string // default: "alleged" — needs verification
    materiality: string
    party: string | null
  }>
  timeline: Array<{
    title: string
    eventDate: string // ISO date string
    eventType: string
    description: string | null
    legalRegime: string | null
  }>
  citations: Array<{
    citation: string
    title: string
    legalDomain: string | null
    stance: string
  }>
  parties: string[]
  evidence: Array<{
    title: string
    evidenceType: string
    relevance: string | null
  }>
  summary: string
}

const EMPTY_EXTRACTION: ExtractedData = {
  facts: [],
  timeline: [],
  citations: [],
  parties: [],
  evidence: [],
  summary: "",
}

// ─── Main extraction function ──────────────────────────────────
// Sends document text to the Sphinx Gateway with a structured extraction prompt.
// Returns candidate data — all marked for human verification.
export async function extractFromDocument(
  caseId: string,
  documentText: string,
  documentName: string,
): Promise<{ data: ExtractedData; ok: boolean; error?: string; modelId?: string; provenance?: string }> {
  if (!documentText || documentText.trim().length < 20) {
    return {
      data: { ...EMPTY_EXTRACTION, summary: "النص المستخرج قصير جداً — لا يمكن التحليل الموثوق" },
      ok: false,
      error: "نص قصير جداً",
    }
  }

  // Truncate if too long (model context limit)
  const maxChars = 8000
  const truncatedText = documentText.length > maxChars
    ? documentText.slice(0, maxChars) + "\n\n[... النص مقطوع — المستند طويل ...]"
    : documentText

  const extractionPrompt = `أنت مساعد قضائي مصري متخصص في استخراج المعلومات القانونية من المستندات.
حلِّل المستند التالي واستخرج منه البيانات المنظَّمة التالية بدقة.

قواعد صارمة:
1. استخرج فقط ما هو مذكور صراحة في النص — لا تخترع أي شيء
2. إذا لم تجد معلومة في فئة معينة، أرجع مصفوفة فارغة
3. كل واقعة مستخرجة تُعدّ "مدّعى" (alleged) حتى يتحقق منها القاضي
4. كل استشهاد مستخرج يُعدّ "محايد" (neutral) حتى يُتحقَّق منه
5. التواريخ بصيغة ISO (YYYY-MM-DD) إذا أمكن، أو اتركها نصاً إذا كانت غامضة

المستند: "${documentName}"

نص المستند:
---
${truncatedText}
---

أرجع النتيجة بصيغة JSON صالحة فقط (بدون نص إضافي قبل أو بعد الـ JSON):
{
  "facts": [
    { "statement": "نص الواقعة كما وردت", "status": "alleged", "materiality": "supporting", "party": "المدّعي|المدّعى عليه|مشترك|null" }
  ],
  "timeline": [
    { "title": "عنوان الحدث", "eventDate": "YYYY-MM-DD أو نص", "eventType": "contract|transaction|breach|filing|notice|hearing|judgment|appeal|other", "description": "وصف", "legalRegime": "null أو النظام القانوني" }
  ],
  "citations": [
    { "citation": "رقم المادة أو الاستشهاد", "title": "عنوان النص", "legalDomain": "مدني|تجاري|جنائي|إداري|دستوري|null", "stance": "neutral" }
  ],
  "parties": ["اسم الطرف الأول", "اسم الطرف الثاني"],
  "evidence": [
    { "title": "عنوان الدليل", "evidenceType": "contract|email|message|pdf|image|official_record|other", "relevance": "صلته بالقضية" }
  ],
  "summary": "ملخص موجز للمستند في 2-3 جمل"
}`

  try {
    const result = await invokeSphinx({
      caseId,
      task: "extraction",
      prompt: extractionPrompt,
      maxTokens: 2000,
    })

    if (!result.ok || !result.content) {
      return {
        data: { ...EMPTY_EXTRACTION, summary: `فشل الاستخراج: ${result.error ?? result.policyNote}` },
        ok: false,
        error: result.error ?? result.policyNote,
        modelId: result.modelId,
        provenance: result.provenance,
      }
    }

    // Parse JSON from the model's response
    const parsed = parseJsonFromResponse(result.content)

    if (!parsed) {
      // If JSON parsing fails, at least return the raw content as a summary
      return {
        data: {
          ...EMPTY_EXTRACTION,
          summary: result.content.slice(0, 500) + (result.content.length > 500 ? "..." : ""),
        },
        ok: false,
        error: "فشل تحليل JSON من الاستجابة",
        modelId: result.modelId,
        provenance: result.provenance,
      }
    }

    // Validate and normalize the parsed data
    const data: ExtractedData = {
      facts: Array.isArray(parsed.facts) ? parsed.facts.map(normalizeFact).filter((f): f is ExtractedData["facts"][0] => f !== null) : [],
      timeline: Array.isArray(parsed.timeline) ? parsed.timeline.map(normalizeTimelineEvent).filter((t): t is ExtractedData["timeline"][0] => t !== null) : [],
      citations: Array.isArray(parsed.citations) ? parsed.citations.map(normalizeCitation).filter((c): c is ExtractedData["citations"][0] => c !== null) : [],
      parties: Array.isArray(parsed.parties) ? parsed.parties.filter((p: unknown) => typeof p === "string") : [],
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence.map(normalizeEvidence).filter((e): e is ExtractedData["evidence"][0] => e !== null) : [],
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
    }

    return {
      data,
      ok: true,
      modelId: result.modelId,
      provenance: result.provenance,
    }
  } catch (err) {
    return {
      data: { ...EMPTY_EXTRACTION, summary: `خطأ في الاستخراج: ${err instanceof Error ? err.message : String(err)}` },
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── JSON parser — handles model responses with extra text ──────
function parseJsonFromResponse(content: string): Record<string, unknown> | null {
  // Try direct parse first
  try {
    return JSON.parse(content)
  } catch {
    // Try to extract JSON from markdown code blocks or surrounding text
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch {
        return null
      }
    }
    return null
  }
}

// ─── Normalizers ────────────────────────────────────────────────
function normalizeFact(f: unknown): ExtractedData["facts"][0] | null {
  if (!f || typeof f !== "object") return null
  const obj = f as Record<string, unknown>
  const statement = obj.statement
  if (typeof statement !== "string" || statement.trim().length < 3) return null
  return {
    statement: statement.trim(),
    status: typeof obj.status === "string" ? obj.status : "alleged",
    materiality: typeof obj.materiality === "string" ? obj.materiality : "supporting",
    party: typeof obj.party === "string" && obj.party !== "null" ? obj.party : null,
  }
}

function normalizeTimelineEvent(t: unknown): ExtractedData["timeline"][0] | null {
  if (!t || typeof t !== "object") return null
  const obj = t as Record<string, unknown>
  const title = obj.title
  if (typeof title !== "string" || title.trim().length < 2) return null
  const eventDate = typeof obj.eventDate === "string" ? obj.eventDate : new Date().toISOString()
  return {
    title: title.trim(),
    eventDate,
    eventType: typeof obj.eventType === "string" ? obj.eventType : "other",
    description: typeof obj.description === "string" && obj.description !== "null" ? obj.description : null,
    legalRegime: typeof obj.legalRegime === "string" && obj.legalRegime !== "null" ? obj.legalRegime : null,
  }
}

function normalizeCitation(c: unknown): ExtractedData["citations"][0] | null {
  if (!c || typeof c !== "object") return null
  const obj = c as Record<string, unknown>
  const citation = obj.citation
  if (typeof citation !== "string" || citation.trim().length < 2) return null
  return {
    citation: citation.trim(),
    title: typeof obj.title === "string" ? obj.title : citation,
    legalDomain: typeof obj.legalDomain === "string" && obj.legalDomain !== "null" ? obj.legalDomain : null,
    stance: "neutral", // always neutral until verified
  }
}

function normalizeEvidence(e: unknown): ExtractedData["evidence"][0] | null {
  if (!e || typeof e !== "object") return null
  const obj = e as Record<string, unknown>
  const title = obj.title
  if (typeof title !== "string" || title.trim().length < 2) return null
  return {
    title: title.trim(),
    evidenceType: typeof obj.evidenceType === "string" ? obj.evidenceType : "other",
    relevance: typeof obj.relevance === "string" && obj.relevance !== "null" ? obj.relevance : null,
  }
}

// ─── Text extraction from file ──────────────────────────────────
// For text files: read directly. For PDFs: extract text. For images: note OCR needed.
export function extractTextFromFile(content: Buffer, mimeType: string, originalName: string): {
  text: string | null
  needsOcr: boolean
  note?: string
} {
  // Text-based files
  if (mimeType.startsWith("text/") || mimeType === "application/json" || originalName.match(/\.(txt|json|csv|md)$/i)) {
    try {
      return { text: content.toString("utf-8"), needsOcr: false }
    } catch {
      return { text: null, needsOcr: true, note: "فشل قراءة الملف النصي" }
    }
  }

  // PDF — try basic text extraction (pdf-parse not installed, use heuristic)
  if (mimeType === "application/pdf" || originalName.match(/\.pdf$/i)) {
    try {
      // Try to extract readable text from PDF buffer (basic approach)
      const text = content.toString("latin1")
      // Extract text between PDF stream markers — basic heuristic
      const textMatches = text.match(/\(([^)]{2,})\)/g)
      if (textMatches && textMatches.length > 0) {
        const extracted = textMatches
          .map((m) => m.slice(1, -1))
          .filter((t) => /[a-zA-Z\u0600-\u06FF]/.test(t))
          .join(" ")
        if (extracted.length > 50) {
          return { text: extracted, needsOcr: false, note: "استخراج نصي أساسي من PDF — قد يكون غير مكتمل" }
        }
      }
      return {
        text: null,
        needsOcr: true,
        note: "PDF ممسوح ضوئياً — يحتاج OCR. الرجاء لصق النص يدوياً أو استخدام ملف نصي.",
      }
    } catch {
      return { text: null, needsOcr: true, note: "فشل استخراج النص من PDF" }
    }
  }

  // Images — need OCR
  if (mimeType.startsWith("image/")) {
    return {
      text: null,
      needsOcr: true,
      note: "ملف صورة — يحتاج OCR. الرجاء لصق النص يدوياً أو رفع ملف نصي.",
    }
  }

  // Word documents — basic attempt
  if (mimeType.includes("word") || originalName.match(/\.(doc|docx)$/i)) {
    return {
      text: null,
      needsOcr: true,
      note: "ملف Word — الرجاء لصق النص يدوياً أو تحويله إلى نص/PDF قابل للقراءة.",
    }
  }

  return { text: null, needsOcr: true, note: "نوع ملف غير مدعوم للاستخراج المباشر" }
}
