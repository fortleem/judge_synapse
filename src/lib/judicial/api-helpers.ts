// Egyptian Judicial Brain V2.1 — API response helpers

import { NextResponse } from "next/server"
import { seedJudicialCorpus } from "./seed"

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status })
}

export function fail(code: string, message: string, status = 400) {
  return NextResponse.json(
    { ok: false, error: { code, message } },
    { status }
  )
}

export function zodError(err: unknown) {
  if (err && typeof err === "object" && "issues" in err) {
    const e = err as { issues: { path: (string|number)[]; message: string }[] }
    return fail(
      "VALIDATION_ERROR",
      e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" | "),
      422
    )
  }
  return fail("INTERNAL_ERROR", "خطأ داخلي غير متوقّع", 500)
}

let seedPromise: Promise<unknown> | null = null

export async function ensureSeed() {
  if (!seedPromise) {
    seedPromise = seedJudicialCorpus().catch((e) => {
      console.error("[seed] failed", e)
      seedPromise = null
      throw e
    })
  }
  try {
    await seedPromise
  } catch {
    // swallow — routes will surface errors
  }
}
