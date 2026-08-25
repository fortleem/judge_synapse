import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, zodError, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeImportJob } from "@/lib/judicial/serialize"
import { audit } from "@/lib/judicial/audit"
import { z } from "zod"

export const dynamic = "force-dynamic"

export async function GET() {
  await ensureSeed()
  const rows = await db.importJob.findMany({ orderBy: [{ priority: "asc" }, { createdAt: "desc" }] })
  return ok(rows.map(serializeImportJob))
}

const CreateJobSchema = z.object({
  sourceName: z.string().min(1),
  sourceUrl: z.string().nullable().optional(),
  sourceType: z.string().min(1),
  priority: z.number().min(1).max(10).default(5),
  requiresAuth: z.boolean().default(false),
  authType: z.string().nullable().optional(),
  contentScope: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export async function POST(req: NextRequest) {
  await ensureSeed()
  const body = await req.json().catch(() => null)
  const parsed = CreateJobSchema.safeParse(body)
  if (!parsed.success) return zodError(parsed.error)
  const d = parsed.data
  const row = await db.importJob.create({
    data: {
      sourceName: d.sourceName,
      sourceUrl: d.sourceUrl ?? null,
      sourceType: d.sourceType,
      status: "QUEUED",
      priority: d.priority,
      requiresAuth: d.requiresAuth,
      authType: d.authType ?? null,
      contentScope: d.contentScope ?? null,
      notes: d.notes ?? null,
    },
  })
  audit.systemAction(undefined, "import_job_queued", "import_job", row.id, `إضافة طابور استيراد: ${d.sourceName}`)
  return ok(serializeImportJob(row))
}
