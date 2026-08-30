import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeDocument } from "@/lib/judicial/serialize"
import { audit } from "@/lib/judicial/audit"

export const dynamic = "force-dynamic"

// GET: list documents for a case
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSeed()
  const { id } = await ctx.params
  try {
    const rows = await db.storedDocument.findMany({
      where: { caseId: id },
      orderBy: { createdAt: "desc" },
    })
    return ok(rows.map(serializeDocument))
  } catch (err) {
    return fail("DOC_ERROR", err instanceof Error ? err.message : "خطأ", 500)
  }
}
