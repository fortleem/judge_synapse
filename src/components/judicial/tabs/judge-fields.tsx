"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Gavel, Scale, FilePenLine, ShieldCheck, Loader2, Check, X, Pencil,
  AlertOctagon, Lock,
} from "lucide-react"
import { cn } from "@/lib/judicial/ui"
import {
  JUDGE_FIELD_TYPES, JUDGE_FIELD_STATUS, findConstant,
} from "@/lib/judicial/constants"
import type { CaseDetailT, JudgeFieldT } from "@/lib/judicial/schemas"
import { api } from "@/lib/judicial/api-client"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { StatusBadge, SovereignPanel } from "../ui/primitives"

const FIELD_META: Record<string, { icon: React.ReactNode; hint: string; placeholder: string }> = {
  judge_results: {
    icon: <Gavel className="h-4 w-4" />,
    hint: "النتيجة التي خلص إليها القاضي — منطوق الحكم والقرار النهائي. هذا الحقل مستقل تمامًا عن مخرجات الذكاء الاصطناعي.",
    placeholder: "أدخل نتائج القاضي… مثال: «حكمت المحكمة بإلزام المدّعى عليه بأن يؤدّي للمدّعي مبلغ…»",
  },
  judge_reasoning: {
    icon: <Scale className="h-4 w-4" />,
    hint: "تسبيب القاضي — سلسلة الاستدلال التي تربط الوقائع بالأدلة بالنصوص القانونية بالمبادئ القضائية بالنتيجة.",
    placeholder: "أدخل تسبيب القاضي… الوقائع ← الأدلة ← النصوص ← المبادئ ← التطبيق ← التسبيب",
  },
  draft: {
    icon: <FilePenLine className="h-4 w-4" />,
    hint: "المسودة — مساعدة محكومة بالصياغة. يبقى النص المُولَّد آليًا محددًا بصريًا حتى يعتمده القاضي صراحةً.",
    placeholder: "المسودة المُعتمَدة من القاضي…",
  },
  integrity_review: {
    icon: <ShieldCheck className="h-4 w-4" />,
    hint: "مراجعة سلامة الحكم — قائمة فحص: الاختصاص، الإجراءات، الوقائع، الأدلة، النسخة القانونية، السلطة، الاستشهادات، السلطة المخالفة، الدفوع، اتساق التسبيب، المنطوق.",
    placeholder: "نتيجة مراجعة سلامة الحكم…",
  },
}

export function JudgeFieldsTab({ caseDetail: c }: { caseDetail: CaseDetailT }) {
  return (
    <div className="space-y-4">
      {/* Separation reminder */}
      <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-kufi text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-0.5">
            حقول القاضي المستقلة — لا تُعدّل آليًا
          </h3>
          <p className="font-kufi text-xs text-muted-foreground leading-relaxed">
            كل تعديل يُسجَّل. لا يُدرج نص آلي في التسبيب القضائي دون موافقة القاضي الصريحة. هذه الحقول منفصلة تمامًا عن مساحة تحليل الذكاء الاصطناعي.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {JUDGE_FIELD_TYPES.map((t) => {
          const field = c.judgeFields.find((f) => f.fieldType === t.value)
          return <JudgeFieldEditor key={t.value} caseId={c.id} fieldType={t.value} field={field} />
        })}
      </div>
    </div>
  )
}

function JudgeFieldEditor({ caseId, fieldType, field }: {
  caseId: string; fieldType: string; field?: JudgeFieldT
}) {
  const qc = useQueryClient()
  const meta = FIELD_META[fieldType]
  const statusMeta = findConstant(JUDGE_FIELD_STATUS, field?.status ?? "empty")

  const [content, setContent] = React.useState(field?.content ?? "")
  const [editing, setEditing] = React.useState(false)

  React.useEffect(() => {
    if (!editing) setContent(field?.content ?? "")
  }, [field?.content, editing])

  const saveMut = useMutation({
    mutationFn: () => api.updateJudgeField(caseId, fieldType, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", caseId] })
      setEditing(false)
      toast.success("تم حفظ حقل القاضي")
    },
    onError: () => toast.error("فشل الحفظ"),
  })

  const acceptMut = useMutation({
    mutationFn: () => api.updateJudgeField(caseId, fieldType, content, "judge_accepted"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", caseId] })
      toast.success("اعتمد القاضي المحتوى")
    },
  })

  const rejectMut = useMutation({
    mutationFn: () => api.updateJudgeField(caseId, fieldType, content, "judge_rejected"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", caseId] })
      toast.success("رفض القاضي المحتوى")
    },
  })

  return (
    <SovereignPanel
      title={findConstant(JUDGE_FIELD_TYPES, fieldType)?.label}
      icon={meta.icon}
      action={field && <StatusBadge label={statusMeta?.label ?? ""} color={statusMeta?.color ?? "slate"} size="sm" />}
    >
      <p className="font-kufi text-[11px] text-muted-foreground leading-relaxed mb-2">{meta.hint}</p>

      <Textarea
        value={content}
        onChange={(e) => { setContent(e.target.value); setEditing(true) }}
        placeholder={meta.placeholder}
        className="font-serif-judicial text-sm min-h-32 leading-relaxed"
      />

      <div className="flex items-center justify-between gap-2 mt-3">
        <span className="font-kufi text-[10px] text-muted-foreground">
          {content.trim().length} حرف · {editing ? "غير محفوظ" : "محفوظ"}
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline" size="sm"
            onClick={() => rejectMut.mutate()}
            disabled={rejectMut.isPending || !content.trim()}
            className="font-kufi text-xs h-7 border-red-500/40 text-red-500 hover:bg-red-500/10"
          >
            {rejectMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            رفض
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={() => acceptMut.mutate()}
            disabled={acceptMut.isPending || !content.trim()}
            className="font-kufi text-xs h-7 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
          >
            {acceptMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            اعتماد
          </Button>
          <Button
            size="sm"
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending || !content.trim()}
            className="font-kufi text-xs h-7 bg-amber-600 hover:bg-amber-700 text-white"
          >
            {saveMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
            حفظ
          </Button>
        </div>
      </div>
    </SovereignPanel>
  )
}
