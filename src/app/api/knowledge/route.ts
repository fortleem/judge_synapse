import { NextRequest } from "next/server"
import { ok, ensureSeed } from "@/lib/judicial/api-helpers"
import { orchestrateKnowledge, getKnowledgeCoverage } from "@/lib/judicial/orchestrator"

export const dynamic = "force-dynamic"

// GET: knowledge coverage report
export async function GET() {
  await ensureSeed()
  const coverage = await getKnowledgeCoverage()
  return ok(coverage)
}

// POST: trigger knowledge expansion orchestration
export async function POST(req: NextRequest) {
  await ensureSeed()
  const result = await orchestrateKnowledge()
  return ok(result)
}
