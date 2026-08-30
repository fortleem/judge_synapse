import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, ensureSeed } from "@/lib/judicial/api-helpers"
import { audit } from "@/lib/judicial/audit"
import { unlink } from "fs/promises"
import { join } from "path"

export const dynamic = "force-dynamic"

// DELETE: remove a document
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; docId: string }> }) {
  await ensureSeed()
  const { id, docId } = await ctx.params
  const doc = await db.storedDocument.findUnique({ where: { id: docId } })
  if (!doc) return fail("NOT_FOUND", "المستند غير موجود", 404)

  // Delete file from disk
  try {
    const uploadDir = process.env.VERCEL ? "/tmp/uploads" : join(process.cwd(), "public", "uploads")
    const filePath = join(uploadDir, doc.storedName)
    await unlink(filePath)
  } catch {
    // file may not exist — ignore
  }

  await db.storedDocument.delete({ where: { id: docId } })
  audit.systemAction(id, "document_deleted", "stored_document", docId, `حذف مستند: ${doc.originalName}`)
  return ok({ deleted: true })
}
