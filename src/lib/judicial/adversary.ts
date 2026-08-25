// Egyptian Judicial Brain V2.1 — Adversary Review Engine
// The "Judicial Shadow" (§34, §36) — tests each proposition from 4 angles
// WITHOUT issuing a verdict or confidence score.
// Output: "Potential vulnerability detected" — never "Judge is wrong."

import type { CaseDetailT, AdversaryReviewT } from "./schemas"

interface CaseData {
  facts: CaseDetailT["facts"]
  authorities: CaseDetailT["authorities"]
  issues: CaseDetailT["issues"]
  evidence: CaseDetailT["evidence"]
  timeline: CaseDetailT["timeline"]
  proceduralStage: string
  operatingState: string
  aiAnalyses: CaseDetailT["aiAnalyses"]
}

export interface AdversaryResult {
  proposition: string
  targetType: string
  targetId?: string
  factsAngle: string
  textAngle: string
  defenseAngle: string
  proceduralAngle: string
  vulnerabilities: string
}

// Run the 4-angle adversarial test on a given proposition
export function runAdversaryReview(
  caseData: CaseData,
  proposition: string,
  targetType: string,
  targetId?: string,
): AdversaryResult {
  const factsAngle = analyzeFactsAngle(caseData, proposition)
  const textAngle = analyzeTextAngle(caseData, proposition)
  const defenseAngle = analyzeDefenseAngle(caseData, proposition)
  const proceduralAngle = analyzeProceduralAngle(caseData, proposition)

  const vulns: string[] = []
  if (factsAngle.includes("⚠") || factsAngle.includes("تنبيه")) vulns.push("ثغرة في زاوية الوقائع")
  if (textAngle.includes("⚠") || textAngle.includes("تنبيه")) vulns.push("ثغرة في زاوية النص القانوني")
  if (defenseAngle.includes("⚠") || defenseAngle.includes("تنبيه")) vulns.push("ثغرة في زاوية الدفع المضاد")
  if (proceduralAngle.includes("⚠") || proceduralAngle.includes("تنبيه")) vulns.push("ثغرة في زاوية الاتساق الإجرائي")

  const vulnerabilities = vulns.length > 0
    ? `تم رصد ${vulns.length} ثغرة محتملة: ${vulns.join("، ")}. هذا ليس حكماً على النتيجة بل دعوة لمراجعة القاضي.`
    : "لم تُرصد ثغرات ظاهرة في الزوايا الأربع — هذا لا يعني سلامة مطلقة، بل غياب تنبيهات أوّلية."

  return {
    proposition,
    targetType,
    targetId,
    factsAngle,
    textAngle,
    defenseAngle,
    proceduralAngle,
    vulnerabilities,
  }
}

// ─── Angle 1: Facts ─────────────────────────────────────────────
// Does the proposition conflict with established facts?
// Are there denied/contradicted/unresolved facts that challenge it?
function analyzeFactsAngle(caseData: CaseData, proposition: string): string {
  const denied = caseData.facts.filter((f) => f.status === "denied" || f.status === "contradicted")
  const unresolved = caseData.facts.filter((f) => f.status === "unresolved" || f.status === "alleged")
  const outcomeMaterial = caseData.facts.filter((f) => f.materiality === "outcome_material" && f.status !== "judicially_established" && f.status !== "undisputed" && f.status !== "admitted")

  const findings: string[] = []

  if (outcomeMaterial.length > 0) {
    findings.push(`⚠ تنبيه: ${outcomeMaterial.length} واقعة جوهرية للنتيجة لم تُثبَت بعد قضائياً — النتيجة المُقترَحة قد تستند إلى وقائع غير محسومة.`)
  }

  if (denied.length > 0) {
    findings.push(`يوجد ${denied.length} واقعة منكَرة أو معارَضة بدليل — يجب التحقق من عدم تعارض النتيجة معها.`)
  }

  if (unresolved.length > 0) {
    findings.push(`${unresolved.length} واقعة غير محسومة — قد يؤثر عدم حسمها على النتيجة المُقترَحة.`)
  }

  if (findings.length === 0) {
    return "الوقائع المثبتة (المُقَرّ بها / غير المتنازع عليها / المؤيّدة بالدليل / الثابتة قضائياً) لا تتعارض ظاهرياً مع النتيجة المُقترَحة."
  }

  return findings.join(" ")
}

