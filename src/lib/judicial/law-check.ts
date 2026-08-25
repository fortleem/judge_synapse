// Egyptian Judicial Smart V2.1 — Law Number Check Engine
// Verifies a law number against the court type + finds similar cases from the web
// Powered by: legal corpus (verified) + web search (discovery) + AI analysis

import { db } from "@/lib/db"
import { COURT_TYPES, findCourtType } from "./court-types"

export interface LawCheckResult {
  lawNumber: string
  courtType: string
  courtName: string
  // 1. Law verification
  lawVerified: boolean
  legalText: {
    title: string
    citation: string
    exactText: string
    legalBasis: string
    effectiveFrom: string
    temporalStatus: string
    verificationStatus: string
  } | null
  // 2. Court jurisdiction check
  jurisdictionApplicable: boolean
  jurisdictionNote: string
  // 3. Similar previous cases (from web search)
  similarCases: Array<{
    title: string
    url: string
    snippet: string
    source: string
    date: string
  }>
  // 4. Contradictory interpretations
  contradictions: string[]
  // 5. AI-powered analysis
  aiAnalysis: string | null
  nonAuthoritative: boolean
  coverage: {
    corpusSearched: boolean
    webSearched: boolean
    limitations: string[]
  }
}

// ─── Main law check function ────────────────────────────────────
export async function checkLaw(
  lawNumber: string,
  courtType: string,
  caseId?: string,
): Promise<LawCheckResult> {
  const court = findCourtType(courtType)
  const courtName = court?.name ?? courtType

  // 1. Verify law against legal corpus
  const legalText = await db.legalText.findFirst({
    where: {
      OR: [
        { citation: { contains: lawNumber } },
        { citation: lawNumber },
      ],
    },
    include: { source: true },
  })

  const lawVerified = !!legalText && legalText.verificationStatus === "verified" && legalText.temporalStatus === "current"

  // 2. Check court jurisdiction
  const jurisdictionCheck = checkCourtJurisdiction(courtType, legalText?.legalDomain ?? null)

  // 3. Search web for similar cases
  const webResults = await searchWebForSimilarCases(lawNumber, courtName)

  // 4. Find contradictions in corpus
  const contradictions = await findContradictions(lawNumber, legalText?.legalDomain ?? null)

  // 5. AI analysis (if case context provided)
  let aiAnalysis: string | null = null
  if (caseId && lawVerified) {
    aiAnalysis = await generateLawAnalysis(caseId, lawNumber, courtName, legalText, webResults)
  }

  return {
    lawNumber,
    courtType,
    courtName,
    lawVerified,
    legalText: legalText ? {
      title: legalText.title,
      citation: legalText.citation,
      exactText: legalText.exactText,
      legalBasis: legalText.source?.name ?? "غير محدد",
      effectiveFrom: legalText.effectiveFrom.toISOString(),
      temporalStatus: legalText.temporalStatus,
      verificationStatus: legalText.verificationStatus,
    } : null,
    jurisdictionApplicable: jurisdictionCheck.applicable,
    jurisdictionNote: jurisdictionCheck.note,
    similarCases: webResults,
    contradictions,
    aiAnalysis,
    nonAuthoritative: true,
    coverage: {
      corpusSearched: true,
      webSearched: webResults.length > 0,
      limitations: [
        "البحث في السجل القانوني الموثَّق + الويب",
        "القضايا السابقة من الويب غير موثَّقة — للبحث والاكتشاف فقط",
        "التحليل AI غير مُلزِم — مراجعة القاضي إلزامية",
      ],
    },
  }
}

// ─── Court jurisdiction check ──────────────────────────────────
function checkCourtJurisdiction(courtType: string, legalDomain: string | null): {
  applicable: boolean
  note: string
} {
  if (!legalDomain) {
    return { applicable: true, note: "لا يمكن تحديد المجال القانوني — يُفترض قابلية التطبيق" }
  }

  // Map court types to applicable legal domains
  const courtDomainMap: Record<string, string[]> = {
    civil_court: ["القانون المدني", "مدني", "مرافعات", "إثبات"],
    commercial_court: ["تجاري", "القانون المدني", "مرافعات"],
    economic_court: ["اقتصادي", "تجاري", "القانون المدني"],
    criminal_court: ["جنائي", "إجراءات جنائية", "العقوبات"],
    cassation: ["القانون المدني", "تجاري", "جنائي", "إجراءات جنائية", "مرافعات"],
    appeal_court: ["القانون المدني", "تجاري", "جنائي", "مرافعات"],
    state_council: ["إداري", "القانون الإداري"],
    supreme_constitutional: ["دستوري"],
    family_court: ["أحوال شخصية", "أسرة"],
    labor_court: ["عمل"],
  }

  const applicableDomains = courtDomainMap[courtType] ?? []
  const isApplicable = applicableDomains.some((d) => legalDomain.includes(d) || d.includes(legalDomain))

  if (isApplicable) {
    return {
      applicable: true,
      note: `هذا القانون (${legalDomain}) ينطبق على ${COURT_TYPES.find((c) => c.value === courtType)?.name ?? courtType} — الاختصاص نوعي وموضوعي مناسب`,
    }
  }

  return {
    applicable: false,
    note: `⚠ تنبيه: هذا القانون (${legalDomain}) قد لا ينطبق على ${COURT_TYPES.find((c) => c.value === courtType)?.name ?? courtType} — تحقّق من الاختصاص النوعي. المحاكم المتخصصة تطبّق: ${applicableDomains.join("، ") || "غير محدد"}`,
  }
}

