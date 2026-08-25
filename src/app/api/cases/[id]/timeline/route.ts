import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, zodError, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeTimeline } from "@/lib/judicial/serialize"
import { CreateTimelineEventInputSchema } from "@/lib/judicial/schemas"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await ensureSeed()
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = CreateTimelineEventInputSchema.safeParse(body)
  if (!parsed.success) return zodError(parsed.error)
  const data = parsed.data
  const row = await db.timelineEvent.create({
    data: {
      caseId: id,
      title: data.title,
      description: data.description ?? null,
      eventDate: new Date(data.eventDate),
      eventType: data.eventType,
      legalRegime: data.legalRegime ?? null,
    },
  })
  return ok(serializeTimeline(row))
}
