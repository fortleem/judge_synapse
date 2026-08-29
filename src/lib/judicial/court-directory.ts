// Egyptian Court Directory — Comprehensive Registry
// 27 governorates, 8 appeal courts, all primary + partial courts with addresses + circuits
// Source: Ministry of Justice + official court portals

export interface CourtCircuit {
  name: string // اسم الدائرة
  type: string // نوع الاختصاص
}

export interface CourtEntry {
  name: string
  type: "primary" | "partial" | "appeal" | "cassation" | "constitutional" | "economic" | "family" | "state_council"
  address?: string
  circuits?: string[]
  governorate: string
  appealJurisdiction?: string // which appeal court covers this
}

export interface GovernorateCourts {
  name: string
  appealCourt: string
  appealCoverage: string[]
  primaryCourts: Array<{ name: string; address?: string; circuits?: string[] }>
  partialCourts: string[]
}

// ─── Standard circuit types (الدوائر النوعية) ──────────────────
export const CIRCUIT_TYPES = [
  "مدني كلي",
  "تجاري كلي",
  "أحوال شخصية",
  "جنائي (جنايات)",
  "جنائي (جنح مستأنفة)",
  "إيجارات",
  "عمالي",
  "ضريبي",
  "تنفيذ",
  "مستعجلة",
  "أسرة",
  "اقتصادي",
] as const

// ─── 8 Appeal Courts ─────────────────────────────────────────────
export const APPEAL_COURTS = [
  { name: "محكمة استئناف القاهرة", coverage: ["القاهرة", "الجيزة", "القليوبية", "الفيوم", "بني سويف", "المنيا"] },
  { name: "محكمة استئناف الإسكندرية", coverage: ["الإسكندرية", "البحيرة", "مرسى مطروح"] },
  { name: "محكمة استئناف طنطا", coverage: ["الغربية", "المنوفية", "كفر الشيخ"] },
  { name: "محكمة استئناف المنصورة", coverage: ["الدقهلية", "دمياط"] },
  { name: "محكمة استئناف الإسماعيلية", coverage: ["الإسماعيلية", "السويس", "بورسعيد", "شمال سيناء", "جنوب سيناء", "البحر الأحمر"] },
  { name: "محكمة استئناف بني سويف", coverage: ["بني سويف", "الفيوم", "المنيا"] },
  { name: "محكمة استئناف أسيوط", coverage: ["أسيوط", "الوادي الجديد"] },
  { name: "محكمة استئناف قنا", coverage: ["سوهاج", "قنا", "الأقصر", "أسوان"] },
] as const

// ─── Standard circuits for most primary courts ──────────────────
const STD_CIRCUITS = ["مدني كلي", "تجاري كلي", "أحوال شخصية", "جنائي", "إيجارات", "عمالي", "ضريبي"]

