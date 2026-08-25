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

// ═══════════════════════════════════════════════════════════════════
// LEGAL CORPUS LAYER (§15, §16, §17)
// ═══════════════════════════════════════════════════════════════════

export const SOURCE_TYPES = [
  { value: "constitution", label: "الدستور", labelEn: "Constitution", color: "gold", icon: "crown" },
  { value: "official_gazette", label: "الجريدة الرسمية", labelEn: "Official Gazette", color: "amber", icon: "newspaper" },
  { value: "statute", label: "تشريع", labelEn: "Statute", color: "blue", icon: "book-open" },
  { value: "cassation", label: "أحكام النقض", labelEn: "Cassation", color: "emerald", icon: "gavel" },
  { value: "state_council", label: "مجلس الدولة", labelEn: "State Council", color: "teal", icon: "landmark" },
  { value: "constitutional_court", label: "المحكمة الدستورية", labelEn: "Constitutional Court", color: "rose", icon: "scale" },
  { value: "specialized_court", label: "محاكم متخصصة", labelEn: "Specialized Court", color: "violet", icon: "building" },
  { value: "ministry", label: "وزارة", labelEn: "Ministry", color: "slate", icon: "building-2" },
] as const

export const ACCESS_STATUS = [
  { value: "PUBLIC", label: "متاح للعموم", labelEn: "Public", color: "emerald" },
  { value: "AUTH_REQUIRED", label: "يتطلب تسجيلاً", labelEn: "Auth Required", color: "orange" },
  { value: "PARTIAL", label: "متاح جزئياً", labelEn: "Partial", color: "amber" },
  { value: "QUEUED", label: "في طابور الاستيراد", labelEn: "Queued", color: "slate" },
  { value: "IMPORTED", label: "مستورد", labelEn: "Imported", color: "blue" },
  { value: "VERIFIED", label: "متحقَّق منه", labelEn: "Verified", color: "emerald" },
] as const

export const SOURCE_TIERS = [
  { value: 1, label: "الطبقة 1 — واجهة API رسمية مؤمّنة", labelEn: "Tier 1 — Official Secure API", color: "emerald" },
  { value: 2, label: "الطبقة 2 — مستودع مؤسسي موثّق", labelEn: "Tier 2 — Authenticated Institutional Repository", color: "teal" },
  { value: 3, label: "الطبقة 3 — مصدر رسمي عام", labelEn: "Tier 3 — Official Public Source", color: "blue" },
  { value: 4, label: "الطبقة 4 — قاعدة بيانات قانونية مؤسسية معتمدة", labelEn: "Tier 4 — Authorized Institutional Database", color: "violet" },
  { value: 5, label: "الطبقة 5 — مصدر ثانوي موثّق", labelEn: "Tier 5 — Verified Secondary Source", color: "amber" },
  { value: 6, label: "الطبقة 6 — بحث واكتشاف فقط", labelEn: "Tier 6 — Research/Discovery Only", color: "slate" },
] as const

export const LEGAL_TEXT_DOCUMENT_TYPES = [
  { value: "constitutional_provision", label: "نص دستوري", color: "gold" },
  { value: "statute_article", label: "مادة تشريعية", color: "blue" },
  { value: "judgment", label: "حكم قضائي", color: "emerald" },
  { value: "principle", label: "مبدأ قضائي", color: "violet" },
  { value: "regulation", label: "لائحة تنفيذية", color: "teal" },
  { value: "executive_decision", label: "قرار تنفيذي", color: "amber" },
] as const

export const CORPUS_SNAPSHOT_STATUS = [
  { value: "draft", label: "مسودة", color: "slate" },
  { value: "approved", label: "معتمدة", color: "blue" },
  { value: "published", label: "منشورة", color: "emerald" },
  { value: "expired", label: "منتهية الصلاحية", color: "red" },
] as const

export const IMPORT_JOB_STATUS = [
  { value: "QUEUED", label: "في الانتظار", color: "slate" },
  { value: "IN_PROGRESS", label: "قيد التنفيذ", color: "blue" },
  { value: "COMPLETED", label: "مكتمل", color: "emerald" },
  { value: "FAILED", label: "فشل", color: "red" },
  { value: "BLOCKED", label: "محظور", color: "orange" },
] as const

// ═══════════════════════════════════════════════════════════════════
// CONFLICT ENGINE (§29, §30)
// ═══════════════════════════════════════════════════════════════════

export const CONFLICT_TYPES = [
  { value: "factual", label: "تعارض وقائعي", labelEn: "Factual Contradiction", color: "orange", icon: "file-x" },
  { value: "temporal", label: "تعارض زمني", labelEn: "Chronological Contradiction", color: "amber", icon: "clock" },
  { value: "jurisdictional", label: "تعارض اختصاصي", labelEn: "Jurisdictional Conflict", color: "violet", icon: "map" },
  { value: "legal", label: "تعارض قانوني", labelEn: "Legal Contradiction", color: "red", icon: "scale" },
  { value: "procedural", label: "تعارض إجرائي", labelEn: "Procedural Contradiction", color: "blue", icon: "git-branch" },
  { value: "draft", label: "تعارض في المسودة", labelEn: "Draft Contradiction", color: "rose", icon: "file-pen-line" },
] as const

