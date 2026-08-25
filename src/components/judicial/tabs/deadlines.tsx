"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  CalendarDays, Plus, Trash2, Loader2, Clock, AlertTriangle, CheckCircle2,
  Hourglass, MapPin, Scale, BookOpen,
} from "lucide-react"
import { cn, colorClasses, formatDate, toInputDate } from "@/lib/judicial/ui"
import { LEGAL_DEADLINES, daysUntilDeadline } from "@/lib/judicial/deadlines"
import type { CaseDetailT, CaseDeadlineT } from "@/lib/judicial/schemas"
import { api } from "@/lib/judicial/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { SovereignPanel, StatusBadge, EmptyState } from "../ui/primitives"

const DEADLINE_STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "ساري", color: "blue", icon: <Clock className="h-3.5 w-3.5" /> },
  approaching: { label: "اقتراب الموعد", color: "amber", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  expired: { label: "منقضي", color: "red", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  met: { label: "تم", color: "emerald", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  extended: { label: "ممدود", color: "violet", icon: <Hourglass className="h-3.5 w-3.5" /> },
}

export function DeadlinesTab({ caseDetail: c }: { caseDetail: CaseDetailT }) {
  const qc = useQueryClient()
  const [deadlineType, setDeadlineType] = React.useState<string>("appeal_civil")
  const [startDate, setStartDate] = React.useState(toInputDate(new Date().toISOString()))
  const [defendantAbroad, setDefendantAbroad] = React.useState(false)

  const createMut = useMutation({
    mutationFn: () => api.createDeadline(c.id, deadlineType, startDate, defendantAbroad),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", c.id] })
      toast.success("تم حساب الموعد القانوني")
    },
    onError: () => toast.error("فشل الحساب"),
  })

  const deleteMut = useMutation({
    mutationFn: (deadlineId: string) => api.deleteDeadline(c.id, deadlineId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", c.id] })
      toast.success("تم حذف الموعد")
    },
  })

  const selectedDef = LEGAL_DEADLINES.find((d) => d.type === deadlineType)
  const sorted = [...c.deadlines].sort((a, b) => new Date(a.computedDeadline).getTime() - new Date(b.computedDeadline).getTime())

  return (
    <div className="space-y-4">
      <SovereignPanel title="محرّك المواعيد القانونية المصرية" icon={<CalendarDays className="h-4 w-4" />} accent>
        <p className="font-kufi text-xs text-muted-foreground mb-4 leading-relaxed">
          حساب وحفظ المواعيد الإجرائية وفقاً للقوانين المصرية: قانون المرافعات (13/1968)، قانون الإجراءات الجنائية (150/1950)، القانون المدني (131/1948)، قانون مجلس الدولة (47/1972). يُحسب الموعد الفعلي مع مراعاة يوم الحدث ومسافة الطريق، وتعديل أيام الجمعة.
        </p>

        {/* Compute form */}
        <div className="rounded-md border border-border/60 bg-background/40 p-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="font-kufi text-xs text-muted-foreground mb-1 block">نوع الموعد القانوني</label>
              <Select value={deadlineType} onValueChange={setDeadlineType}>
                <SelectTrigger className="font-kufi text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-80">
                  {LEGAL_DEADLINES.map((d) => (
                    <SelectItem key={d.type} value={d.type} className="font-kufi text-xs">
                      {d.label} ({d.days} {d.unit === "days" ? "يوم" : "سنة"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-kufi text-xs text-muted-foreground mb-1 block">تاريخ بداية الحساب</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="font-jetbrains text-sm" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer font-kufi text-xs text-muted-foreground">
                <Checkbox checked={defendantAbroad} onCheckedChange={(v) => setDefendantAbroad(v === true)} />
                الخصم خارج مصر (تمديد الميعاد)
              </label>
            </div>
          </div>

          {selectedDef && (
            <div className="rounded border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <Scale className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
                <span className="font-kufi font-semibold text-amber-700 dark:text-amber-600">{selectedDef.legalBasis}</span>
              </div>
              <p className="font-kufi text-muted-foreground leading-relaxed mb-1">{selectedDef.notes}</p>
              <p className="font-kufi text-[11px] text-muted-foreground">
                <span className="opacity-60">يبدأ من:</span> {selectedDef.startsFrom}
                {defendantAbroad && selectedDef.defendantAbroadDays && (
                  <span className="text-amber-600 dark:text-amber-500 mr-2"> — ممدود إلى {selectedDef.defendantAbroadDays} يوماً (الخصم خارج مصر)</span>
                )}
              </p>
            </div>
          )}

          <Button
            onClick={() => createMut.mutate()}
            disabled={createMut.isPending || !startDate}
            className="font-kufi bg-amber-600 hover:bg-amber-700 text-white"
            size="sm"
          >
            {createMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            حساب الموعد
          </Button>
        </div>
      </SovereignPanel>

      {/* Deadlines list */}
      {sorted.length === 0 ? (
        <EmptyState title="لا توجد مواعيد محسوبة" hint="احسب موعداً قانونياً للبدء" icon={<CalendarDays className="h-8 w-8" />} />
      ) : (
        <SovereignPanel title={`المواعيد المحسوبة (${sorted.length})`} icon={<Clock className="h-4 w-4" />}>
          <div className="space-y-2">
            {sorted.map((d) => <DeadlineCard key={d.id} deadline={d} onDelete={() => deleteMut.mutate(d.id)} />)}
          </div>
        </SovereignPanel>
      )}

      {/* Reference table */}
      <SovereignPanel title="جدول المواعيد القانونية المرجعي" icon={<BookOpen className="h-4 w-4" />}>
        <p className="font-kufi text-[11px] text-muted-foreground mb-2 leading-relaxed">
          مرجع سريع للمواعيد الإجرائية المنصوص عليها في القوانين المصرية. تُحسب تلقائياً عند اختيارها أعلاه.
        </p>
        <div className="overflow-x-auto scroll-sovereign">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-right font-kufi text-[10px] text-muted-foreground">
                <th className="py-1.5 px-2">الموعد</th>
                <th className="py-1.5 px-2">المدة</th>
                <th className="py-1.5 px-2">الأساس القانوني</th>
                <th className="py-1.5 px-2 hidden md:table-cell">يبدأ من</th>
              </tr>
            </thead>
            <tbody>
              {LEGAL_DEADLINES.map((d) => (
                <tr key={d.type} className="border-b border-border/40 hover:bg-muted/30">
                  <td className="py-1.5 px-2 font-kufi">{d.label}</td>
                  <td className="py-1.5 px-2 font-jetbrains text-amber-600 dark:text-amber-500">{d.days} {d.unit === "days" ? "يوم" : "سنة"}</td>
                  <td className="py-1.5 px-2 font-kufi text-muted-foreground text-[11px]">{d.legalBasis}</td>
                  <td className="py-1.5 px-2 font-kufi text-muted-foreground text-[11px] hidden md:table-cell">{d.startsFrom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SovereignPanel>
    </div>
  )
}

function DeadlineCard({ deadline: d, onDelete }: { deadline: CaseDeadlineT; onDelete: () => void }) {
  const statusMeta = DEADLINE_STATUS_META[d.status] ?? DEADLINE_STATUS_META.pending
  const daysLeft = daysUntilDeadline(new Date(d.computedDeadline))

  return (
    <div className={cn(
      "rounded-md border p-3 flex items-start gap-3",
      d.status === "expired" ? "border-red-500/40 bg-red-500/5"
        : d.status === "approaching" ? "border-amber-500/40 bg-amber-500/5"
        : "border-border/60 bg-background/40"
    )}>
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-md shrink-0", colorClasses(statusMeta.color).bg, colorClasses(statusMeta.color).text)}>
        {statusMeta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4 className="font-kufi text-sm font-semibold">{d.title}</h4>
          <StatusBadge label={statusMeta.label} color={statusMeta.color} size="sm" glow={d.status === "expired" || d.status === "approaching"} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-kufi text-[10px] text-muted-foreground">
          <div><span className="opacity-60">يبدأ من:</span> {formatDate(d.startDate)}</div>
          <div><span className="opacity-60">ينتهي في:</span> <span className="font-jetbrains text-amber-600 dark:text-amber-500">{formatDate(d.computedDeadline)}</span></div>
          <div><span className="opacity-60">المدة:</span> {d.daysAllowed} {d.daysAllowed >= 365 ? "سنة" : "يوم"}</div>
          {d.defendantAbroad && <div className="flex items-center gap-1 text-amber-600 dark:text-amber-500"><MapPin className="h-2.5 w-2.5" /> الخصم خارج مصر</div>}
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="font-kufi text-[10px] text-muted-foreground/70">{d.legalBasis}</span>
          {d.status !== "expired" && d.status !== "met" && (
            <span className={cn("font-kufi text-[10px] font-medium", daysLeft <= 7 ? "text-amber-600 dark:text-amber-500" : "text-muted-foreground")}>
              — متبقٍ {daysLeft} {daysLeft === 1 ? "يوم" : "يوماً"}
            </span>
          )}
          {d.status === "expired" && (
            <span className="font-kufi text-[10px] font-medium text-red-500">— منقضي منذ {Math.abs(daysLeft)} {Math.abs(daysLeft) === 1 ? "يوم" : "يوماً"}</span>
          )}
        </div>
        {d.notes && <p className="font-kufi text-[10px] text-muted-foreground mt-1 leading-relaxed">{d.notes}</p>}
      </div>
      <button onClick={onDelete} className="text-muted-foreground hover:text-red-500 transition-colors shrink-0">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
