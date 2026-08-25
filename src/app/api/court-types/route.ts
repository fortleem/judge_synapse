import { ok } from "@/lib/judicial/api-helpers"
import { COURT_TYPES } from "@/lib/judicial/court-types"

export const dynamic = "force-dynamic"

export async function GET() {
  return ok(COURT_TYPES)
}
