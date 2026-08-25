// Egyptian Judicial Brain V2.1 — Court Types Registry
// All Egyptian court types with their jurisdictions and specializations
// Per Constitution Articles 184-195 + specialized court laws

export interface CourtType {
  value: string
  name: string
  nameEn: string
  jurisdiction: string
  legalBasis: string
  specialization: string
  levels: string[]
  color: string
  icon: string
}

export const COURT_TYPES: CourtType[] = [
  {
    value: "civil_court",
    name: "المحكمة المدنية",
    nameEn: "Civil Court",
    jurisdiction: "مدني — منازعات بين الأفراد",
    legalBasis: "قانون السلطة القضائية 46/1972",
    specialization: "المنازعات المدنية والتجارية والأحوال الشخصية",
    levels: ["ابتدائية", "استئناف", "نقض"],
    color: "blue",
    icon: "scale",
  },
  {
    value: "commercial_court",
    name: "المحكمة التجارية",
    nameEn: "Commercial Court",
    jurisdiction: "تجاري — المنازعات التجارية",
    legalBasis: "قانون المرافعات 13/1968 — الدوائر التجارية",
    specialization: "المنازعات التجارية وعقود التجارة والشركات",
    levels: ["ابتدائية", "استئناف", "نقض"],
    color: "teal",
    icon: "briefcase",
  },
  {
    value: "economic_court",
    name: "المحكمة الاقتصادية",
    nameEn: "Economic Court",
    jurisdiction: "اقتصادي — قضايا تجارية واقتصادية وكيانية",
    legalBasis: "قانون إنشاء المحاكم الاقتصادية 120/2018",
    specialization: "الجرائم الاقتصادية، قضايا الشركات، الملكية الفكرية، الإفلاس، التحكيم",
    levels: ["ابتدائية", "استئناف"],
    color: "emerald",
    icon: "trending-up",
  },
  {
    value: "criminal_court",
    name: "المحكمة الجنائية",
    nameEn: "Criminal Court",
    jurisdiction: "جنائي — الجنايات والجنح",
    legalBasis: "قانون الإجراءات الجنائية 150/1950",
    specialization: "الجرائم الجنائية — جنايات وجنح ومخالفات",
    levels: ["ابتدائية (جنح)", "جنايات", "استئناف", "نقض"],
    color: "red",
    icon: "gavel",
  },
  {
    value: "cassation",
    name: "محكمة النقض",
    nameEn: "Court of Cassation",
    jurisdiction: "نقض — أعلى محكمة في النظام القضائي العادي",
    legalBasis: "قانون السلطة القضائية 46/1972 — المادة 162",
    specialization: "الطعن بالنقض في الأحكام المدنية والتجارية والجنائية — توحيد المبادئ القضائية",
    levels: ["نقض"],
    color: "gold",
    icon: "crown",
  },
  {
    value: "appeal_court",
    name: "محكمة الاستئناف",
    nameEn: "Court of Appeal",
    jurisdiction: "استئناف — الطعن في أحكام المحاكم الابتدائية",
    legalBasis: "قانون السلطة القضائية 46/1972",
    specialization: "الاستئناف في القضايا المدنية والتجارية والجنائية",
    levels: ["استئناف"],
    color: "violet",
    icon: "git-branch",
  },
  {
    value: "primary_court",
    name: "المحكمة الابتدائية",
    nameEn: "Primary Court",
    jurisdiction: "ابتدائية — أول درجة تقاضي",
    legalBasis: "قانون السلطة القضائية 46/1972",
    specialization: "القضايا المدنية والتجارية والأحوال الشخصية — أول درجة",
    levels: ["ابتدائية", "جزئية", "كلية"],
    color: "blue",
    icon: "building",
  },
  {
    value: "state_council",
    name: "مجلس الدولة",
    nameEn: "State Council (Majlis al-Dawla)",
    jurisdiction: "إداري — القضاء الإداري والتأديبي والاستشاري",
    legalBasis: "قانون مجلس الدولة 47/1972 — المادة 1",
    specialization: "إلغاء القرارات الإدارية، التعويض عنها، المنازعات التأديبية، الرأي الاستشاري",
    levels: ["محكمة إدارية", "محكمة القضاء الإداري", "المحكمة الإدارية العليا"],
    color: "teal",
    icon: "landmark",
  },
  {
    value: "supreme_constitutional",
    name: "المحكمة الدستورية العليا",
    nameEn: "Supreme Constitutional Court",
    jurisdiction: "دستوري — الرقابة على دستورية القوانين",
    legalBasis: "قانون المحكمة الدستورية العليا 48/1979 + دستور 2014 المادة 192",
    specialization: "دستورية القوانين واللوائح، تفسير النصوص التشريعية، تنازع الاختصاص",
    levels: ["المحكمة الدستورية العليا"],
    color: "rose",
    icon: "scale",
  },
  {
    value: "family_court",
    name: "محكمة الأسرة",
    nameEn: "Family Court",
    jurisdiction: "أحوال شخصية — قضايا الأسرة",
    legalBasis: "قانون إنشاء محاكم الأسرة 10/2004",
    specialization: "الزواج، الطلاق، الحضانة، النفقة، الميراث، الولاية",
    levels: ["ابتدائية", "استئناف", "نقض"],
    color: "amber",
    icon: "users",
  },
  {
    value: "labor_court",
    name: "محكمة العمل",
    nameEn: "Labor Court",
    jurisdiction: "عمل — المنازعات العمالية",
    legalBasis: "قانون العمل 12/2003 — الباب الثالث",
    specialization: "المنازعات الفردية والجماعية للعمال، فصل العمال، الأجور، التعويضات",
    levels: ["ابتدائية", "استئناف", "نقض"],
    color: "cyan",
    icon: "hard-hat",
  },
  {
    value: "administrative_court",
    name: "المحكمة الإدارية",
    nameEn: "Administrative Court",
    jurisdiction: "إداري — أول درجة في القضاء الإداري",
    legalBasis: "قانون مجلس الدولة 47/1972 — المادة 13",
    specialization: "دعاوى الإلغاء، دعاوى التعويض، المنازعات التأديبية",
    levels: ["محكمة إدارية"],
    color: "teal",
    icon: "building-2",
  },
  {
    value: "state_security",
    name: "محكمة أمن الدولة",
    nameEn: "State Security Court",
    jurisdiction: "أمن الدولة — الجرائم الماسة بأمن الدولة",
    legalBasis: "قانون الأحكام العسكرية + استثناءات أمن الدولة",
    specialization: "الجرائم الإرهابية، التجسس، الجرائم الماسة بأمن الدولة الداخلي والخارجي",
    levels: ["ابتدائية", "عليا"],
    color: "slate",
    icon: "shield",
  },
  {
    value: "military_court",
    name: "المحكمة العسكرية",
    nameEn: "Military Court",
    jurisdiction: "عسكري — الجرائم العسكرية",
    legalBasis: "قانون الأحكام العسكرية 25/1966",
    specialization: "الجرائم العسكرية، جرائم العسكريين، الجرائم ضد القوات المسلحة",
    levels: ["ابتدائية", "عليا"],
    color: "slate",
    icon: "shield",
  },
  {
    value: "traffic_court",
    name: "محكمة المرور",
    nameEn: "Traffic Court",
    jurisdiction: "مرور — مخالفات وجنح المرور",
    legalBasis: "قانون المرور 66/1973",
    specialization: "مخالفات المرور، الجنح المرورية، حوادث الطرق",
    levels: ["ابتدائية"],
    color: "amber",
    icon: "car",
  },
]

export function findCourtType(value: string): CourtType | undefined {
  return COURT_TYPES.find((c) => c.value === value)
}
