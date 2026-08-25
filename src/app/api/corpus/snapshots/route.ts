import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, fail, zodError, ensureSeed } from "@/lib/judicial/api-helpers"
import { serializeCorpusSnapshot } from "@/lib/judicial/serialize"
import { audit } from "@/lib/judicial/audit"
import { z } from "zod"
import crypto from "crypto"

export const dynamic = "force-dynamic"

export async function GET() {
  await ensureSeed()
  const rows = await db.corpusSnapshot.findMany({ orderBy: { createdAt: "desc" } })
  return ok(rows.map(serializeCorpusSnapshot))
}

const CreateSnapshotSchema = z.object({
  versionLabel: z.string().min(1),
  effectiveFrom: z.string(),
  effectiveTo: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export async function POST(req: NextRequest) {
  await ensureSeed()
  const body = await req.json().catch(() => null)
  const parsed = CreateSnapshotSchema.safeParse(body)
  if (!parsed.success) return zodError(parsed.error)
  const d = parsed.data

  // Build manifest from current sources + texts
  const sources = await db.legalSource.findMany({ select: { id: true, name: true, sourceTier: true, accessStatus: true } })
  const texts = await db.legalText.count()
  const manifest = JSON.stringify({ sources: sources.length, texts, sourceList: sources })
  const hash = `sha256:${crypto.createHash("sha256").update(manifest + d.versionLabel).digest("hex").slice(0, 32)}`

  const row = await db.corpusSnapshot.create({
    data: {
      versionLabel: d.versionLabel,
      sourceManifest: manifest,
      hash,
      signature: `ejb-sig-${hash.slice(-16)}`,
      approvalStatus: "published",
      effectiveFrom: new Date(d.effectiveFrom),
      effectiveTo: d.effectiveTo ? new Date(d.effectiveTo) : null,
      textCount: texts,
      sourceCount: sources.length,
      notes: d.notes ?? null,
    },
  })
  audit.systemAction(undefined, "snapshot_published", "corpus_snapshot", row.id, `نشر لقطة موقّعة: ${d.versionLabel}`)
  return ok(serializeCorpusSnapshot(row))
}
