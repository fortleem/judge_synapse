// Egyptian Judicial Brain V2.1 — Domain Constants
// Sovereign court-pilot controlled vocabularies

export const PROCEDURAL_STAGES = [
  { value: "FILED", label: "مرفوعة", labelEn: "Filed", order: 1 },
  { value: "REGISTERED", label: "مقيّدة", labelEn: "Registered", order: 2 },
  { value: "SERVICE", label: "إعلان", labelEn: "Service", order: 3 },
  { value: "PLEADINGS", label: "مذكرات", labelEn: "Pleadings", order: 4 },
  { value: "EVIDENCE", label: "إثبات", labelEn: "Evidence", order: 5 },
  { value: "EXPERT", label: "خبير", labelEn: "Expert", order: 6 },
  { value: "HEARING", label: "جلسة", labelEn: "Hearing", order: 7 },
  { value: "DELIBERATION", label: "مداولة", labelEn: "Deliberation", order: 8 },
  { value: "JUDGMENT", label: "حكم", labelEn: "Judgment", order: 9 },
  { value: "APPEAL", label: "استئناف", labelEn: "Appeal", order: 10 },
  { value: "FINALITY", label: "حكم نهائي", labelEn: "Finality", order: 11 },
  { value: "EXECUTION", label: "تنفيذ", labelEn: "Execution", order: 12 },
] as const

export const RISK_LEVELS = [
  { value: "LOW", label: "منخفض", color: "green" },
  { value: "MEDIUM", label: "متوسط", color: "blue" },
  { value: "HIGH", label: "مرتفع", color: "orange" },
  { value: "CRITICAL", label: "حرج", color: "red" },
] as const

export const OPERATING_STATES = [
  { value: "NOMINAL", label: "النظام سليم", labelEn: "Nominal", color: "green", icon: "shield-check" },
  { value: "REVIEW", label: "قيد المراجعة", labelEn: "Review", color: "blue", icon: "eye" },
  { value: "INSUFFICIENT_EVIDENCE", label: "عدم كفاية الأدلة", labelEn: "Insufficient Evidence", color: "yellow", icon: "alert-triangle" },
  { value: "CONFLICT", label: "تعارض", labelEn: "Conflict", color: "orange", icon: "swords" },
  { value: "SYSTEM_DEGRADED", label: "النظام متدهور", labelEn: "System Degraded", color: "red", icon: "server-off" },
] as const

export const FACT_STATUSES = [
  { value: "alleged", label: "مدّعى", labelEn: "Alleged", color: "slate" },
  { value: "admitted", label: "مُقَرّ بها", labelEn: "Admitted", color: "blue" },
  { value: "denied", label: "منكَرة", labelEn: "Denied", color: "red" },
  { value: "undisputed", label: "غير متنازع عليها", labelEn: "Undisputed", color: "blue" },
  { value: "supported", label: "مؤيّدة بالدليل", labelEn: "Supported", color: "teal" },
  { value: "contradicted", label: "معارَضة بدليل", labelEn: "Contradicted", color: "orange" },
  { value: "judicially_established", label: "مثبتة قضائيًا", labelEn: "Judicially Established", color: "emerald" },
  { value: "unresolved", label: "غير محسومة", labelEn: "Unresolved", color: "amber" },
] as const

export const FACT_MATERIALITY = [
  { value: "outcome_material", label: "جوهرية للنتيجة", labelEn: "Outcome-Material" },
  { value: "supporting", label: "مسانِدة", labelEn: "Supporting" },
  { value: "immaterial", label: "غير جوهرية", labelEn: "Immaterial" },
] as const

export const EVIDENCE_TYPES = [
  { value: "contract", label: "عقد", icon: "file-text" },
  { value: "email", label: "بريد إلكتروني", icon: "mail" },
  { value: "message", label: "رسالة", icon: "message-square" },
  { value: "pdf", label: "PDF", icon: "file" },
  { value: "spreadsheet", label: "جدول بيانات", icon: "table" },
  { value: "image", label: "صورة", icon: "image" },
  { value: "video", label: "فيديو", icon: "video" },
  { value: "audio", label: "تسجيل صوتي", icon: "audio-lines" },
  { value: "signature", label: "توقيع", icon: "pen-tool" },
  { value: "scan", label: "مستند ممسوح", icon: "scan" },
  { value: "official_record", label: "سجل رسمي", icon: "landmark" },
] as const

export const EVIDENCE_ADMISSIBILITY = [
  { value: "admissible", label: "مقبول", color: "emerald" },
  { value: "challenged", label: "مُطعَن عليه", color: "orange" },
  { value: "excluded", label: "مستبعد", color: "red" },
  { value: "pending_review", label: "قيد المراجعة", color: "amber" },
] as const

export const ISSUE_TYPES = [
  { value: "jurisdiction", label: "اختصاص", color: "violet" },
  { value: "admissibility", label: "قبول الدعوى", color: "purple" },
  { value: "procedural", label: "إجرائي", color: "slate" },
  { value: "primary", label: "المسألة الأصلية", color: "emerald" },
  { value: "defense", label: "دفاع", color: "blue" },
  { value: "counterclaim", label: "دعوى فرعية", color: "cyan" },
  { value: "constitutional", label: "دستوري", color: "rose" },
  { value: "remedy", label: "طلبات", color: "amber" },
] as const

