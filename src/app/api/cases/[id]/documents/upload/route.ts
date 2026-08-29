import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeDocument } from "@/lib/judicial/serialize"
import { audit } from "@/lib/judicial/audit"
import { extractTextFromFile } from "@/lib/judicial/extraction"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import crypto from "crypto"

export const dynamic = "force-dynamic"

// POST: upload a document (multipart/form-data)
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSeed()
  const { id } = await ctx.params

  const formData = await req.formData().catch(() => null)
  if (!formData) return fail("VALIDATION_ERROR", "بيانات النموذج غير صحيحة", 422)

  const file = formData.get("file")
  const uploadedBy = (formData.get("uploadedBy") as string) || "judge"
  const sourceType = (formData.get("sourceType") as string) || "case_file"

  if (!file || !(file instanceof File)) {
    return fail("VALIDATION_ERROR", "الملف مطلوب", 422)
  }

  const maxSize = 20 * 1024 * 1024
  if (file.size > maxSize) {
    return fail("FILE_TOO_LARGE", "حجم الملف يتجاوز 20 ميجابايت", 422)
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split(".").pop() ?? "bin"
  const storedName = `${crypto.randomUUID()}.${ext}`
  const uploadDir = join(process.cwd(), "public", "uploads")
  const filePath = join(uploadDir, storedName)

  try {
    await mkdir(uploadDir, { recursive: true })
  } catch {
    // dir may already exist
  }

  try {
    await writeFile(filePath, buffer)
  } catch (err) {
    return fail("UPLOAD_FAILED", `فشل حفظ الملف: ${err instanceof Error ? err.message : "خطأ"}`, 500)
  }

  const extraction = extractTextFromFile(buffer, file.type, file.name)
  const ocrStatus = extraction.needsOcr ? "pending" : "completed"

  const doc = await db.storedDocument.create({
    data: {
      caseId: id,
      originalName: file.name,
      storedName,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
      uploadedBy,
      sourceType,
      ocrStatus,
      ocrText: extraction.text ?? null,
      ocrConfidence: extraction.text ? 1.0 : null,
      extractionStatus: "pending",
      notes: extraction.note ?? null,
    },
  })

  audit.systemAction(id, "document_uploaded", "stored_document", doc.id, `رفع مستند: ${file.name} (${uploadedBy})`)

  return ok(serializeDocument(doc))
}
