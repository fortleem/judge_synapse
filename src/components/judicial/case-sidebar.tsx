"use client"

import * as React from "react"
import { Search, Filter, FolderOpen, Plus, AlertTriangle, Swords, ShieldAlert, WifiOff, Loader2 } from "lucide-react"
import { cn, colorClasses, relativeTime } from "@/lib/judicial/ui"
import {
  PROCEDURAL_STAGES, RISK_LEVELS, OPERATING_STATES, findConstant,
} from "@/lib/judicial/constants"
import type { CaseT } from "@/lib/judicial/schemas"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/judicial/api-client"
import { toast } from "sonner"
import { StatusBadge } from "./ui/primitives"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

export function CaseSidebar({
  cases, loading, selectedId, onSelect, serverDown,
}: {
  cases: CaseT[]
  loading: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  serverDown: boolean
}) {
  const [q, setQ] = React.useState("")
  const [stage, setStage] = React.useState<string>("all")
  const [risk, setRisk] = React.useState<string>("all")
  const [state, setState] = React.useState<string>("all")
  const qc = useQueryClient()

  const filtered = cases.filter((c) => {
    if (stage !== "all" && c.proceduralStage !== stage) return false
    if (risk !== "all" && c.riskLevel !== risk) return false
    if (state !== "all" && c.operatingState !== state) return false
    if (q.trim()) {
      const needle = q.trim()
      return [c.caseNumber, c.title, c.parties, c.court].some((f) => f?.includes(needle))
    }
    return true
  })

  const createMut = useMutation({
    mutationFn: () => api.createCase({
      caseNumber: `قضية جديدة ${Math.floor(Math.random() * 9000 + 1000)} لسنة ${new Date().getFullYear()}`,
      title: "قضية جديدة — في انتظار التعبئة",
      court: "المحكمة الابتدائية",
      circuit: "الدائرة الأولى",
      caseType: "مدني",
      parties: "غير محدد بعد",
      subjectMatter: "غير محدد بعد",
      proceduralStage: "FILED",
      riskLevel: "MEDIUM",
      operatingState: "NOMINAL",
      summary: "",
    }),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ["cases"] })
      qc.invalidateQueries({ queryKey: ["dashboard"] })
      onSelect(c.id)
      toast.success("تم إنشاء القضية بنجاح")
    },
    onError: () => toast.error("فشل إنشاء القضية"),
  })

  return (
    <aside className="w-80 shrink-0 border-l border-border bg-card/40 flex flex-col min-h-0">
      {/* Search + new */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="relative">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث برقم القضية، العنوان، الأطراف…"
            className="w-full rounded-md border border-input bg-background py-2 pr-9 pl-3 font-kufi text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <FilterSelect value={stage} onChange={setStage} placeholder="المرحلة" options={PROCEDURAL_STAGES.map((s) => ({ value: s.value, label: s.label }))} />
          <FilterSelect value={risk} onChange={setRisk} placeholder="المخاطر" options={RISK_LEVELS.map((r) => ({ value: r.value, label: r.label }))} />
          <FilterSelect value={state} onChange={setState} placeholder="الحالة" options={OPERATING_STATES.map((o) => ({ value: o.value, label: o.label }))} />
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full border-dashed border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-kufi text-xs h-8"
          onClick={() => createMut.mutate()}
          disabled={createMut.isPending}
        >
          {createMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          قضية جديدة
        </Button>
      </div>

      {/* Filter chips summary */}
      {(stage !== "all" || risk !== "all" || state !== "all" || q.trim()) && (
        <div className="px-3 py-2 border-b border-border flex items-center gap-1.5 flex-wrap">
          <Filter className="h-3 w-3 text-muted-foreground" />
          <span className="font-kufi text-[10px] text-muted-foreground">{filtered.length} نتيجة</span>
          {(stage !== "all" || risk !== "all" || state !== "all") && (
            <button
              onClick={() => { setStage("all"); setRisk("all"); setState("all") }}
              className="font-kufi text-[10px] text-amber-600 dark:text-amber-400 hover:underline"
            >
              مسح التصفية
            </button>
          )}
        </div>
      )}

      {/* Case list */}
      <div className="flex-1 overflow-y-auto scroll-sovereign min-h-0">
        {serverDown ? (
          <div className="p-6 text-center space-y-2">
            <WifiOff className="h-6 w-6 text-red-500 mx-auto" />
            <p className="font-kufi text-xs text-muted-foreground">تعذّر الوصول إلى الخادم</p>
          </div>
        ) : loading ? (
          <div className="p-6 text-center">
            <Loader2 className="h-5 w-5 animate-spin text-amber-400 mx-auto" />
            <p className="font-kufi text-xs text-muted-foreground mt-2">تحميل القضايا…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center">
            <FolderOpen className="h-6 w-6 text-muted-foreground/40 mx-auto" />
            <p className="font-kufi text-xs text-muted-foreground mt-2">لا توجد قضايا مطابقة</p>
          </div>
        ) : (
          <ul className="p-2 space-y-1">
            {filtered.map((c) => (
              <CaseCard key={c.id} c={c} selected={c.id === selectedId} onSelect={onSelect} />
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}

function CaseCard({ c, selected, onSelect }: { c: CaseT; selected: boolean; onSelect: (id: string) => void }) {
  const stage = findConstant(PROCEDURAL_STAGES, c.proceduralStage)
  const risk = findConstant(RISK_LEVELS, c.riskLevel)
  const state = findConstant(OPERATING_STATES, c.operatingState)

  return (
    <li>
      <button
        onClick={() => onSelect(c.id)}
        className={cn(
          "w-full text-right rounded-md border p-2.5 transition-all group",
          selected
            ? "border-amber-500/50 bg-amber-500/5 seal-frame"
            : "border-border/60 hover:border-amber-500/30 hover:bg-card"
        )}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span className="font-jetbrains text-[10px] text-muted-foreground truncate">{c.caseNumber}</span>
          {state && state.value !== "NOMINAL" && <StateIcon state={state.value} />}
        </div>
        <p className={cn(
          "font-kufi text-xs font-medium leading-snug line-clamp-2 mb-1.5",
          selected ? "text-amber-200" : "text-foreground"
        )}>
          {c.title}
        </p>
        <div className="flex items-center gap-1 flex-wrap">
          {stage && <StatusBadge label={stage.label} color="slate" size="sm" dot={false} />}
          {risk && <StatusBadge label={risk.label} color={risk.color} size="sm" />}
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="font-kufi text-[9px] text-muted-foreground truncate">{c.court}</span>
          <span className="font-kufi text-[9px] text-muted-foreground/70 shrink-0">{relativeTime(c.updatedAt)}</span>
        </div>
      </button>
    </li>
  )
}

function StateIcon({ state }: { state: string }) {
  if (state === "CONFLICT") return <Swords className="h-3.5 w-3.5 text-orange-400 shrink-0" />
  if (state === "INSUFFICIENT_EVIDENCE") return <AlertTriangle className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
  if (state === "REVIEW") return <ShieldAlert className="h-3.5 w-3.5 text-blue-400 shrink-0" />
  if (state === "SYSTEM_DEGRADED") return <WifiOff className="h-3.5 w-3.5 text-red-400 shrink-0" />
  return null
}

function FilterSelect({
  value, onChange, placeholder, options,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: { value: string; label: string }[]
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 text-[11px] font-kufi px-2">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">الكل</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="font-kufi text-xs">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