// ─── Angle 2: Legal Text ────────────────────────────────────────
// Does the cited legal text fully support the proposition?
// Are there verification issues or temporal conflicts?
function analyzeTextAngle(caseData: CaseData, proposition: string): string {
  const supporting = caseData.authorities.filter((a) => a.stance === "supporting")
  const contrary = caseData.authorities.filter((a) => a.stance === "contrary" || a.stance === "opposing")
  const unverified = caseData.authorities.filter((a) => a.verificationStatus === "unverified" || a.verificationStatus === "partially_verified")
  const blocked = caseData.authorities.filter((a) => a.verificationStatus === "blocked")
  const historical = caseData.authorities.filter((a) => a.temporalStatus === "historical")

  const findings: string[] = []

  if (blocked.length > 0) {
    findings.push(`⚠ تنبيه: ${blocked.length} سلطة محظورة بسبب فشل التحقق — يجب استبعادها من التسبيب.`)
  }

  if (unverified.length > 0) {
    findings.push(`⚠ تنبيه: ${unverified.length} سلطة غير متحقَّق منها أو متحقَّق منها جزئياً — لا يجوز الاعتماد عليها في الوضع القضائي.`)
  }

  if (historical.length > 0) {
    findings.push(`⚠ تنبيه: ${historical.length} سلطة تاريخية — يجب التحقق من نسختها السارية قبل الاعتماد.`)
  }

  if (supporting.length === 0) {
    findings.push("⚠ تنبيه: لا توجد سلطات مؤيِّدة مسجّلة — النتيجة المُقترَحة تفتقر إلى الأساس النصي المُسجَّل.")
  } else if (supporting.length < 2 && contrary.length > 0) {
    findings.push(`يوجد ${supporting.length} سلطة مؤيِّدة فقط مقابل ${contrary.length} سلطة مخالفة — يجب التحقق من قوة الأساس النصي.`)
  }

  if (findings.length === 0) {
    return `النصوص القانونية المؤيِّدة (${supporting.length} سلطة) متحقَّق منها وسارية، وتدعم النتيجة المُقترَحة من حيث المبدأ.`
  }

  return findings.join(" ")
}

// ─── Angle 3: Opposing Defense ──────────────────────────────────
// What opposing defense hasn't been addressed?
function analyzeDefenseAngle(caseData: CaseData, proposition: string): string {
  const defenseIssues = caseData.issues.filter((i) => i.issueType === "defense" && i.status !== "resolved")
  const counterclaimIssues = caseData.issues.filter((i) => i.issueType === "counterclaim" && i.status !== "resolved")
  const constitutionalIssues = caseData.issues.filter((i) => i.issueType === "constitutional" && i.status !== "resolved")
  const contraryAuthorities = caseData.authorities.filter((a) => a.stance === "contrary" || a.stance === "opposing")

  const findings: string[] = []

  if (defenseIssues.length > 0) {
    findings.push(`⚠ تنبيه: ${defenseIssues.length} مسألة دفاعية غير محلولة — يجب التحقق من معالجة كل دفع جوهري في التسبيب.`)
  }

  if (constitutionalIssues.length > 0) {
    findings.push(`⚠ تنبيه: ${constitutionalIssues.length} مسألة دستورية مفتوحة — قد تؤثر على النتيجة إن لم تُعالَج.`)
  }

  if (contraryAuthorities.length > 0) {
    findings.push(`يوجد ${contraryAuthorities.length} سلطة مخالفة مسجّلة — يجب التحقق من تمييز النتيجة عنها أو نقضها.`)
  }

  if (counterclaimIssues.length > 0) {
    findings.push(`${counterclaimIssues.length} دعوى فرعية مفتوحة — قد تؤثر على النتيجة النهائية.`)
  }

  if (findings.length === 0) {
    return "لا توجد دفوع مضادة جوهرية غير معالَجة — تمت تغطية الدفوع المسجّلة في المسائل القانونية."
  }

  return findings.join(" ")
}

