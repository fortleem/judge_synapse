"use client"

import * as React from "react"
import { useQueryClient, useMutation } from "@tanstack/react-query"
import {
  FileText, Copy, Check, Loader2, Download, Sparkles,
} from "lucide-react"
import { cn } from "@/lib/judicial/ui"
import type { CaseDetailT } from "@/lib/judicial/schemas"
import { api } from "@/lib/judicial/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SovereignPanel, StatusBadge } from "../ui/primitives"

// 12-section verdict template per Egyptian judicial practice
const VERDICT_SECTIONS = [
  { key: "preamble", title: "الديباجة", placeholder: "باسم الشعب… المحكمة… الدائرة… في الجلسة العلنية المنعقدة…", auto: (c: CaseDetailT) => `باسم الشعب\n${c.court} — ${c.circuit}\nفي الدعوى رقم ${c.caseNumber}` },
  { key: "parties", title: "الأطراف", placeholder: "المدّعي… المدّعى عليه…", auto: (c: CaseDetailT) => c.parties },
  { key: "subject", title: "موضوع الدعوى", placeholder: "موضوع الدعوى…", auto: (c: CaseDetailT) => c.subjectMatter },
  { key: "facts", title: "الوقائع", placeholder: "الوقائع المتعلقة بالدعوى…", auto: (c: CaseDetailT) => c.summary },
  { key: "procedural", title: "الإجراءات", placeholder: "الإجراءات الإجرائية…", auto: (c: CaseDetailT) => `أقيمت الدعوى بتاريخ ${c.filedDate?.slice(0,10) ?? ""} وحُددت للجلسة…` },
  { key: "defenses", title: "الدفوع", placeholder: "دفوع الخصوم…", auto: (c: CaseDetailT) => "" },
  { key: "evidence", title: "الأدلة", placeholder: "الأدلة المقدّمة…", auto: (c: CaseDetailT) => "" },
  { key: "law", title: "النصوص القانونية", placeholder: "النصوص القانونية المنطبقة…", auto: (c: CaseDetailT) => c.authorities.filter(a => a.stance === "supporting").map(a => `- ${a.title} (${a.citation})`).join("\n") },
  { key: "principles", title: "المبادئ القضائية", placeholder: "المبادئ القضائية المؤيِّدة…", auto: (c: CaseDetailT) => "" },
  { key: "application", title: "التطبيق", placeholder: "تطبيق النصوص على الوقائع…", auto: (c: CaseDetailT) => "" },
  { key: "reasoning", title: "التسبيب", placeholder: "أسباب الحكم…", auto: (c: CaseDetailT) => "" },
  { key: "verdict", title: "المنطوق", placeholder: "حكمت المحكمة…", auto: (c: CaseDetailT) => "" },
] as const