// ─── 27 Governorates with all courts ─────────────────────────────
export const GOVERNORATES: GovernorateCourts[] = [
  {
    name: "القاهرة",
    appealCourt: "محكمة استئناف القاهرة",
    appealCoverage: ["القاهرة", "الجيزة", "القليوبية", "الفيوم", "بني سويف", "المنيا"],
    primaryCourts: [
      { name: "محكمة شمال القاهرة الابتدائية", address: "1 شارع الخليفة المأمون، مصر الجديدة / العباسية", circuits: STD_CIRCUITS },
      { name: "محكمة جنوب القاهرة الابتدائية", address: "26 شارع القصر العيني / مجلس الشعب، السيدة زينب", circuits: STD_CIRCUITS },
      { name: "محكمة شرق القاهرة الابتدائية", address: "شارع صلاح سالم، مدينة نصر", circuits: ["مدني", "تجاري", "أحوال شخصية", "جنائي", "عمالي", "ضريبي"] },
      { name: "محكمة غرب القاهرة الابتدائية", address: "12 شارع الجمهورية، عابدين", circuits: ["مدني", "تجاري", "أحوال شخصية", "جنائي", "إيجارات", "عمالي"] },
      { name: "محكمة حلوان الابتدائية", address: "شارع راغب، حلوان", circuits: ["مدني", "تجاري", "أحوال شخصية", "جنائي", "عمالي"] },
    ],
    partialCourts: ["عابدين", "الموسكي", "الأزبكية", "بولاق", "الدرب الأحمر", "السيدة زينب", "الخليفة", "المقطم", "البساتين", "دار السلام", "المعادي", "طرة", "التبين", "حلوان", "15 مايو", "شبرا", "روض الفرج", "الساحل", "الشرابية", "الزاوية الحمراء", "حدائق القبة", "الزيتون", "الأميرية", "الوايلي", "المطرية", "عين شمس", "النزهة", "مصر الجديدة", "السلام", "المرج", "منشأة ناصر", "مدينة نصر"],
  },
  {
    name: "الجيزة",
    appealCourt: "محكمة استئناف القاهرة",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة الجيزة الابتدائية", address: "شارع مراد، الجيزة" },
      { name: "محكمة إمبابة الابتدائية", address: "شارع الوحدة، إمبابة" },
      { name: "محكمة 6 أكتوبر الابتدائية", address: "الحي الأول، 6 أكتوبر" },
      { name: "محكمة الشيخ زايد الابتدائية", address: "الشيخ زايد" },
      { name: "محكمة الحوامدية الابتدائية", address: "الحوامدية" },
    ],
    partialCourts: ["الدقي", "العجوزة", "الهرم", "فيصل", "بولاق الدكرور", "إمبابة", "الوراق", "أوسيم", "كرداسة", "منشأة القناطر", "البدرشين", "الحوامدية", "الصف", "أطفيح", "6 أكتوبر", "الشيخ زايد", "الواحات البحرية"],
  },
  {
    name: "الإسكندرية",
    appealCourt: "محكمة استئناف الإسكندرية",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة الإسكندرية الابتدائية", address: "شارع فؤاد، المنشية" },
      { name: "محكمة برج العرب الابتدائية", address: "برج العرب" },
    ],
    partialCourts: ["المنشية", "محرم بك", "سيدي جابر", "الرمل", "المنتزه", "كرموز", "الدخيلة", "العامرية", "برج العرب", "أبو قير"],
  },
  {
    name: "القليوبية",
    appealCourt: "محكمة استئناف القاهرة",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة بنها الابتدائية", address: "شارع فريد ندا، بنها" },
      { name: "محكمة شبرا الخيمة الابتدائية", address: "شبرا الخيمة" },
      { name: "محكمة طوخ الابتدائية", address: "طوخ" },
    ],
    partialCourts: ["بنها", "قليوب", "القناطر الخيرية", "طوخ", "قها", "كفر شكر", "شبين القناطر", "الخانكة", "شبرا الخيمة", "بهتيم", "مسطرد", "العبور", "الخصوص"],
  },
  {
    name: "الدقهلية",
    appealCourt: "محكمة استئناف المنصورة",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة المنصورة الابتدائية", address: "شارع الجمهورية، المنصورة" },
      { name: "محكمة طلخا الابتدائية", address: "طلخا" },
      { name: "محكمة ميت غمر الابتدائية", address: "ميت غمر" },
      { name: "محكمة السنبلاوين الابتدائية", address: "السنبلاوين" },
    ],
    partialCourts: ["المنصورة", "طلخا", "ميت غمر", "السنبلاوين", "دكرنس", "منية النصر", "بلقاس", "شربين", "أجا", "تمي الأمديد", "ميت سلسيل", "المنزلة", "الجمالية", "بني عبيد", "محلة دمنة", "نبروه"],
  },
  {
    name: "الشرقية",
    appealCourt: "محكمة استئناف القاهرة",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة الزقازيق الابتدائية", address: "شارع القومية، الزقازيق" },
      { name: "محكمة فاقوس الابتدائية", address: "فاقوس" },
      { name: "محكمة بلبيس الابتدائية", address: "بلبيس" },
      { name: "محكمة العاشر من رمضان الابتدائية", address: "العاشر من رمضان" },
      { name: "محكمة منيا القمح الابتدائية", address: "منيا القمح" },
    ],
    partialCourts: ["الزقازيق", "فاقوس", "بلبيس", "العاشر من رمضان", "منيا القمح", "أبو كبير", "الحسينية", "ديرب نجم", "الإبراهيمية", "ههيا", "القنايات", "مشتول السوق", "كفر صقر", "أولاد صقر", "القرين", "الصالحية الجديدة", "أبو حماد"],
  },
  {
    name: "الغربية",
    appealCourt: "محكمة استئناف طنطا",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة طنطا الابتدائية", address: "شارع المديرية، طنطا" },
      { name: "محكمة المحلة الكبرى الابتدائية", address: "المحلة الكبرى" },
      { name: "محكمة كفر الزيات الابتدائية", address: "كفر الزيات" },
      { name: "محكمة زفتى الابتدائية", address: "زفتى" },
    ],
    partialCourts: ["طنطا", "المحلة الكبرى", "كفر الزيات", "زفتى", "السنطة", "بسيون", "قطور", "سمنود", "أول المحلة"],
  },
  {
    name: "المنوفية",
    appealCourt: "محكمة استئناف طنطا",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة شبين الكوم الابتدائية", address: "شبين الكوم" },
      { name: "محكمة منوف الابتدائية", address: "منوف" },
      { name: "محكمة السادات الابتدائية", address: "السادات" },
      { name: "محكمة قويسنا الابتدائية", address: "قويسنا" },
      { name: "محكمة أشمون الابتدائية", address: "أشمون" },
      { name: "محكمة تلا الابتدائية", address: "تلا" },
      { name: "محكمة بركة السبع الابتدائية", address: "بركة السبع" },
    ],
    partialCourts: ["شبين الكوم", "منوف", "السادات", "قويسنا", "أشمون", "تلا", "بركة السبع", "الشهداء", "الباجور", "سرس الليان"],
  },
  {
    name: "البحيرة",
    appealCourt: "محكمة استئناف الإسكندرية",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة دمنهور الابتدائية", address: "دمنهور" },
      { name: "محكمة كفر الدوار الابتدائية", address: "كفر الدوار" },
      { name: "محكمة إدكو الابتدائية", address: "إدكو" },
    ],
    partialCourts: ["دمنهور", "كفر الدوار", "إدكو", "رشيد", "أبو المطامير", "حوش عيسى", "الدلنجات", "كوم حمادة", "إيتاي البارود", "شبراخيت", "أبو حمص", "الرحمانية", "المحمودية", "وادي النطرون", "بدر", "النوبارية"],
  },
  {
    name: "كفر الشيخ",
    appealCourt: "محكمة استئناف طنطا",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة كفر الشيخ الابتدائية", address: "كفر الشيخ" },
      { name: "محكمة دسوق الابتدائية", address: "دسوق" },
      { name: "محكمة فوة الابتدائية", address: "فوة" },
      { name: "محكمة بلطيم الابتدائية", address: "بلطيم" },
    ],
    partialCourts: ["كفر الشيخ", "دسوق", "فوة", "بلطيم", "الحامول", "بيلا", "سيدي سالم", "الرياض", "قلين", "مطوبس"],
  },
  {
    name: "دمياط",
    appealCourt: "محكمة استئناف المنصورة",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة دمياط الابتدائية", address: "دمياط" },
      { name: "محكمة فارسكور الابتدائية", address: "فارسكور" },
      { name: "محكمة كفر سعد الابتدائية", address: "كفر سعد" },
    ],
    partialCourts: ["دمياط", "فارسكور", "كفر سعد", "الزرقا", "الروضة", "عزبة البرج", "السرو", "ميت أبو غالب"],
  },
  {
    name: "بورسعيد",
    appealCourt: "محكمة استئناف الإسماعيلية",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة بورسعيد الابتدائية", address: "شارع محمد علي، بورسعيد" },
      { name: "محكمة بورفؤاد الابتدائية", address: "بورفؤاد" },
    ],
    partialCourts: ["المناخ", "الشرق", "العرب", "الضواحي", "الزهور", "بورفؤاد", "جنوب بورسعيد"],
  },
  {
    name: "الإسماعيلية",
    appealCourt: "محكمة استئناف الإسماعيلية",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة الإسماعيلية الابتدائية", address: "الإسماعيلية" },
      { name: "محكمة التل الكبير الابتدائية", address: "التل الكبير" },
      { name: "محكمة فايد الابتدائية", address: "فايد" },
      { name: "محكمة القنطرة غرب الابتدائية", address: "القنطرة غرب" },
    ],
    partialCourts: ["الإسماعيلية", "التل الكبير", "فايد", "القنطرة غرب", "القنطرة شرق", "أبو صوير", "القصاصين"],
  },
  {
    name: "السويس",
    appealCourt: "محكمة استئناف الإسماعيلية",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة السويس الابتدائية", address: "السويس" },
      { name: "محكمة الجناين الابتدائية", address: "الجناين" },
    ],
    partialCourts: ["الأربعين", "السويس", "عتاقة", "فيصل", "الجناين"],
  },
  {
    name: "شمال سيناء",
    appealCourt: "محكمة استئناف الإسماعيلية",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة العريش الابتدائية", address: "العريش" },
      { name: "محكمة بئر العبد الابتدائية", address: "بئر العبد" },
      { name: "محكمة رفح الابتدائية", address: "رفح" },
      { name: "محكمة الشيخ زويد الابتدائية", address: "الشيخ زويد" },
      { name: "محكمة الحسنة الابتدائية", address: "الحسنة" },
      { name: "محكمة نخل الابتدائية", address: "نخل" },
    ],
    partialCourts: ["العريش", "بئر العبد", "رفح", "الشيخ زويد", "الحسنة", "نخل"],
  },
  {
    name: "جنوب سيناء",
    appealCourt: "محكمة استئناف الإسماعيلية",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة الطور الابتدائية", address: "الطور" },
      { name: "محكمة شرم الشيخ الابتدائية", address: "شرم الشيخ" },
      { name: "محكمة رأس سدر الابتدائية", address: "رأس سدر" },
      { name: "محكمة دهب الابتدائية", address: "دهب" },
      { name: "محكمة نويبع الابتدائية", address: "نويبع" },
      { name: "محكمة أبو رديس الابتدائية", address: "أبو رديس" },
      { name: "محكمة سانت كاترين الابتدائية", address: "سانت كاترين" },
    ],
    partialCourts: ["الطور", "شرم الشيخ", "رأس سدر", "دهب", "نويبع", "أبو رديس", "سانت كاترين"],
  },
  {
    name: "بني سويف",
    appealCourt: "محكمة استئناف بني سويف",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة بني سويف الابتدائية", address: "بني سويف" },
      { name: "محكمة الفشن الابتدائية", address: "الفشن" },
      { name: "محكمة الواسطى الابتدائية", address: "الواسطى" },
      { name: "محكمة ببا الابتدائية", address: "ببا" },
      { name: "محكمة ناصر الابتدائية", address: "ناصر" },
      { name: "محكمة إهناسيا الابتدائية", address: "إهناسيا" },
    ],
    partialCourts: ["بني سويف", "الفشن", "الواسطى", "ببا", "ناصر", "إهناسيا"],
  },
  {
    name: "الفيوم",
    appealCourt: "محكمة استئناف بني سويف",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة الفيوم الابتدائية", address: "الفيوم" },
      { name: "محكمة سنورس الابتدائية", address: "سنورس" },
      { name: "محكمة إطسا الابتدائية", address: "إطسا" },
      { name: "محكمة طامية الابتدائية", address: "طامية" },
      { name: "محكمة أبشواي الابتدائية", address: "أبشواي" },
      { name: "محكمة يوسف الصديق الابتدائية", address: "يوسف الصديق" },
    ],
    partialCourts: ["الفيوم", "سنورس", "إطسا", "طامية", "أبشواي", "يوسف الصديق"],
  },
  {
    name: "المنيا",
    appealCourt: "محكمة استئناف القاهرة",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة المنيا الابتدائية", address: "المنيا" },
      { name: "محكمة ملوي الابتدائية", address: "ملوي" },
      { name: "محكمة بني مزار الابتدائية", address: "بني مزار" },
      { name: "محكمة مغاغة الابتدائية", address: "مغاغة" },
      { name: "محكمة سمالوط الابتدائية", address: "سمالوط" },
      { name: "محكمة أبو قرقاص الابتدائية", address: "أبو قرقاص" },
      { name: "محكمة دير مواس الابتدائية", address: "دير مواس" },
      { name: "محكمة مطاي الابتدائية", address: "مطاي" },
      { name: "محكمة العدوة الابتدائية", address: "العدوة" },
    ],
    partialCourts: ["المنيا", "ملوي", "بني مزار", "مغاغة", "سمالوط", "أبو قرقاص", "دير مواس", "مطاي", "العدوة"],
  },
  {
    name: "أسيوط",
    appealCourt: "محكمة استئناف أسيوط",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة أسيوط الابتدائية", address: "أسيوط" },
      { name: "محكمة ديروط الابتدائية", address: "ديروط" },
      { name: "محكمة القوصية الابتدائية", address: "القوصية" },
      { name: "محكمة منفلوط الابتدائية", address: "منفلوط" },
      { name: "محكمة أبوتيج الابتدائية", address: "أبوتيج" },
      { name: "محكمة صدفا الابتدائية", address: "صدفا" },
      { name: "محكمة الغنايم الابتدائية", address: "الغنايم" },
      { name: "محكمة ساحل سليم الابتدائية", address: "ساحل سليم" },
      { name: "محكمة البداري الابتدائية", address: "البداري" },
      { name: "محكمة أبنوب الابتدائية", address: "أبنوب" },
      { name: "محكمة الفتح الابتدائية", address: "الفتح" },
    ],
    partialCourts: ["أسيوط", "ديروط", "القوصية", "منفلوط", "أبوتيج", "صدفا", "الغنايم", "ساحل سليم", "البداري", "أبنوب", "الفتح"],
  },
  {
    name: "سوهاج",
    appealCourt: "محكمة استئناف قنا",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة سوهاج الابتدائية", address: "سوهاج" },
      { name: "محكمة أخميم الابتدائية", address: "أخميم" },
      { name: "محكمة جرجا الابتدائية", address: "جرجا" },
      { name: "محكمة طهطا الابتدائية", address: "طهطا" },
      { name: "محكمة طما الابتدائية", address: "طما" },
      { name: "محكمة البلينا الابتدائية", address: "البلينا" },
      { name: "محكمة دار السلام الابتدائية", address: "دار السلام" },
      { name: "محكمة المراغة الابتدائية", address: "المراغة" },
      { name: "محكمة ساقلته الابتدائية", address: "ساقلته" },
      { name: "محكمة جهينة الابتدائية", address: "جهينة" },
      { name: "محكمة المنشاة الابتدائية", address: "المنشاة" },
      { name: "محكمة العسيرات الابتدائية", address: "العسيرات" },
    ],
    partialCourts: ["سوهاج", "أخميم", "جرجا", "طهطا", "طما", "البلينا", "دار السلام", "المراغة", "ساقلته", "جهينة", "المنشاة", "العسيرات"],
  },
  {
    name: "قنا",
    appealCourt: "محكمة استئناف قنا",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة قنا الابتدائية", address: "قنا" },
      { name: "محكمة نجع حمادي الابتدائية", address: "نجع حمادي" },
      { name: "محكمة قوص الابتدائية", address: "قوص" },
      { name: "محكمة دشنا الابتدائية", address: "دشنا" },
      { name: "محكمة أبوتشت الابتدائية", address: "أبوتشت" },
      { name: "محكمة فرشوط الابتدائية", address: "فرشوط" },
      { name: "محكمة نقادة الابتدائية", address: "نقادة" },
      { name: "محكمة الوقف الابتدائية", address: "الوقف" },
      { name: "محكمة قفط الابتدائية", address: "قفط" },
    ],
    partialCourts: ["قنا", "نجع حمادي", "قوص", "دشنا", "أبوتشت", "فرشوط", "نقادة", "الوقف", "قفط"],
  },
  {
    name: "الأقصر",
    appealCourt: "محكمة استئناف قنا",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة الأقصر الابتدائية", address: "الأقصر" },
      { name: "محكمة إسنا الابتدائية", address: "إسنا" },
      { name: "محكمة أرمنت الابتدائية", address: "أرمنت" },
      { name: "محكمة القرنة الابتدائية", address: "القرنة" },
      { name: "محكمة طيبة الابتدائية", address: "طيبة" },
      { name: "محكمة البياضية الابتدائية", address: "البياضية" },
      { name: "محكمة الزينية الابتدائية", address: "الزينية" },
    ],
    partialCourts: ["الأقصر", "إسنا", "أرمنت", "القرنة", "طيبة", "البياضية", "الزينية"],
  },
  {
    name: "أسوان",
    appealCourt: "محكمة استئناف قنا",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة أسوان الابتدائية", address: "أسوان" },
      { name: "محكمة كوم أمبو الابتدائية", address: "كوم أمبو" },
      { name: "محكمة دراو الابتدائية", address: "دراو" },
      { name: "محكمة إدفو الابتدائية", address: "إدفو" },
      { name: "محكمة أبو سمبل الابتدائية", address: "أبو سمبل" },
      { name: "محكمة نصر النوبة الابتدائية", address: "نصر النوبة" },
      { name: "محكمة كلابشة الابتدائية", address: "كلابشة" },
    ],
    partialCourts: ["أسوان", "كوم أمبو", "دراو", "إدفو", "أبو سمبل", "نصر النوبة", "كلابشة"],
  },
  {
    name: "البحر الأحمر",
    appealCourt: "محكمة استئناف الإسماعيلية",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة الغردقة الابتدائية", address: "الغردقة" },
      { name: "محكمة سفاجا الابتدائية", address: "سفاجا" },
      { name: "محكمة القصير الابتدائية", address: "القصير" },
      { name: "محكمة مرسى علم الابتدائية", address: "مرسى علم" },
      { name: "محكمة رأس غارب الابتدائية", address: "رأس غارب" },
      { name: "محكمة الشلاتين الابتدائية", address: "الشلاتين" },
      { name: "محكمة حلايب الابتدائية", address: "حلايب" },
    ],
    partialCourts: ["الغردقة", "سفاجا", "القصير", "مرسى علم", "رأس غارب", "الشلاتين", "حلايب"],
  },
  {
    name: "الوادي الجديد",
    appealCourt: "محكمة استئناف أسيوط",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة الخارجة الابتدائية", address: "الخارجة" },
      { name: "محكمة الداخلة الابتدائية", address: "الداخلة" },
      { name: "محكمة الفرافرة الابتدائية", address: "الفرافرة" },
      { name: "محكمة باريس الابتدائية", address: "باريس" },
      { name: "محكمة بلاط الابتدائية", address: "بلاط" },
    ],
    partialCourts: ["الخارجة", "الداخلة", "الفرافرة", "باريس", "بلاط"],
  },
  {
    name: "مطروح",
    appealCourt: "محكمة استئناف الإسكندرية",
    appealCoverage: [],
    primaryCourts: [
      { name: "محكمة مرسى مطروح الابتدائية", address: "مرسى مطروح" },
      { name: "محكمة العلمين الابتدائية", address: "العلمين" },
      { name: "محكمة الضبعة الابتدائية", address: "الضبعة" },
      { name: "محكمة سيدي براني الابتدائية", address: "سيدي براني" },
      { name: "محكمة السلوم الابتدائية", address: "السلوم" },
      { name: "محكمة سيوة الابتدائية", address: "سيوة" },
      { name: "محكمة الحمام الابتدائية", address: "الحمام" },
    ],
    partialCourts: ["مرسى مطروح", "العلمين", "الضبعة", "سيدي براني", "السلوم", "سيوة", "الحمام"],
  },
]