// ─── Angle 4: Procedural Consistency ────────────────────────────
// Are there procedural gaps?
function analyzeProceduralAngle(caseData: CaseData, proposition: string): string {
  const findings: string[] = []

  // Check if we're at a stage where propositions are premature
  const earlyStages = ["FILED", "REGISTERED", "SERVICE"]
  if (earlyStages.includes(caseData.proceduralStage)) {
    findings.push(`⚠ تنبيه: القضية في مرحلة مبكّرة (${caseData.proceduralStage}) — النتائج التحليلية قد تكون سابقة لأوانها.`)
  }

  // Check operating state
  if (caseData.operatingState === "INSUFFICIENT_EVIDENCE") {
    findings.push("⚠ تنبيه: حالة التشغيل «عدم كفاية الأدلة» — لا يجوز البناء على نتيجة قبل استكمال الأدلة.")
  }

  if (caseData.operatingState === "CONFLICT") {
    findings.push("⚠ تنبيه: حالة التشغيل «تعارض» — يوجد تعارض في السلطات يجب حسمه قبل اعتماد أيّ نتيجة.")
  }

  // Check for unresolved jurisdiction issues
  const jurisdictionIssues = caseData.issues.filter((i) => i.issueType === "jurisdiction" && i.status !== "resolved")
  if (jurisdictionIssues.length > 0) {
    findings.push(`⚠ تنبيه: ${jurisdictionIssues.length} مسألة اختصاص غير محلولة — يجب حسم الاختصاص قبل البتّ.`)
  }

  // Check for unresolved admissibility
  const admissibilityIssues = caseData.issues.filter((i) => i.issueType === "admissibility" && i.status !== "resolved")
  if (admissibilityIssues.length > 0) {
    findings.push(`${admissibilityIssues.length} مسألة قبول الدعوى غير محلولة — قد تؤثر على المسار الإجرائي.`)
  }

  // Check evidence with pending admissibility
  const pendingEvidence = caseData.evidence.filter((e) => e.admissibility === "pending_review" || e.admissibility === "challenged")
  if (pendingEvidence.length > 0) {
    findings.push(`${pendingEvidence.length} دليل قيد المراجعة أو مطعون عليه — قد يؤثر على قاعدة النتيجة.`)
  }

  if (findings.length === 0) {
    return "الإجراءات سليمة ظاهرياً — لا توجد ثغرات إجرائية مرئية في المرحلة الحالية."
  }

  return findings.join(" ")
}

// ─── Conflict Detection (§29, §30) ──────────────────────────────
// Detect potential conflicts between authorities in a case
export function detectConflicts(caseData: CaseData): Array<{
  conflictType: string
  status: string
  description: string
  significance: string
  explanation: string
}> {
  const conflicts: Array<{
    conflictType: string
    status: string
    description: string
    significance: string
    explanation: string
  }> = []

  const supporting = caseData.authorities.filter((a) => a.stance === "supporting")
  const contrary = caseData.authorities.filter((a) => a.stance === "contrary" || a.stance === "opposing")

  // Legal conflict: supporting vs contrary authorities
  if (supporting.length > 0 && contrary.length > 0) {
    conflicts.push({
      conflictType: "legal",
      status: "POTENTIAL_CONFLICT",
      description: `تعارض قانوني محتمل بين ${supporting.length} سلطة مؤيِّدة و${contrary.length} سلطة مخالفة`,
      significance: "جوهري — قد يؤثر على نتيجة القضية",
      explanation: "توجد سلطات قضائية أو قانونية متعارِضة في توجيه النتيجة. يجب على القاضي تمييز السلطة الأقوى أو نقد السلطة المخالفة. هذا تعارض محتمل حتى تتم مراجعته — ليس تعارضاً مؤكَّداً.",
    })
  }

  // Temporal conflict: check for historical authorities cited as current
  const historical = caseData.authorities.filter((a) => a.temporalStatus === "historical")
  if (historical.length > 0) {
    conflicts.push({
      conflictType: "temporal",
      status: "POTENTIAL_CONFLICT",
      description: `${historical.length} سلطة تاريخية مسجّلة — قد تكون منسوخة بنص أحدث`,
      significance: "متوسط — قد يبطل الاعتماد على نص منسوخ",
      explanation: "تم تسجيل سلطات بصفتها تاريخية. يجب التحقق من النسخة السارية قبل الاعتماد عليها في التسبيب.",
    })
  }

  // Factual conflict: denied vs supported facts on same materiality
  const materialDenied = caseData.facts.filter((f) => f.materiality === "outcome_material" && (f.status === "denied" || f.status === "contradicted"))
  if (materialDenied.length > 0) {
    conflicts.push({
      conflictType: "factual",
      status: "POTENTIAL_CONFLICT",
      description: `${materialDenied.length} واقعة جوهرية منكَرة أو معارَضة بدليل`,
      significance: "جوهري — يلزم حسم الوقائع المتنازع عليها قبل البتّ",
      explanation: "يوجد تناقض وقائعي في الوقائع الجوهرية للنتيجة. يجب على القاضي تحديد الواقعة المُعتَمَدة وأسباب ترجيحها.",
    })
  }

  // Jurisdictional conflict
  const jurisdictionOpen = caseData.issues.filter((i) => i.issueType === "jurisdiction" && i.status !== "resolved")
  if (jurisdictionOpen.length > 0) {
    conflicts.push({
      conflictType: "jurisdictional",
      status: "POTENTIAL_CONFLICT",
      description: `${jurisdictionOpen.length} مسألة اختصاص مفتوحة`,
      significance: "إجرائي جوهري — يبطل الحكم الصادر دون اختصاص",
      explanation: "لم تُحسم مسائل الاختصاص بعد. يجب التحقق من انعقاد الاختصاص النوعي والمكاني قبل المضي في الموضوع.",
    })
  }

  return conflicts
}
