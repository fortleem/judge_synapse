// Egyptian Judicial Smart V2.1 — Contradiction Detection & Notification Engine
// Proactively scans a case for contradictions and generates judge notifications.
// Out-of-the-box: the judge is notified immediately when contradictions are found.

import { db } from "@/lib/db"
import { audit } from "./audit"

export interface ContradictionAlert {
  id: string
  caseId: string
  severity: "critical" | "warning" | "info"
  category: string // factual | legal | temporal | procedural | jurisdictional | evidence
  title: string
  description: string
  recommendation: string
  relatedEntities: string[]
  detectedAt: string
  acknowledged: boolean
}

export interface CaseContradictionReport {
  caseId: string
  caseTitle: string
  totalAlerts: number
  criticalCount: number
  warningCount: number
  infoCount: number
  alerts: ContradictionAlert[]
  summary: string
}

// ─── Main contradiction scan ────────────────────────────────────
// Scans the entire case and generates contradiction alerts
export async function scanCaseForContradictions(caseId: string): Promise<CaseContradictionReport> {
  const caseData = await db.case.findUnique({
    where: { id: caseId },
    include: {
      facts: true,
      evidence: true,
      authorities: true,
      issues: true,
      timeline: true,
      conflicts: true,
    },
  })

  if (!caseData) {
    return {
      caseId,
      caseTitle: "غير موجودة",
      totalAlerts: 0,
      criticalCount: 0,
      warningCount: 0,
      infoCount: 0,
      alerts: [],
      summary: "القضية غير موجودة",
    }
  }

  const alerts: ContradictionAlert[] = []

  // 1. Factual contradictions: denied vs supported facts on same materiality
  const materialDenied = caseData.facts.filter((f) => f.materiality === "outcome_material" && (f.status === "denied" || f.status === "contradicted"))
  const materialSupported = caseData.facts.filter((f) => f.materiality === "outcome_material" && (f.status === "judicially_established" || f.status === "supported"))
  if (materialDenied.length > 0 && materialSupported.length > 0) {
    alerts.push({
      id: `factual-${caseId}-${Date.now()}`,
      caseId,
      severity: "critical",
      category: "factual",
      title: "تعارض وقائعي جوهري",
      description: `${materialDenied.length} واقعة جوهرية منكَرة أو معارَضة بدليل مقابل ${materialSupported.length} واقعة جوهرية مثبتة. هذا التعارض قد يؤثر على نتيجة القضية.`,
      recommendation: "حدّد الواقعة المُعتَمَدة وأسباب ترجيحها. يجب أن يتناول التسبيب كل واقعة متنازع عليها.",
      relatedEntities: materialDenied.map((f) => f.id),
      detectedAt: new Date().toISOString(),
      acknowledged: false,
    })
  }

  // 2. Legal contradictions: supporting vs contrary authorities
  const supporting = caseData.authorities.filter((a) => a.stance === "supporting")
  const contrary = caseData.authorities.filter((a) => a.stance === "contrary" || a.stance === "opposing")
  if (supporting.length > 0 && contrary.length > 0) {
    alerts.push({
      id: `legal-${caseId}-${Date.now()}`,
      caseId,
      severity: "critical",
      category: "legal",
      title: "تعارض قانوني بين السلطات",
      description: `${supporting.length} سلطة مؤيِّدة مقابل ${contrary.length} سلطة مخالفة. هذا التعارض قد يؤثر على الأساس القانوني للنتيجة.`,
      recommendation: "ميِّز السلطة الأقوى أو انقضِ السلطة المخالفة. يجب أن يوضّح التسبيب لماذا رُجِّحت سلطة على أخرى.",
      relatedEntities: [...supporting.map((a) => a.id), ...contrary.map((a) => a.id)],
      detectedAt: new Date().toISOString(),
      acknowledged: false,
    })
  }

  // 3. Temporal contradictions: historical authorities cited as current
  const historical = caseData.authorities.filter((a) => a.temporalStatus === "historical")
  if (historical.length > 0) {
    alerts.push({
      id: `temporal-${caseId}-${Date.now()}`,
      caseId,
      severity: "warning",
      category: "temporal",
      title: "استشهاد بنص تاريخي",
      description: `${historical.length} سلطة تاريخية مسجّلة — قد تكون منسوخة بنص أحدث. الاستشهاد بنص منسوخ يبطل التسبيب.`,
      recommendation: "تحقّق من النسخة السارية لكل سلطة تاريخية قبل الاعتماد عليها في التسبيب.",
      relatedEntities: historical.map((a) => a.id),
      detectedAt: new Date().toISOString(),
      acknowledged: false,
    })
  }

  // 4. Unverified authorities
  const unverified = caseData.authorities.filter((a) => a.verificationStatus === "unverified" || a.verificationStatus === "partially_verified")
  if (unverified.length > 0) {
    alerts.push({
      id: `unverified-${caseId}-${Date.now()}`,
      caseId,
      severity: "warning",
      category: "legal",
      title: "استشهادات غير متحقَّق منها",
      description: `${unverified.length} سلطة غير متحقَّق منها أو متحقَّق منها جزئياً. لا يجوز الاعتماد عليها في الوضع القضائي.`,
      recommendation: "مرّر هذه الاستشهادات عبر بوابة التحقق قبل الاعتماد عليها.",
      relatedEntities: unverified.map((a) => a.id),
      detectedAt: new Date().toISOString(),
      acknowledged: false,
    })
  }

  // 5. Jurisdictional: open jurisdiction issues
  const jurisdictionOpen = caseData.issues.filter((i) => i.issueType === "jurisdiction" && i.status !== "resolved")
  if (jurisdictionOpen.length > 0) {
    alerts.push({
      id: `jurisdiction-${caseId}-${Date.now()}`,
      caseId,
      severity: "critical",
      category: "jurisdictional",
      title: "مسائل اختصاص غير محلولة",
      description: `${jurisdictionOpen.length} مسألة اختصاص مفتوحة. الحكم الصادر دون اختصاص يُبطَل.`,
      recommendation: "احسم مسائل الاختصاص النوعي والمكاني قبل المضي في الموضوع.",
      relatedEntities: jurisdictionOpen.map((i) => i.id),
      detectedAt: new Date().toISOString(),
      acknowledged: false,
    })
  }

  // 6. Evidence: challenged evidence with high relevance
  const challengedEvidence = caseData.evidence.filter((e) => e.admissibility === "challenged" || e.admissibility === "excluded")
  if (challengedEvidence.length > 0) {
    alerts.push({
      id: `evidence-${caseId}-${Date.now()}`,
      caseId,
      severity: "warning",
      category: "evidence",
      title: "أدلة مطعون عليها أو مستبعدة",
      description: `${challengedEvidence.length} دليل مطعون عليه أو مستبعد. يجب التحقق من أثر ذلك على النتيجة.`,
      recommendation: "راجع كل دليل مطعون عليه وحدّد أثر قبوله أو رفضه على النتيجة.",
      relatedEntities: challengedEvidence.map((e) => e.id),
      detectedAt: new Date().toISOString(),
      acknowledged: false,
    })
  }

  // 7. Procedural: case in early stage with propositions
  const earlyStages = ["FILED", "REGISTERED", "SERVICE"]
  if (earlyStages.includes(caseData.proceduralStage)) {
    alerts.push({
      id: `procedural-${caseId}-${Date.now()}`,
      caseId,
      severity: "info",
      category: "procedural",
      title: "القضية في مرحلة مبكرة",
      description: `القضية في مرحلة ${caseData.proceduralStage} — النتائج التحليلية قد تكون سابقة لأوانها.`,
      recommendation: "انتظر اكتمال الإجراءات الأولية قبل البتّ في النتائج الجوهرية.",
      relatedEntities: [],
      detectedAt: new Date().toISOString(),
      acknowledged: false,
    })
  }

  // 8. Insufficient evidence state
  if (caseData.operatingState === "INSUFFICIENT_EVIDENCE") {
    alerts.push({
      id: `insufficient-${caseId}-${Date.now()}`,
      caseId,
      severity: "critical",
      category: "evidence",
      title: "عدم كفاية الأدلة",
      description: "حالة التشغيل «عدم كفاية الأدلة» — لا يجوز البناء على نتيجة قبل استكمال الأدلة.",
      recommendation: "كلّف الخصوم بتقديم مستندات إضافية أو بيّنات قبل البتّ.",
      relatedEntities: [],
      detectedAt: new Date().toISOString(),
      acknowledged: false,
    })
  }

  const criticalCount = alerts.filter((a) => a.severity === "critical").length
  const warningCount = alerts.filter((a) => a.severity === "warning").length
  const infoCount = alerts.filter((a) => a.severity === "info").length

  const summary = alerts.length === 0
    ? "لا توجد تعارضات أو تنبيهات — القضية سليمة ظاهرياً"
    : `تم رصد ${alerts.length} تنبيه: ${criticalCount} حرج، ${warningCount} تحذير، ${infoCount} إخطار`

  // Log the scan
  if (alerts.length > 0) {
    audit.systemProposal(caseId, "contradiction_scan_completed", "case", caseId, summary)
  }

  return {
    caseId,
    caseTitle: caseData.title,
    totalAlerts: alerts.length,
    criticalCount,
    warningCount,
    infoCount,
    alerts,
    summary,
  }
}

