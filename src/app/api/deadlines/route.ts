import { NextRequest } from "next/server"
import { ok, ensureSeed } from "@/lib/judicial/api-helpers"
import { LEGAL_DEADLINES } from "@/lib/judicial/deadlines"

export const dynamic = "force-dynamic"

// GET: list all available legal deadline definitions
export async function GET() {
  await ensureSeed()
  return ok(LEGAL_DEADLINES)
}