export function VerdictDraftTab({ caseDetail: c }: { caseDetail: CaseDetailT }) {
  const qc = useQueryClient()
  const [sections, setSections] = React.useState<Record<string, string>>({})
  const [activeSection, setActiveSection] = React.useState<string>("preamble")
  const [copied, setCopied] = React.useState(false)

  // Auto-fill from case data on first load
  React.useEffect(() => {
    if (Object.keys(sections).length === 0) {
      const auto: Record<string, string> = {}
      for (const s of VERDICT_SECTIONS) {
        auto[s.key] = s.auto(c) || ""
      }
      setSections(auto)
    }
  }, [c, sections])

  const saveMut = useMutation({
    mutationFn: () => api.updateJudgeField(c.id, "draft", sections["verdict"] + "\n\n---\n\n" + JSON.stringify(sections)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", c.id] })
      toast.success("تم حفظ المسودة")
    },
    onError: () => toast.error("فشل الحفظ"),
  })

  const aiFillMut = useMutation({
    mutationFn: (sectionKey: string) => api.aiAssist(c.id, "drafting", `صُغ قسم "${VERDICT_SECTIONS.find(s => s.key === sectionKey)?.title}" من الحكم بناءً على بيانات القضية التالية:\n\nالعنوان: ${c.title}\nالوقائع: ${c.summary}\nالأطراف: ${c.parties}\nالسلطات: ${c.authorities.map(a => a.title).join(", ")}\n\nاكتب قسم "${VERDICT_SECTIONS.find(s => s.key === sectionKey)?.title}" فقط.`),
    onSuccess: (result: any) => {
      const content = result?.data?.content ?? result?.content
      if (content) {
        setSections(prev => ({ ...prev, [activeSection]: content }))
        toast.success("تم توليد القسم بالذكاء الاصطناعي — غير مُلزِم")
      } else {
        toast.warning("تعذّر توليد القسم — تحقّق من مفاتيح API")
      }
    },
    onError: () => toast.error("فشل التوليد"),
  })

  const exportText = () => {
    const full = VERDICT_SECTIONS.map(s => `### ${s.title}\n\n${sections[s.key] || s.placeholder}`).join("\n\n---\n\n")
    const blob = new Blob([full], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `حكم-${c.caseNumber}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("تم تصدير المسودة")
  }

  const copyAll = () => {
    const full = VERDICT_SECTIONS.map(s => `${s.title}\n${sections[s.key] || ""}`).join("\n\n")
    navigator.clipboard.writeText(full)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("تم نسخ المسودة")
  }

  return (
    <div className="space-y-4">
      <SovereignPanel
        title="مساعد صياغة الحكم — 12 قسم"
        icon={<FileText className="h-4 w-4" />}
        accent
        action={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={copyAll} className="font-kufi text-xs">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              نسخ
            </Button>
            <Button size="sm" variant="outline" onClick={exportText} className="font-kufi text-xs">
              <Download className="h-3.5 w-3.5" />
              تصدير
            </Button>
            <Button size="sm" onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="font-kufi text-xs bg-amber-600 hover:bg-amber-700 text-white">
              {saveMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              حفظ
            </Button>
          </div>
        }
      >
        <p className="font-kufi text-xs text-muted-foreground mb-3 leading-relaxed">
          مساعدة محكومة بالصياغة. كل قسم مرتبط ببيانات القضية (أطراف، وقائع، سلطات قانونية). يمكن توليد أي قسم بالذكاء الاصطناعي (غير مُلزِم). النسخ والتصدير متاحان.
        </p>

        {/* Section tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scroll-sovereign pb-2 mb-3">
          {VERDICT_SECTIONS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 font-kufi text-[11px] whitespace-nowrap transition-all active:scale-95",
                activeSection === s.key ? "bg-amber-500/15 text-amber-700 font-semibold" : "bg-muted/50 text-muted-foreground"
              )}
            >
              <span className="font-jetbrains text-[9px] opacity-50">{i + 1}</span>
              {s.title}
              {sections[s.key] && sections[s.key].length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
            </button>
          ))}
        </div>

        {/* Active section editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-kufi text-sm font-semibold">
              {VERDICT_SECTIONS.find(s => s.key === activeSection)?.title}
            </h4>
            <Button
              size="sm"
              variant="outline"
              onClick={() => aiFillMut.mutate(activeSection)}
              disabled={aiFillMut.isPending}
              className="font-kufi text-[11px] border-violet-500/40 text-violet-600 hover:bg-violet-500/10"
            >
              {aiFillMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              توليد AI
            </Button>
          </div>
          <Textarea
            value={sections[activeSection] ?? ""}
            onChange={(e) => setSections(prev => ({ ...prev, [activeSection]: e.target.value }))}
            placeholder={VERDICT_SECTIONS.find(s => s.key === activeSection)?.placeholder}
            className="font-serif-judicial text-sm min-h-32 leading-relaxed"
          />
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/40">
          <span className="font-kufi text-[10px] text-muted-foreground">التقدّم:</span>
          <div className="flex items-center gap-1">
            {VERDICT_SECTIONS.map((s) => (
              <span key={s.key} className={cn("h-1.5 rounded-full transition-all", sections[s.key]?.length > 0 ? "w-4 bg-emerald-500" : "w-2 bg-muted")} />
            ))}
          </div>
          <span className="font-jetbrains text-[10px] text-muted-foreground">
            {VERDICT_SECTIONS.filter(s => sections[s.key]?.length > 0).length}/12
          </span>
        </div>
      </SovereignPanel>
    </div>
  )
}
