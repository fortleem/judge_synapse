// Egyptian Judicial Brain V2.1 — Legal Deadlines Engine
// Computes procedural deadlines per Egyptian law:
// - قانون المرافعات المدنية والتجارية (13/1968)
// - قانون الإجراءات الجنائية (150/1950)
// - القانون المدني (131/1948)
// - قانون مجلس الدولة (47/1972)

export interface DeadlineDefinition {
  type: string
  label: string
  labelEn: string
  days: number
  unit: "days" | "years"
  legalBasis: string
  legalDomain: string
  startsFrom: string // description of when the period starts
  defendantAbroadDays?: number // extended period if defendant is abroad
  notes: string
}

// ─── Real Egyptian legal deadlines (sourced from official statutes) ─
export const LEGAL_DEADLINES: DeadlineDefinition[] = [
  // ── قانون المرافعات (Civil/Commercial Procedures) ──
  {
    type: "appeal_civil",
    label: "استئناف الحكم المدني/التجاري",
    labelEn: "Civil/Commercial Appeal",
    days: 40, unit: "days",
    legalBasis: "مادة 215 من قانون المرافعات 13/1968",
    legalDomain: "مرافعات",
    startsFrom: "تاريخ الحكم الحضوري، أو تاريخ إعلان الحكم الغيابي",
    defendantAbroadDays: 60,
    notes: "يُضاف ميعاد مسافة الطريق. لا يجوز الطعن بالاستئناف بعد فوات الميعاد إلا بطلب قبول ولأسباب قاهرة.",
  },
  {
    type: "cassation_civil",
    label: "الطعن بالنقض (مدني/تجاري)",
    labelEn: "Cassation (Civil/Commercial)",
    days: 40, unit: "days",
    legalBasis: "مادة 253 من قانون المرافعات 13/1968",
    legalDomain: "مرافعات",
    startsFrom: "تاريخ الحكم الحضوري، أو تاريخ إعلان الحكم الغيابي",
    defendantAbroadDays: 60,
    notes: "الطعن بالنقض يوقف التنفيذ في الأحكام الصادرة بماليّة. يُرفع الطعن بصحيفة تودع قلم كتاب المحكمة.",
  },
  {
    type: "opposition_absentia",
    label: "المعارضة في الحكم الغيابي",
    labelEn: "Opposition to Default Judgment",
    days: 10, unit: "days",
    legalBasis: "مادة 213 من قانون المرافعات 13/1968",
    legalDomain: "مرافعات",
    startsFrom: "تاريخ إعلان الحكم الغيابي للمحكوم عليه",
    defendantAbroadDays: 15,
    notes: "تُرفع المعارضة بصحيفة تُعلن للخصم. لا تُقبل المعارضة بعد فوات الميعاد.",
  },
  {
    type: "reconsideration",
    label: "الالتماس لإعادة النظر",
    labelEn: "Petition for Reconsideration",
    days: 40, unit: "days",
    legalBasis: "مادة 241 من قانون المرافعات 13/1968",
    legalDomain: "مرافعات",
    startsFrom: "تاريخ العلم بالقرار أو الحادث الذي يبرر الالتماس",
    notes: "يُرفع الالتماس إلى المحكمة التي أصدرت الحكم. لا يُقبل إلا للأسباب المحددة قانوناً (تزوير، خطأ واقعي، إلخ).",
  },
  {
    type: "service_notice",
    label: "إعلان الجلسة قبل الانعقاد",
    labelEn: "Hearing Notice Period",
    days: 8, unit: "days",
    legalBasis: "مادة 68 من قانون المرافعات 13/1968",
    legalDomain: "مرافعات",
    startsFrom: "تاريخ تحديد الجلسة",
    notes: "يجب إعلان الخصوم قبل الجلسة بثمانية أيام على الأقل، ما لم ينص القانون على غير ذلك. يجوز للمحكمة تقصير الميعاد لأسباب عاجلة.",
  },

  // ── قانون الإجراءات الجنائية (Criminal Procedures) ──
  {
    type: "appeal_misdemeanor",
    label: "استئناف حكم الجنح",
    labelEn: "Misdemeanor Appeal",
    days: 10, unit: "days",
    legalBasis: "مادة 402 من قانون الإجراءات الجنائية 150/1950",
    legalDomain: "جنائي",
    startsFrom: "تاريخ النطق بالحكم الحضوري، أو إعلان الغيابي",
    notes: "يبدأ الميعاد من تاريخ النطق بالحكم بالنسبة للنيابة العامة والمحكوم عليه الحاضر.",
  },
  {
    type: "cassation_felony",
    label: "الطعن بالنقض في الجنايات",
    labelEn: "Cassation (Felony)",
    days: 60, unit: "days",
    legalBasis: "مادة 346 من قانون الإجراءات الجنائية 150/1950",
    legalDomain: "جنائي",
    startsFrom: "تاريخ النطق بالحكم الحضوري، أو إعلان الغيابي",
    notes: "النقض في الجنايات لا يوقف التنفيذ إلا بقرار من المحكمة.",
  },
  {
    type: "opposition_criminal_absentia",
    label: "المعارضة في الحكم الجنائي الغيابي",
    labelEn: "Opposition to Criminal Default Judgment",
    days: 10, unit: "days",
    legalBasis: "مادة 394 من قانون الإجراءات الجنائية 150/1950",
    legalDomain: "جنائي",
    startsFrom: "تاريخ إعلان الحكم الغيابي",
    notes: "تُقبل المعارضة من المحكوم عليه الغيابي خلال 10 أيام من إعلانه بالحكم.",
  },

  // ── القانون المدني — التقادم (Civil Code — Prescription) ──
  {
    type: "prescription_15yr",
    label: "تقادم العقارات (15 سنة)",
    labelEn: "Real Estate Prescription (15 years)",
    days: 15, unit: "years",
    legalBasis: "مادة 368 من القانون المدني 131/1948",
    legalDomain: "مدني",
    startsFrom: "تاريخ بدء الحيازة أو ثبوت الحق",
    notes: "تتقادم الدعاوى العقارية بمضي 15 سنة. التقادم الطويل المكسب للملكية بالحيازة.",
  },
  {
    type: "prescription_5yr",
    label: "تقادم الالتزامات التجارية (5 سنوات)",
    labelEn: "Commercial Obligations Prescription (5 years)",
    days: 5, unit: "years",
    legalBasis: "مادة 374 من القانون المدني 131/1948",
    legalDomain: "تجاري",
    startsFrom: "تاريخ استحقاق الالتزام",
    notes: "تتقادم بخمس سنوات الالتزامات التجارية والأجور والرواتب والمعاشات.",
  },
  {
    type: "prescription_3yr",
    label: "تقادم الالتزامات المدنية (3 سنوات)",
    labelEn: "Civil Obligations Prescription (3 years)",
    days: 3, unit: "years",
    legalBasis: "مادة 378 من القانون المدني 131/1948",
    legalDomain: "مدني",
    startsFrom: "تاريخ استحقاق الالتزام",
    notes: "تتقادم بثلاث سنوات الالتزامات المدنية العامة التي لا تحدد لها مدة خاصة.",
  },

  // ── قانون مجلس الدولة (State Council Law) ──
  {
    type: "admin_annulment",
    label: "الطعن في القرار الإداري بالإلغاء",
    labelEn: "Administrative Decision Annulment",
    days: 60, unit: "days",
    legalBasis: "مادة 24 من قانون مجلس الدولة 47/1972",
    legalDomain: "إداري",
    startsFrom: "تاريخ نشر القرار أو إعلانه للمعني",
    notes: "تُرفع دعوى الإلغاء خلال 60 يوماً من تاريخ النشر في الجريدة الرسمية أو إعلان القرار. يسقط الحق في الطعن بعد فوات الميعاد.",
  },
]

