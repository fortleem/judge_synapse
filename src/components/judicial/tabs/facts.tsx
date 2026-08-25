"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, Loader2, BookOpen, CheckCircle2, XCircle, HelpCircle } from "lucide-react"
import { cn, colorClasses } from "@/lib/judicial/ui"
import { FACT_STATUSES, FACT_MATERIALITY, findConstant } from "@/lib/judicial/constants"
import type { CaseDetailT, FactT } from "@/lib/judicial/schemas"
import { api } from "@/lib/judicial/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { SovereignPanel, StatusBadge, EmptyState } from "../ui/primitives"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"

const STATUS_META: Record<string, { group: "proven" | "disputed" | "unsettled"; color: string; label: string }> = {
  judicially_established: { group: "proven", color: "emerald", label: "مثبتة قضائيًا" },
  undisputed: { group: "proven", color: "blue", label: "غير متنازع عليها" },
  admitted: { group: "proven", color: "blue", label: "مُقَرّ بها" },
  supported: { group: "proven", color: "teal", label: "مؤيّدة بالدليل" },
  denied: { group: "disputed", color: "red", label: "منكَرة" },
  contradicted: { group: "disputed", color: "orange", label: "معارَضة بدليل" },
  alleged: { group: "unsettled", color: "slate", label: "مدّعى" },
  unresolved: { group: "unsettled", color: "amber", label: "غير محسومة" },
}

export function FactsTab({ caseDetail: c }: { caseDetail: CaseDetailT }) {
  const groups: { key: "proven" | "disputed" | "unsettled"; title: string; icon: React.ReactNode; color: string }[] = [
    { key: "proven", title: "الوقائع المثبتة", icon: <CheckCircle2 className="h-4 w-4" />, color: "emerald" },
    { key: "disputed", title: "الوقائع المتنازع عليها", icon: <XCircle className="h-4 w-4" />, color: "orange" },
    { key: "unsettled", title: "الوقائع غير المحسومة", icon: <HelpCircle className="h-4 w-4" />, color: "amber" },
  ]

  return (
    <div className="space-y-4">
      <SovereignPanel
        title="محرّك حالة الوقائع"
        icon={<BookOpen className="h-4 w-4" />}
        action={<AddFactDialog caseId={c.id} />}
      >
        <p className="font-kufi text-xs text-muted-foreground mb-3 leading-relaxed">
          يتم تنظيم كل واقعة بحالتها الدقيقة: مثبتة (مُقَرّ بها / غير متنازع / مؤيّدة / ثابتة قضائيًا)، متنازع عليها (منكَرة / معارَضة بدليل)، أو غير محسومة (مدّعى / غير محسومة). يحافظ النظام على الفرق بين «ادّعاء الطرف» و«ثبوت المحكمة».
        </p>

        {c.facts.length === 0 ? (
          <EmptyState title="لا توجد وقائع مسجّلة" hint="أضف واقعة جديدة للبدء" icon={<BookOpen className="h-8 w-8" />} />
        ) : (
          <div className="space-y-4">
            {groups.map((g) => {
              const facts = c.facts.filter((f) => STATUS_META[f.status]?.group === g.key)
              if (facts.length === 0) return null
              return (
                <div key={g.key}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("flex items-center gap-1.5 font-kufi text-xs font-semibold", colorClasses(g.color).text)}>
                      {g.icon}
                      {g.title}
                    </span>
                    <span className="font-jetbrains text-[10px] text-muted-foreground">({facts.length})</span>
                    <div className={cn("flex-1 h-px", colorClasses(g.color).border, "border-t")} />
                  </div>
                  <div className="space-y-2">
                    {facts.map((f) => <FactRow key={f.id} fact={f} caseId={c.id} />)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </SovereignPanel>
    </div>
  )
}

function FactRow({ fact, caseId }: { fact: FactT; caseId: string }) {
  const qc = useQueryClient()
  const meta = STATUS_META[fact.status]
  const matMeta = findConstant(FACT_MATERIALITY, fact.materiality)

  const updateMut = useMutation({
    mutationFn: (patch: Record<string, unknown>) => api.updateFact(caseId, fact.id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", caseId] })
      toast.success("تم تحديث الواقعة")
    },
    onError: () => toast.error("فشل التحديث"),
  })

  const delMut = useMutation({
    mutationFn: () => api.deleteFact(caseId, fact.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", caseId] })
      toast.success("تم حذف الواقعة")
    },
  })

  return (
    <div className="rounded-md border border-border/60 bg-background/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="font-kufi text-sm leading-relaxed flex-1">{fact.statement}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusBadge label={meta?.label ?? fact.status} color={meta?.color ?? "slate"} size="sm" />
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        {fact.party && <span className="font-kufi text-[10px] text-muted-foreground">الطرف: {fact.party}</span>}
        {fact.sourceNote && <span className="font-kufi text-[10px] text-muted-foreground">المصدر: {fact.sourceNote}</span>}
        {fact.aiExtracted && <StatusBadge label="استخراج آلي" color="violet" size="sm" dot={false} />}
        <div className="mr-auto flex items-center gap-2">
          {matMeta && (
            <Select value={fact.materiality} onValueChange={(v) => updateMut.mutate({ materiality: v })}>
              <SelectTrigger className="h-6 w-32 text-[10px] font-kufi px-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FACT_MATERIALITY.map((m) => <SelectItem key={m.value} value={m.value} className="font-kufi text-xs">{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={fact.status} onValueChange={(v) => updateMut.mutate({ status: v })}>
            <SelectTrigger className="h-6 w-28 text-[10px] font-kufi px-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FACT_STATUSES.map((s) => <SelectItem key={s.value} value={s.value} className="font-kufi text-xs">{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <button onClick={() => delMut.mutate()} className="text-muted-foreground hover:text-red-500 transition-colors" title="حذف">
            {delMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddFactDialog({ caseId }: { caseId: string }) {
  const [open, setOpen] = React.useState(false)
  const [statement, setStatement] = React.useState("")
  const [status, setStatus] = React.useState("unresolved")
  const [materiality, setMateriality] = React.useState("supporting")
  const [party, setParty] = React.useState("")
  const qc = useQueryClient()

  const mut = useMutation({
    mutationFn: () => api.createFact(caseId, {
      statement, status, materiality,
      party: party || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", caseId] })
      toast.success("تمت إضافة الواقعة")
      setOpen(false)
      setStatement(""); setParty("")
    },
    onError: () => toast.error("فشل الإضافة"),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="font-kufi text-xs h-8 border-amber-500/40 text-amber-600 dark:text-amber-400">
          <Plus className="h-3.5 w-3.5" /> إضافة واقعة
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-kufi">إضافة واقعة جديدة</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea value={statement} onChange={(e) => setStatement(e.target.value)} placeholder="نص الواقعة…" className="font-kufi text-sm min-h-20" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-kufi text-xs text-muted-foreground mb-1 block">الحالة</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="font-kufi text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FACT_STATUSES.map((s) => <SelectItem key={s.value} value={s.value} className="font-kufi text-xs">{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-kufi text-xs text-muted-foreground mb-1 block">الجوهرية</label>
              <Select value={materiality} onValueChange={setMateriality}>
                <SelectTrigger className="font-kufi text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FACT_MATERIALITY.map((m) => <SelectItem key={m.value} value={m.value} className="font-kufi text-xs">{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Input value={party} onChange={(e) => setParty(e.target.value)} placeholder="الطرف (اختياري)" className="font-kufi text-sm" />
        </div>
        <DialogFooter>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending || !statement.trim()} className="font-kufi">
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            إضافة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
