"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, Loader2, CalendarClock, Scale, FileSignature, Gavel, Bell, AlertOctagon, FileText, Repeat, Megaphone } from "lucide-react"
import { cn, colorClasses, formatDate } from "@/lib/judicial/ui"
import type { CaseDetailT } from "@/lib/judicial/schemas"
import { api } from "@/lib/judicial/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { SovereignPanel, EmptyState } from "../ui/primitives"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"

const EVENT_TYPES = [
  { value: "contract", label: "إبرام عقد", icon: FileSignature },
  { value: "transaction", label: "معاملة", icon: FileText },
  { value: "breach", label: "إخلال", icon: AlertOctagon },
  { value: "discovery", label: "كشف", icon: FileText },
  { value: "filing", label: "إيداع", icon: FileText },
  { value: "notice", label: "إخطار", icon: Bell },
  { value: "amendment", label: "تعديل", icon: FileText },
  { value: "service", label: "إعلان", icon: Megaphone },
  { value: "procedural_order", label: "أمر إجرائي", icon: Scale },
  { value: "hearing", label: "جلسة", icon: Gavel },
  { value: "judgment", label: "حكم", icon: Gavel },
  { value: "appeal", label: "استئناف", icon: Repeat },
  { value: "execution", label: "تنفيذ", icon: Scale },
]

export function TimelineTab({ caseDetail: c }: { caseDetail: CaseDetailT }) {
  const sorted = [...c.timeline].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())

  return (
    <div className="space-y-4">
      <SovereignPanel
        title="الخط الزمني للأحداث القانونية"
        icon={<CalendarClock className="h-4 w-4" />}
        action={<AddEventDialog caseId={c.id} />}
      >
        <p className="font-kufi text-xs text-muted-foreground mb-4 leading-relaxed">
          كل حدث مادي يحصل على تاريخ أو نطاق تاريخ، ويرتبط بالنظام القانوني الساري آنذاك — مما يسمح بالتحليل الزمني دون الاعتماد على حفظ التسلسل الزمني في ذاكرة النموذج.
        </p>

        {sorted.length === 0 ? (
          <EmptyState title="لا توجد أحداث في الخط الزمني" hint="أضف حدثًا للبدء" icon={<CalendarClock className="h-8 w-8" />} />
        ) : (
          <div className="relative pr-4">
            {/* vertical line */}
            <div className="absolute right-0 top-2 bottom-2 w-px bg-gradient-to-b from-amber-500/60 via-border to-transparent" />
            <ol className="space-y-4">
              {sorted.map((ev, i) => <TimelineItem key={ev.id} event={ev} caseId={c.id} isLast={i === sorted.length - 1} />)}
            </ol>
          </div>
        )}
      </SovereignPanel>
    </div>
  )
}

function TimelineItem({ event: ev, caseId, isLast }: { event: CaseDetailT["timeline"][number]; caseId: string; isLast: boolean }) {
  const qc = useQueryClient()
  const typeMeta = EVENT_TYPES.find((t) => t.value === ev.eventType)
  const Icon = typeMeta?.icon ?? FileText
  const delMut = useMutation({
    mutationFn: () => api.deleteTimelineEvent(caseId, ev.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", caseId] })
      toast.success("تم حذف الحدث")
    },
  })

  return (
    <li className="relative pr-6">
      {/* node */}
      <div className="absolute right-0 top-1 flex h-4 w-4 -translate-x-[5px] items-center justify-center rounded-full bg-amber-500/20 ring-2 ring-amber-500/40">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      </div>
      <div className="rounded-md border border-border/60 bg-background/40 p-3 hover:border-amber-500/30 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
              <h4 className="font-kufi text-sm font-semibold">{ev.title}</h4>
            </div>
            {ev.description && <p className="font-kufi text-xs text-muted-foreground leading-relaxed mb-1.5">{ev.description}</p>}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-jetbrains text-[10px] text-muted-foreground">{formatDate(ev.eventDate)}</span>
              {typeMeta && <span className="font-kufi text-[10px] text-amber-600 dark:text-amber-400">{typeMeta.label}</span>}
              {ev.legalRegime && <span className="font-kufi text-[10px] text-muted-foreground">النظام: {ev.legalRegime}</span>}
            </div>
          </div>
          <button onClick={() => delMut.mutate()} className="text-muted-foreground hover:text-red-500 transition-colors shrink-0">
            {delMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </li>
  )
}

function AddEventDialog({ caseId }: { caseId: string }) {
  const [open, setOpen] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [eventDate, setEventDate] = React.useState("")
  const [eventType, setEventType] = React.useState("notice")
  const [legalRegime, setLegalRegime] = React.useState("")
  const qc = useQueryClient()

  const mut = useMutation({
    mutationFn: () => api.createTimelineEvent(caseId, {
      title, description: description || null,
      eventDate, eventType,
      legalRegime: legalRegime || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", caseId] })
      toast.success("تمت إضافة الحدث")
      setOpen(false)
      setTitle(""); setDescription(""); setEventDate(""); setLegalRegime("")
    },
    onError: () => toast.error("فشل الإضافة"),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="font-kufi text-xs h-8 border-amber-500/40 text-amber-600 dark:text-amber-400">
          <Plus className="h-3.5 w-3.5" /> إضافة حدث
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-kufi">إضافة حدث زمني</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان الحدث" className="font-kufi text-sm" />
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="الوصف (اختياري)" className="font-kufi text-sm min-h-16" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-kufi text-xs text-muted-foreground mb-1 block">التاريخ</label>
              <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="font-jetbrains text-sm" />
            </div>
            <div>
              <label className="font-kufi text-xs text-muted-foreground mb-1 block">النوع</label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="font-kufi text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value} className="font-kufi text-xs">{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Input value={legalRegime} onChange={(e) => setLegalRegime(e.target.value)} placeholder="النظام القانوني الساري (اختياري)" className="font-kufi text-sm" />
        </div>
        <DialogFooter>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending || !title.trim() || !eventDate} className="font-kufi">
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            إضافة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
