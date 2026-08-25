import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, zodError, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeSetting } from "@/lib/judicial/serialize"
import { z } from "zod"

export const dynamic = "force-dynamic"

export async function GET() {
  await ensureSeed()
  const rows = await db.setting.findMany({ orderBy: [{ category: "asc" }, { key: "asc" }] })
  return ok(rows.map(serializeSetting))
}

const UpsertSchema = z.object({
  category: z.string().min(1),
  key: z.string().min(1),
  value: z.string(),
})

export async function POST(req: NextRequest) {
  await ensureSeed()
  const body = await req.json().catch(() => null)
  const parsed = UpsertSchema.safeParse(body)
  if (!parsed.success) return zodError(parsed.error)
  const { category, key, value } = parsed.data
  const row = await db.setting.upsert({
    where: { category_key: { category, key } },
    update: { value },
    create: { category, key, value },
  })
  return ok(serializeSetting(row))
}
