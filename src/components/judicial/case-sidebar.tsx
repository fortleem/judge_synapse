"use client"

import * as React from "react"
import { Search, Filter, FolderOpen, Plus, AlertTriangle, Swords, ShieldAlert, WifiOff, Loader2, ChevronDown } from "lucide-react"
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
  const [showFilters, setShowFilters] = React.useState(false)
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

  // Group by court (Arc Spaces pattern)
  const grouped = React.useMemo(() => {
    const groups: Record<string, CaseT[]> = {}
    for (const c of filtered) {
      if (!groups[c.court]) groups[c.court] = []
      groups[c.court].push(c)
    }
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered])

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

  const activeFilters = (stage !== "all" ? 1 : 0) + (risk !== "all" ? 1 : 0) + (state !== "all" ? 1 : 0)

  return (
    <aside className="w-72 shrink-0 border-l border-border bg-card/40 flex flex-col min-h-0">
      {/* Clean search + new */}
      <div className="p-3 border-b border-border space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث…"
            className="w-full rounded-lg border border-input bg-background py-2 pr-9 pl-3 font-kufi text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
          />
        </div>

        {/* Filter toggle + new case */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-2 font-kufi text-[11px] transition-colors flex-1",
              activeFilters > 0 || showFilters
                ? "border-amber-500/40 bg-amber-500/5 text-amber-700"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            )}
          >
            <Filter className="h-3 w-3" />
            فلترة
            {activeFilters > 0 && (
              <span className="font-jetbrains text-[9px] bg-amber-500/30 rounded-full px-1.5">{activeFilters}</span>
            )}
          </button>
          <button
            onClick={() => createMut.mutate()}
            disabled={createMut.isPending}
            className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors active:scale-95 shrink-0"
            title="قضية جديدة"
          >
            {createMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>

        {/* Collapsible filters */}
        {showFilters && (
          <div className="grid grid-cols-3 gap-1.5 animate-slide-up">
            <MiniFilter value={stage} onChange={setStage} placeholder="المرحلة" options={PROCEDURAL_STAGES.map((s) => ({ value: s.value, label: s.label }))} />
            <MiniFilter value={risk} onChange={setRisk} placeholder="المخاطر" options={RISK_LEVELS.map((r) => ({ value: r.value, label: r.label }))} />
            <MiniFilter value={state} onChange={setState} placeholder="الحالة" options={OPERATING_STATES.map((o) => ({ value: o.value, label: o.label }))} />
          </div>
        )}

        {/* Active filter chips */}
        {activeFilters > 0 && !showFilters && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {stage !== "all" && <FilterChip label={findConstant(PROCEDURAL_STAGES, stage)?.label ?? stage} onClear={() => setStage("all")} />}
            {risk !== "all" && <FilterChip label={findConstant(RISK_LEVELS, risk)?.label ?? risk} onClear={() => setRisk("all")} />}
            {state !== "all" && <FilterChip label={findConstant(OPERATING_STATES, state)?.label ?? state} onClear={() => setState("all")} />}
          </div>
        )}
      </div>

      {/* Case list — grouped by court */}
      <div className="flex-1 overflow-y-auto scroll-sovereign min-h-0">
        {serverDown ? (
          <div className="p-6 text-center space-y-2">
            <WifiOff className="h-6 w-6 text-red-500 mx-auto" />
            <p className="font-kufi text-xs text-muted-foreground">تعذّر الوصول إلى الخادم</p>
          </div>
        ) : loading ? (
          <div className="p-6 text-center">
            <Loader2 className="h-5 w-5 animate-spin text-amber-400 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center">
            <FolderOpen className="h-6 w-6 text-muted-foreground/30 mx-auto" />
            <p className="font-kufi text-xs text-muted-foreground mt-2">لا توجد قضايا مطابقة</p>
          </div>
        ) : (
          <div className="p-2 space-y-3">
            {grouped.map(([court, courtCases]) => (
              <div key={court}>
                {/* Court group header */}
                <div className="flex items-center gap-1.5 px-2 py-1">
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  <span className="font-kufi text-[10px] font-semibold text-muted-foreground truncate">{court}</span>
                  <span className="font-jetbrains text-[9px] text-muted-foreground/50">{courtCases.length}</span>
                </div>
                {/* Cases in this court */}
                <ul className="space-y-1">
                  {courtCases.map((c) => (
                    <CaseCard key={c.id} c={c} selected={c.id === selectedId} onSelect={onSelect} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
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
          "w-full text-right rounded-lg border p-2.5 transition-all group active:scale-[0.98]",
          selected
            ? "border-amber-500/50 bg-amber-500/5"
            : "border-transparent hover:border-border hover:bg-muted/30"
        )}
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="font-jetbrains text-[10px] text-muted-foreground truncate">{c.caseNumber}</span>
          {state && state.value !== "NOMINAL" && <StateIcon state={state.value} />}
        </div>
        <p className={cn(
          "font-kufi text-xs font-medium leading-snug line-clamp-2 mb-1.5",
          selected ? "text-amber-700" : "text-foreground"
        )}>
          {c.title}
        </p>
        <div className="flex items-center gap-1 flex-wrap">
          {stage && <StatusBadge label={stage.label} color="slate" size="sm" dot={false} />}
          {risk && <StatusBadge label={risk.label} color={risk.color} size="sm" />}
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

function MiniFilter({
  value, onChange, placeholder, options,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-border bg-background px-2 py-1.5 font-kufi text-[10px] focus:outline-none focus:ring-1 focus:ring-amber-500/30"
    >
      <option value="all">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      onClick={onClear}
      className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/5 px-2 py-0.5 font-kufi text-[9px] text-amber-700 hover:bg-amber-500/10"
    >
      {label}
      <span className="text-amber-500/60">×</span>
    </button>
  )
}