export const CONFLICT_STATUS = [
  { value: "POTENTIAL_CONFLICT", label: "تعارض محتمل", labelEn: "Potential Conflict", color: "amber" },
  { value: "CONFLICT", label: "تعارض مؤكَّد", labelEn: "Conflict (Validated)", color: "red" },
  { value: "RESOLVED", label: "محلول", labelEn: "Resolved", color: "emerald" },
  { value: "FALSE_POSITIVE", label: "إيجابية كاذبة", labelEn: "False Positive", color: "slate" },
] as const

export const CONFLICT_REVIEW = [
  { value: "pending", label: "بانتظار المراجعة", color: "amber" },
  { value: "reviewed", label: "تمت المراجعة", color: "blue" },
  { value: "dismissed", label: "مرفوض", color: "slate" },
  { value: "confirmed", label: "مؤكَّد", color: "red" },
] as const

// ═══════════════════════════════════════════════════════════════════
// ADVERSARY REVIEW — The Judicial Shadow (§34, §36)
// ═══════════════════════════════════════════════════════════════════

export const ADVERSARY_TARGET_TYPES = [
  { value: "ai_analysis", label: "تحليل ذكاء اصطناعي", color: "amber", icon: "bot" },
  { value: "fact", label: "واقعة", color: "blue", icon: "file-text" },
  { value: "authority", label: "سلطة قانونية", color: "emerald", icon: "scale" },
  { value: "judge_field", label: "حقل القاضي", color: "violet", icon: "gavel" },
  { value: "proposition", label: "قضية قانونية", color: "rose", icon: "git-branch" },
] as const

export const ADVERSARY_ANGLES = [
  { key: "factsAngle", label: "زاوية الوقائع", labelEn: "Facts Angle", icon: "file-search", desc: "هل الوقائع المثبتة تدعم النتيجة؟ هل توجد وقائع متناقضة؟" },
  { key: "textAngle", label: "زاوية النص", labelEn: "Text Angle", icon: "book-open", desc: "هل النص القانوني ينطبق بحرفيته؟ هل توجد نسخة أحدث؟" },
  { key: "defenseAngle", label: "زاوية الدفع المضاد", labelEn: "Defense Angle", icon: "shield", desc: "ما الدفع المضاد الذي لم يُعالَج؟ هل يوجد دفع ساقط؟" },
  { key: "proceduralAngle", label: "زاوية الاتساق الإجرائي", labelEn: "Procedural Angle", icon: "git-branch", desc: "هل الإجراءات سليمة؟ هل توجد ثغرات إجرائية؟" },
] as const

export const ADVERSARY_TRANSFER_STATUS = [
  { value: "none", label: "بدون نقل", color: "slate" },
  { value: "requested", label: "طُلب النقل", color: "amber" },
  { value: "transferred", label: "نُقل للقاضي", color: "emerald" },
  { value: "rejected", label: "رُفض النقل", color: "red" },
] as const

// ═══════════════════════════════════════════════════════════════════
// AUDIT LOG (§87) — source separates system proposals from judge decisions
// ═══════════════════════════════════════════════════════════════════

export const AUDIT_SOURCES = [
  { value: "system_proposal", label: "اقتراح النظام", labelEn: "System Proposal", color: "amber", icon: "bot" },
  { value: "judge_decision", label: "قرار القاضي", labelEn: "Judge Decision", color: "emerald", icon: "gavel" },
  { value: "system_action", label: "إجراء النظام", labelEn: "System Action", color: "blue", icon: "cog" },
  { value: "adversary_transfer", label: "نقل من المراجعة الخصومية", labelEn: "Adversary Transfer", color: "violet", icon: "arrow-right-left" },
  { value: "audit", label: "تدقيق", labelEn: "Audit", color: "slate", icon: "shield-check" },
] as const

export const AUDIT_ACTORS = [
  { value: "system", label: "النظام", color: "blue" },
  { value: "judge", label: "القاضي", color: "emerald" },
  { value: "rapporteur", label: "المقرر", color: "amber" },
  { value: "administrator", label: "المدير", color: "violet" },
] as const

// ═══════════════════════════════════════════════════════════════════
// JUDGE NOTES
// ═══════════════════════════════════════════════════════════════════

export const NOTE_ITEM_TYPES = [
  { value: "general", label: "ملاحظة عامة", icon: "sticky-note" },
  { value: "fact", label: "ملاحظة على واقعة", icon: "file-text" },
  { value: "evidence", label: "ملاحظة على دليل", icon: "folder" },
  { value: "authority", label: "ملاحظة على سلطة", icon: "scale" },
  { value: "issue", label: "ملاحظة على مسألة", icon: "git-branch" },
  { value: "adversary", label: "ملاحظة على مراجعة خصومية", icon: "swords" },
] as const
