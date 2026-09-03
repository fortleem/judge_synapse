import { NextRequest } from "next/server"
import { ok, ensureSeed } from "@/lib/judicial/api-helpers"
import { getRecentActivity } from "@/lib/judicial/activity-feed"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  await ensureSeed()
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 20)
  const activities = await getRecentActivity(Math.min(limit, 100))
  return ok(activities)
}