// ─── Legal Strength Analysis ────────────────────────────────────
// Out-of-the-box: visualizes the balance of legal strength between parties
export interface LegalStrengthAnalysis {
  plaintiffScore: number // 0-100
  defendantScore: number // 0-100
  balance: "plaintiff" | "defendant" | "balanced"
  factors: {
    plaintiff: Array<{ label: string; score: number; weight: string }>
    defendant: Array<{ label: string; score: number; weight: string }>
  }
  recommendation: string
}

export async function analyzeLegalStrength(caseId: string): Promise<LegalStrengthAnalysis> {
  const caseData = await db.case.findUnique({
    where: { id: caseId },
    include: { facts: true, evidence: true, authorities: true, issues: true },
  })

  if (!caseData) {
    return {
      plaintiffScore: 0,
      defendantScore: 0,
      balance: "balanced",
      factors: { plaintiff: [], defendant: [] },
      recommendation: "القضية غير موجودة",
    }
  }

  const plaintiffFactors: Array<{ label: string; score: number; weight: string }> = []
  const defendantFactors: Array<{ label: string; score: number; weight: string }> = []

  // Facts: established facts favor the party
  const plaintiffFacts = caseData.facts.filter((f) => f.party === "المدّعي" || f.party === "المدّعون")
  const defendantFacts = caseData.facts.filter((f) => f.party === "المدّعى عليه")

  const plaintiffEstablished = plaintiffFacts.filter((f) => ["judicially_established", "undisputed", "admitted", "supported"].includes(f.status))
  const defendantEstablished = defendantFacts.filter((f) => ["judicially_established", "undisputed", "admitted", "supported"].includes(f.status))

  plaintiffFactors.push({
    label: "وقائع مثبتة",
    score: plaintiffEstablished.length * 15,
    weight: "جوهرية",
  })
  defendantFactors.push({
    label: "وقائع مثبتة",
    score: defendantEstablished.length * 15,
    weight: "جوهرية",
  })

  // Authorities: supporting vs opposing
  const plaintiffAuthorities = caseData.authorities.filter((a) => a.stance === "supporting")
  const defendantAuthorities = caseData.authorities.filter((a) => a.stance === "contrary" || a.stance === "opposing")

  plaintiffFactors.push({
    label: "سلطات مؤيِّدة",
    score: plaintiffAuthorities.filter((a) => a.verificationStatus === "verified").length * 10,
    weight: "قانونية",
  })
  defendantFactors.push({
    label: "سلطات مخالفة",
    score: defendantAuthorities.filter((a) => a.verificationStatus === "verified").length * 10,
    weight: "قانونية",
  })

  // Evidence: admissible evidence
  const plaintiffEvidence = caseData.evidence.filter((e) => e.admissibility === "admissible")
  plaintiffFactors.push({
    label: "أدلة مقبولة",
    score: plaintiffEvidence.length * 8,
    weight: "إثباتية",
  })

  // Issues: resolved issues favor the party
  const resolvedIssues = caseData.issues.filter((i) => i.status === "resolved")
  plaintiffFactors.push({
    label: "مسائل محلولة",
    score: resolvedIssues.length * 5,
    weight: "إجرائية",
  })

  // Challenged evidence weakens
  const challengedEvidence = caseData.evidence.filter((e) => e.admissibility === "challenged" || e.admissibility === "excluded")
  defendantFactors.push({
    label: "أدلة مطعون عليها",
    score: challengedEvidence.length * 8,
    weight: "دفاعي",
  })

  const plaintiffScore = Math.min(100, plaintiffFactors.reduce((sum, f) => sum + f.score, 0))
  const defendantScore = Math.min(100, defendantFactors.reduce((sum, f) => sum + f.score, 0))

  const balance = plaintiffScore > defendantScore + 15 ? "plaintiff"
    : defendantScore > plaintiffScore + 15 ? "defendant"
    : "balanced"

  const recommendation = balance === "plaintiff"
    ? "الميزان يميل لصالح المدّعي — وقائعه وأدلته أقوى. تحقّق من دفوع المدّعى عليه."
    : balance === "defendant"
    ? "الميزان يميل لصالح المدّعى عليه — دفوعه وأدلته المضادة أقوى. تحقّق من نقاط ضعف المدّعي."
    : "الميزان متوازن — القضية محتملة لكلا الطرفين. يتطلب تحليلاً أعمق."

  return {
    plaintiffScore,
    defendantScore,
    balance,
    factors: { plaintiff: plaintiffFactors, defendant: defendantFactors },
    recommendation,
  }
}