export const AUTHORITY_STANCES = [
  { value: "supporting", label: "مؤيِّدة", labelEn: "Supporting", color: "emerald" },
  { value: "opposing", label: "معارِضة", labelEn: "Opposing", color: "rose" },
  { value: "contrary", label: "مخالِفة", labelEn: "Contrary", color: "red" },
  { value: "distinguishing", label: "تمييز", labelEn: "Distinguishing", color: "amber" },
  { value: "neutral", label: "محايدة", labelEn: "Neutral", color: "slate" },
] as const

export const LEGAL_FORCE = [
  { value: "constitutional_provision", label: "نص دستوري" },
  { value: "statute", label: "تشريع" },
  { value: "regulation", label: "لائحة تنفيذية" },
  { value: "executive_decision", label: "قرار تنفيذي" },
  { value: "constitutional_judgment", label: "حكم دستوري" },
  { value: "judicial_principle", label: "مبدأ قضائي" },
  { value: "court_judgment", label: "حكم محكمة" },
  { value: "state_council_opinion", label: "رأي مجلس الدولة" },
  { value: "administrative_interpretation", label: "تفسير إداري" },
  { value: "verified_secondary", label: "مصدر ثانوي موثّق" },
  { value: "academic_commentary", label: "تعليق أكاديمي" },
  { value: "research_only", label: "بحث فقط" },
] as const

export const AUTHORITY_VERIFICATION = [
  { value: "verified", label: "متحقَّق منها", color: "emerald" },
  { value: "partially_verified", label: "متحقَّق منها جزئيًا", color: "amber" },
  { value: "unverified", label: "غير متحقَّق منها", color: "orange" },
  { value: "blocked", label: "محظورة", color: "red" },
] as const

export const JUDGE_FIELD_TYPES = [
  { value: "judge_results", label: "نتائج القاضي", labelEn: "Judge Results", icon: "gavel" },
  { value: "judge_reasoning", label: "تسبيب القاضي", labelEn: "Judge Reasoning", icon: "scale" },
  { value: "draft", label: "المسودة", labelEn: "Draft", icon: "file-pen-line" },
  { value: "integrity_review", label: "مراجعة سلامة الحكم", labelEn: "Integrity Review", icon: "shield-check" },
] as const

export const JUDGE_FIELD_STATUS = [
  { value: "empty", label: "فارغ", color: "slate" },
  { value: "ai_proposed", label: "اقتراح AI", color: "amber" },
  { value: "judge_reviewing", label: "قيد المراجعة", color: "blue" },
  { value: "judge_accepted", label: "قَبِلها القاضي", color: "emerald" },
  { value: "judge_rejected", label: "رفضها القاضي", color: "red" },
  { value: "judge_modified", label: "عدّلها القاضي", color: "violet" },
] as const

export const AI_RESPONSE_STATUS = [
  { value: "verified", label: "متحقَّق منه", color: "emerald" },
  { value: "partially_verified", label: "متحقَّق منه جزئيًا", color: "amber" },
  { value: "conflicted", label: "متعارِض", color: "orange" },
  { value: "insufficient", label: "أدلة غير كافية", color: "red" },
  { value: "unverified", label: "غير متحقَّق منه", color: "slate" },
  { value: "blocked", label: "محظور", color: "red" },
] as const

export const INDICATOR_TYPES = [
  { value: "citation_soundness", label: "سلامة الاستشهادات", labelEn: "Citation Soundness", icon: "quote" },
  { value: "legal_version", label: "النسخة القانونية", labelEn: "Legal Version", icon: "git-branch" },
  { value: "defense_coverage", label: "تغطية الدفوع", labelEn: "Defense Coverage", icon: "shield" },
  { value: "evidence_consistency", label: "اتساق الأدلة", labelEn: "Evidence Consistency", icon: "puzzle" },
] as const

export const INDICATOR_STATUS = [
  { value: "pending", label: "قيد الانتظار", color: "slate" },
  { value: "pass", label: "سليم", color: "emerald" },
  { value: "warn", label: "تحذير", color: "amber" },
  { value: "fail", label: "فشل", color: "red" },
] as const

// Judicial alert colors (§116)
export const ALERT_LEVELS = {
  RED: { label: "حرج", labelEn: "Critical", color: "red" },
  ORANGE: { label: "متعارِض", labelEn: "Contradiction", color: "orange" },
  YELLOW: { label: "تحذير", labelEn: "Caution", color: "yellow" },
  BLUE: { label: "إخطار", labelEn: "Notice", color: "blue" },
  GREEN: { label: "متحقَّق", labelEn: "Verified", color: "green" },
} as const

export const COURT_TYPES = [
  "محكمة مدنية",
  "محكمة تجارية",
  "محكمة اقتصادية",
  "محكمة النقض",
  "محكمة الاستئناف",
  "مجلس الدولة",
  "المحكمة الدستورية العليا",
  "محكمة الأسرة",
  "محكمة جنائية",
  "محكمة العمل",
] as const

export const SETTING_CATEGORIES = [
  { value: "governance", label: "الحوكمة", labelEn: "Governance" },
  { value: "law_sources", label: "مصادر القانون", labelEn: "Law Sources" },
  { value: "templates", label: "النماذج", labelEn: "Templates" },
  { value: "model_policy", label: "سياسة النماذج", labelEn: "Model Policy" },
] as const

export function findConstant<T extends { value: string }>(
  list: readonly T[],
  value: string | undefined | null
): T | undefined {
  if (!value) return undefined
  return list.find((item) => item.value === value)
}