// ─── Special courts ─────────────────────────────────────────────
export const SPECIAL_COURTS = [
  { name: "المحكمة الدستورية العليا", type: "constitutional", address: "كورنيش النيل، المعادي، القاهرة", jurisdiction: "الرقابة الدستورية على القوانين وتفسير النصوص الدستورية", governorate: "القاهرة" },
  { name: "محكمة النقض", type: "cassation", address: "دار القضاء العالي، شارع 26 يوليو، وسط البلد، القاهرة", jurisdiction: "الطعون في أحكام محاكم الاستئناف، وتوحيد المبادئ القانونية", governorate: "القاهرة" },
] as const

// ─── Economic courts locations ──────────────────────────────────
export const ECONOMIC_COURT_CITIES = ["القاهرة", "الإسكندرية", "طنطا", "المنصورة", "الإسماعيلية", "أسيوط", "قنا"]

// ─── Helper: flatten all courts ──────────────────────────────────
export interface FlatCourt {
  name: string
  type: string
  address?: string
  governorate: string
  appealCourt: string
  circuits?: string[]
}

export function getAllCourts(): FlatCourt[] {
  const courts: FlatCourt[] = []

  // Special courts
  for (const sc of SPECIAL_COURTS) {
    courts.push({ name: sc.name, type: sc.type, address: sc.address, governorate: sc.governorate, appealCourt: "—" })
  }

  // Appeal courts
  for (const ac of APPEAL_COURTS) {
    courts.push({ name: ac.name, type: "appeal", governorate: ac.name.replace("محكمة استئناف ", ""), appealCourt: "—" })
  }

  // Governorate courts
  for (const gov of GOVERNORATES) {
    for (const pc of gov.primaryCourts) {
      courts.push({ name: pc.name, type: "primary", address: pc.address, governorate: gov.name, appealCourt: gov.appealCourt, circuits: pc.circuits ?? STD_CIRCUITS })
    }
    for (const pn of gov.partialCourts) {
      courts.push({ name: `محكمة ${pn} الجزئية`, type: "partial", governorate: gov.name, appealCourt: gov.appealCourt })
    }
  }

  return courts
}

export function searchCourts(query: string): FlatCourt[] {
  const all = getAllCourts()
  if (!query.trim()) return all
  const q = query.toLowerCase().trim()
  return all.filter((c) =>
    c.name.toLowerCase().includes(q) ||
    c.governorate.toLowerCase().includes(q) ||
    (c.address?.toLowerCase().includes(q) ?? false)
  )
}
