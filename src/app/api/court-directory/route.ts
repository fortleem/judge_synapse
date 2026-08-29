import { ok } from "@/lib/judicial/api-helpers"
import { getAllCourts, searchCourts, GOVERNORATES, APPEAL_COURTS, SPECIAL_COURTS, ECONOMIC_COURT_CITIES, CIRCUIT_TYPES } from "@/lib/judicial/court-directory"
import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")
  if (q) {
    return ok(searchCourts(q))
  }
  return ok({
    courts: getAllCourts(),
    governorates: GOVERNORATES,
    appealCourts: APPEAL_COURTS,
    specialCourts: SPECIAL_COURTS,
    economicCourtCities: ECONOMIC_COURT_CITIES,
    circuitTypes: CIRCUIT_TYPES,
  })
}