// ─── Deadline calculator ────────────────────────────────────────
// Computes the actual deadline date from a start date + deadline type.
// Egyptian law: deadlines exclude the day of the event but include the last day.
// If the last day is a Friday or official holiday, it extends to the next working day.
export function computeDeadline(
  startDate: Date,
  deadlineType: string,
  defendantAbroad = false,
): { deadline: Date; daysAllowed: number; definition: DeadlineDefinition } | null {
  const def = LEGAL_DEADLINES.find((d) => d.type === deadlineType)
  if (!def) return null

  const baseDays = defendantAbroad && def.defendantAbroadDays ? def.defendantAbroadDays : def.days

  const deadline = new Date(startDate)
  if (def.unit === "days") {
    // Start counting from the day AFTER the event
    deadline.setDate(deadline.getDate() + 1)
    deadline.setDate(deadline.getDate() + baseDays - 1)
    // Adjust for Friday (Egyptian weekend) — if deadline falls on Friday, extend to Saturday
    while (deadline.getDay() === 5) { // 5 = Friday
      deadline.setDate(deadline.getDate() + 1)
    }
  } else {
    // years — add calendar years
    deadline.setFullYear(deadline.getFullYear() + baseDays)
  }

  return { deadline, daysAllowed: baseDays, definition: def }
}

// ─── Deadline status checker ────────────────────────────────────
export function getDeadlineStatus(computedDeadline: Date): "pending" | "approaching" | "expired" {
  const now = new Date()
  const diffMs = computedDeadline.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return "expired"
  if (diffDays <= 7) return "approaching" // within 7 days = urgent
  return "pending"
}

export function daysUntilDeadline(computedDeadline: Date): number {
  const diffMs = computedDeadline.getTime() - Date.now()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}
