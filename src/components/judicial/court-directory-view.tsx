"use client"

import * as React from "react"
import {
  Search, MapPin, Building, Building2, Scale, Crown, Landmark,
  ChevronDown, Loader2, Filter,
} from "lucide-react"
import { cn, colorClasses } from "@/lib/judicial/ui"
import {
  GOVERNORATES, APPEAL_COURTS, SPECIAL_COURTS, ECONOMIC_COURT_CITIES,
  CIRCUIT_TYPES, getAllCourts, type FlatCourt,
} from "@/lib/judicial/court-directory"
import { StatusBadge } from "./ui/primitives"

type View = "governorates" | "appeal" | "all"

const COURT_ICONS: Record<string, React.ReactNode> = {
  constitutional: <Crown className="h-4 w-4" />,
  cassation: <Scale className="h-4 w-4" />,
  appeal: <Scale className="h-4 w-4" />,
  primary: <Building className="h-4 w-4" />,
  partial: <Building2 className="h-4 w-4" />,
  economic: <Landmark className="h-4 w-4" />,
}

const COURT_COLORS: Record<string, string> = {
  constitutional: "rose",
  cassation: "gold",
  appeal: "violet",
  primary: "blue",
  partial: "teal",
  economic: "emerald",
}

export function CourtDirectory() {
  const [view, setView] = React.useState<View>("governorates")
  const [q, setQ] = React.useState("")

  const allCourts = React.useMemo(() => getAllCourts(), [])
  const filtered = React.useMemo(() => {
    if (!q.trim()) return allCourts
    const s = q.toLowerCase().trim()
    return allCourts.filter((c) =>
      c.name.toLowerCase().includes(s) ||
      c.governorate.toLowerCase().includes(s) ||
      (c.address?.toLowerCase().includes(s) ?? false)
    )
  }, [allCourts, q])

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-card/40 px-4 py-3">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div>
            <h2 className="font-serif-judicial text-lg font-bold">دليل المحاكم المصرية</h2>
            <p className="font-kufi text-xs text-muted-foreground">27 محافظة · 8 محاكم استئناف · {allCourts.length} محكمة ودائرة</p>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background/40 p-1">
            {([
              { key: "governorates", label: "حسب المحافظة" },
              { key: "appeal", label: "محاكم الاستئناف" },
              { key: "all", label: "كل المحاكم" },
            ] as const).map((t) => (
              <button
                key={t.key}
                onClick={() => setView(t.key)}
                className={cn(
                  "px-3 py-1.5 rounded-md font-kufi text-xs transition-colors",
                  view === t.key ? "bg-amber-500/15 text-amber-700 font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
              >{t.label}</button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث باسم المحكمة، المحافظة، أو العنوان…"
            className="w-full rounded-lg border border-input bg-background py-2 pr-9 pl-3 font-kufi text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scroll-sovereign p-4">
        {view === "governorates" && <GovernorateView q={q} />}
        {view === "appeal" && <AppealView />}
        {view === "all" && <AllCourtsView courts={filtered} />}
      </div>
    </div>
  )
}

// ─── Governorate view — expandable sections ──────────────────────
function GovernorateView({ q }: { q: string }) {
  const [expanded, setExpanded] = React.useState<string | null>(null)
  const filtered = q.trim()
    ? GOVERNORATES.filter((g) => g.name.includes(q.trim()) || g.primaryCourts.some((p) => p.name.includes(q.trim())) || g.partialCourts.some((p) => p.includes(q.trim())))
    : GOVERNORATES

  return (
    <div className="space-y-2 max-w-4xl mx-auto">
      {filtered.map((gov) => {
        const isOpen = expanded === gov.name || !!q.trim()
        return (
          <div key={gov.name} className="glass-panel rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : gov.name)}
              className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-right"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-kufi text-sm font-semibold">{gov.name}</h3>
                  <p className="font-kufi text-[10px] text-muted-foreground">
                    {gov.primaryCourts.length} ابتدائية · {gov.partialCourts.length} جزئية · {gov.appealCourt}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-jetbrains text-[10px] text-muted-foreground">{gov.primaryCourts.length + gov.partialCourts.length}</span>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "-rotate-180")} />
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-border/40 p-3 space-y-3 animate-slide-up">
                {/* Primary courts */}
                <div>
                  <h4 className="font-kufi text-[11px] font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-blue-500" />
                    المحاكم الابتدائية
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {gov.primaryCourts.map((pc) => (
                      <div key={pc.name} className="rounded-lg border border-border/40 bg-background/30 p-2.5">
                        <p className="font-kufi text-xs font-medium mb-0.5">{pc.name}</p>
                        {pc.address && <p className="font-kufi text-[10px] text-muted-foreground flex items-start gap-1"><MapPin className="h-2.5 w-2.5 mt-0.5 shrink-0" /> {pc.address}</p>}
                        {pc.circuits && pc.circuits.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap mt-1.5">
                            {pc.circuits.map((c) => (
                              <span key={c} className="font-kufi text-[8px] bg-muted/50 rounded-full px-1.5 py-0.5">{c}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Partial courts */}
                {gov.partialCourts.length > 0 && (
                  <div>
                    <h4 className="font-kufi text-[11px] font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-teal-500" />
                      المحاكم الجزئية
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {gov.partialCourts.map((pn) => (
                        <span key={pn} className="font-kufi text-[10px] rounded-lg border border-border/40 bg-background/30 px-2.5 py-1">{pn}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Appeal courts view ──────────────────────────────────────────
function AppealView() {
  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {/* Special courts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SPECIAL_COURTS.map((sc) => {
          const cc = colorClasses(COURT_COLORS[sc.type] ?? "slate")
          return (
            <div key={sc.name} className={cn("glass-panel rounded-xl p-4", cc.border)}>
              <div className="flex items-start gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg shrink-0", cc.bg, cc.text)}>
                  {COURT_ICONS[sc.type]}
                </div>
                <div className="min-w-0">
                  <h3 className="font-kufi text-sm font-semibold mb-0.5">{sc.name}</h3>
                  <p className="font-kufi text-[10px] text-muted-foreground leading-relaxed mb-1">{sc.jurisdiction}</p>
                  <p className="font-kufi text-[10px] text-muted-foreground flex items-start gap-1">
                    <MapPin className="h-2.5 w-2.5 mt-0.5 shrink-0" /> {sc.address}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Appeal courts */}
      <div className="space-y-2">
        <h3 className="font-kufi text-sm font-semibold text-muted-foreground px-2">محاكم الاستئناف (8)</h3>
        {APPEAL_COURTS.map((ac) => {
          const govCount = GOVERNORATES.filter((g) => g.appealCourt === ac.name).length
          return (
            <div key={ac.name} className="glass-panel rounded-xl p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 shrink-0">
                    <Scale className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-kufi text-sm font-semibold">{ac.name}</h4>
                    <p className="font-kufi text-[10px] text-muted-foreground">{govCount} محافظة</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2 pr-11">
                {ac.coverage.map((c) => (
                  <span key={c} className="font-kufi text-[10px] rounded-full border border-violet-500/30 bg-violet-500/5 text-violet-700 px-2 py-0.5">{c}</span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── All courts view — searchable flat list ──────────────────────
function AllCourtsView({ courts }: { courts: FlatCourt[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-w-5xl mx-auto">
      {courts.map((c) => {
        const cc = colorClasses(COURT_COLORS[c.type] ?? "slate")
        return (
          <div key={c.name + c.governorate} className="glass-panel rounded-lg p-3 hover-lift">
            <div className="flex items-start gap-2.5">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg shrink-0", cc.bg, cc.text)}>
                {COURT_ICONS[c.type] ?? <Building className="h-3.5 w-3.5" />}
              </div>
              <div className="min-w-0">
                <p className="font-kufi text-xs font-medium leading-snug">{c.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-kufi text-[9px] text-muted-foreground">{c.governorate}</span>
                  <StatusBadge label={c.type === "primary" ? "ابتدائية" : c.type === "partial" ? "جزئية" : c.type === "appeal" ? "استئناف" : c.type === "cassation" ? "نقض" : c.type === "constitutional" ? "دستورية" : c.type} color={cc.text.includes("emerald") ? "emerald" : cc.text.includes("rose") ? "rose" : cc.text.includes("violet") ? "violet" : "slate"} size="sm" dot={false} />
                </div>
                {c.address && <p className="font-kufi text-[9px] text-muted-foreground/70 mt-0.5 truncate">{c.address}</p>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