// ─── Web search for similar cases ────────────────────────────────
async function searchWebForSimilarCases(lawNumber: string, courtName: string): Promise<Array<{
  title: string
  url: string
  snippet: string
  source: string
  date: string
}>> {
  try {
    // Use z-ai-web-dev-sdk for web search (server-side only)
    const ZAI = (await import("z-ai-web-dev-sdk")).default
    const zai = await ZAI.create()

    const query = `أحكام محكمة ${courtName} ${lawNumber} مصر`
    const results = await zai.functions.invoke("web_search", {
      query,
      num: 8,
    })

    if (!Array.isArray(results)) return []

    return results.map((r: any) => ({
      title: r.name ?? "بدون عنوان",
      url: r.url ?? "",
      snippet: r.snippet ?? "",
      source: r.host_name ?? "غير محدد",
      date: r.date ?? "",
    })).filter((r: any) => r.title && r.url)
  } catch (err) {
    console.error("[law-check] web search failed:", err)
    return []
  }
}

// ─── Find contradictions in corpus ──────────────────────────────
async function findContradictions(lawNumber: string, legalDomain: string | null): Promise<string[]> {
  const contradictions: string[] = []

  // Check for historical versions of the same law
  const historicalVersions = await db.legalText.findMany({
    where: {
      citation: { contains: lawNumber.split("—")[1] ?? lawNumber },
      temporalStatus: "historical",
    },
  })

  if (historicalVersions.length > 0) {
    contradictions.push(`توجد ${historicalVersions.length} نسخة تاريخية من هذا النص — تحقّق من النسخة السارية قبل الاعتماد`)
  }

  // Check for superseded authorities
  const superseded = await db.authority.findMany({
    where: {
      citation: { contains: lawNumber },
      authorityStatus: { in: ["superseded", "repealed"] },
    },
  })

  if (superseded.length > 0) {
    contradictions.push(`توجد ${superseded.length} سلطة منسوخة أو ملغاة تستشهد بهذا النص — لا يجوز الاعتماد عليها`)
  }

  // Check for contrary authorities
  const contrary = await db.authority.findMany({
    where: {
      citation: { contains: lawNumber },
      stance: { in: ["contrary", "opposing"] },
    },
  })

  if (contrary.length > 0) {
    contradictions.push(`توجد ${contrary.length} سلطة مخالفة تستشهد بهذا النص — راجع التمييز أو النقض`)
  }

  return contradictions
}

// ─── AI-powered analysis ────────────────────────────────────────
async function generateLawAnalysis(
  caseId: string,
  lawNumber: string,
  courtName: string,
  legalText: any,
  webResults: any[],
): Promise<string | null> {
  try {
    const { invokeSphinx } = await import("./sphinx-gateway")
    const prompt = `حلِّل مدى انطباق النص القانوني التالي على القضية الحالية:

النص القانوني: ${legalText?.title ?? lawNumber}
الاستشهاد: ${lawNumber}
المحكمة: ${courtName}
نص القانون: ${legalText?.exactText?.slice(0, 500) ?? "غير متوفر"}

القضايا السابقة المشابهة من الويب:
${webResults.slice(0, 3).map((r, i) => `${i + 1}. ${r.title}: ${r.snippet?.slice(0, 150) ?? ""}`).join("\n") || "لا توجد نتائج ويب"}

قدّم تحليلاً موجزاً (3-5 جمل) عن:
1. مدى انطباق النص على هذه المحكمة
2. أيّ قيود أو شروط ل Applycation
3. أيّ تحفظات يجب أن ينتبه لها القاضي

مهم: هذا تحليل غير مُلزِم — مراجعة القاضي إلزامية.`

    const result = await invokeSphinx({ caseId, task: "research", prompt, maxTokens: 600 })
    return result.ok ? result.content : null
  } catch {
    return null
  }
}
