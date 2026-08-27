// Egyptian Judicial Smart V2.1 — Downloaded Laws Importer
// Imports the 99 verified articles from downloaded-laws.json into the legal corpus
// Each article gets full provenance: official journal ref, law number/year, source URL

import { db } from "@/lib/db"
import crypto from "crypto"
import { readFileSync } from "fs"

interface DownloadedArticle {
  articleNumber: string
  title: string
  citation: string
  exactText: string
  notes: string
}

interface DownloadedLaw {
  lawName: string
  lawNameEn: string
  lawNumber: string
  lawYear: string
  officialJournalRef: string
  domain: string
  sourceUrl: string
  articles: DownloadedArticle[]
}

function hash(text: string): string {
  return `sha256:${crypto.createHash("sha256").update(text).digest("hex").slice(0, 24)}`
}

export async function importDownloadedLaws() {
  // Find or create the internal verified source
  let internalSource = await db.legalSource.findFirst({
    where: { nameEn: "EJB Internal Verified Registry" },
  })

  if (!internalSource) {
    internalSource = await db.legalSource.create({
      data: {
        name: "السجل الداخلي الموثَّق — المنصة القضائية الذكية",
        nameEn: "EJB Internal Verified Registry",
        sourceType: "statute",
        issuingBody: "المنصة القضائية الذكية — فريق المعرفة القانونية",
        jurisdiction: "داخلي — نصوص موثَّقة من المصادر الرسمية",
        accessStatus: "VERIFIED",
        sourceTier: 3,
        contentAvailable: "نصوص دستورية وتشريعية محقَّق منها من المصادر الرسمية المُسجَّلة",
        accessNotes: "سجل داخلي موثَّق — كل نص يحمل بصمة مصدر ومرجع الجريدة الرسمية",
        verified: true,
        lastChecked: new Date(),
      },
    })
  }

  // Load downloaded laws JSON
  let downloaded: { laws: DownloadedLaw[] }
  try {
    const raw = readFileSync("/home/z/my-project/downloaded-laws.json", "utf-8")
    downloaded = JSON.parse(raw)
  } catch {
    return { imported: 0, skipped: 0, total: 0, error: "لم يُعثر على ملف القوانين المنزّلة" }
  }

  let imported = 0
  let skipped = 0

  for (const law of downloaded.laws) {
    // Determine effective date from law year
    const effectiveFrom = new Date(`${law.lawYear}-01-01`)

    for (const article of law.articles) {
      // Skip if citation already exists
      const existing = await db.legalText.findUnique({ where: { citation: article.citation } })
      if (existing) {
        skipped++
        continue
      }

      try {
        await db.legalText.create({
          data: {
            sourceId: internalSource.id,
            title: article.title,
            citation: article.citation,
            documentType: "statute_article",
            legalDomain: law.domain,
            legalForce: "statute",
            effectiveFrom,
            effectiveTo: null,
            versionLabel: `قانون ${law.lawNumber} لسنة ${law.lawYear}`,
            sourceHash: hash(article.exactText),
            retrievalTimestamp: new Date(),
            publicationDate: effectiveFrom,
            officialJournalRef: law.officialJournalRef,
            verificationStatus: "verified",
            temporalStatus: "current",
            exactText: article.exactText,
            sourceUrl: law.sourceUrl ?? null,
            notes: `${article.notes ?? ""} | المصدر: ${law.lawName} (${law.lawNumber}/${law.lawYear})`.trim(),
          },
        })
        imported++
      } catch (e) {
        console.error("[import] failed for", article.citation, e)
      }
    }
  }

  // Update corpus snapshot textCount
  const snapshot = await db.corpusSnapshot.findFirst({ where: { versionLabel: "EJB-CORPUS-2026.08-R1" } })
  if (snapshot) {
    const totalTexts = await db.legalText.count()
    await db.corpusSnapshot.update({
      where: { id: snapshot.id },
      data: { textCount: totalTexts },
    })
  }

  return {
    imported,
    skipped,
    total: imported + skipped,
    laws: downloaded.laws.length,
  }
}
