import { ok, ensureSeed } from "@/lib/judicial/api-helpers"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

const startedAt = Date.now()

export async function GET() {
  let database = true
  try {
    await ensureSeed()
    await db.case.count()
  } catch {
    database = false
  }
  return ok({
    status: database ? "ok" : "degraded",
    server: true,
    database,
    corpusVersion: "EJB-CORPUS-2026.08-R1",
    timestamp: new Date().toISOString(),
    uptimeMs: Date.now() - startedAt,
  })
}
