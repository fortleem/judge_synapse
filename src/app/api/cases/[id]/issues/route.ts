import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, zodError, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeIssue } from "@/lib/judicial/serialize"
import { CreateIssueInputSchema } from "@/lib/judicial/schemas"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSeed()
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = CreateIssueInputSchema.safeParse(body)
  if (!parsed.success) return zodError(parsed.error)
  const data = parsed.data
  const count = await db.legalIssue.count({ where: { caseId: id } })
  const row = await db.legalIssue.create({
    data: {
      caseId: id,
      title: data.title,
      description: data.description ?? null,
      issueType: data.issueType,
      status: data.status,
      parentId: data.parentId ?? null,
      sortOrder: count,
    },
  })
  return ok(serializeIssue(row))
}
