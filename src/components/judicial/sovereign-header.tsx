"use client"

import * as React from "react"
import { Scale, ShieldCheck, Activity, Settings2, Server, Cpu, Database, BookMarked, UserRound } from "lucide-react"
import { cn, colorClasses } from "@/lib/judicial/ui"
import { OPERATING_STATES, findConstant } from "@/lib/judicial/constants"
import type { DashboardT, HealthT } from "@/lib/judicial/schemas"
import type { View } from "./judicial-brain-app"
import { StatusBadge } from "./ui/primitives"

export function SovereignHeader({
  health, dashboard, loading, serverDown, onNavigate, activeView,
}: {
  health?: HealthT
  dashboard?: DashboardT
  loading: boolean
  serverDown: boolean
  onNavigate: (v: View) => void
  activeView: View
}) {
  const systemState = serverDown ? "SYSTEM_DEGRADED" : (dashboard?.systemState ?? "NOMINAL")
  const stateMeta = findConstant(OPERATING_STATES, systemState)

  // Fix hydration: render date only after client mount
  // Node ICU vs browser ICU produce different Arabic date formats
  const [dateStr, setDateStr] = React.useState<string | null>(null)
  React.useEffect(() => {
    setDateStr(new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" }))
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-sidebar text-sidebar-foreground backdrop-blur supports-[backdrop-filter]:bg-sidebar/95">
      {/* Gold rule */}
      <div className="gold-rule" />

      {/* Welcome banner — Judge Sherif */}
      <div className="px-4 py-1.5 bg-sidebar-accent/40 border-b border-sidebar-border/40 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 shrink-0">
            <UserRound className="h-3.5 w-3.5" />
          </div>
          <span className="font-serif-judicial text-sm text-amber-200">
            أهلاً وسهلاً بسيادة المستشار / شريف
          </span>
          <span className="font-kufi text-[10px] text-sidebar-foreground/50 hidden sm:inline">
            — منصة الذكاء القضائي المصري في خدمتكم
          </span>
        </div>
        <span className="font-jetbrains text-[9px] text-sidebar-foreground/40 hidden md:inline" suppressHydrationWarning>
          {dateStr ?? ""}
        </span>
      </div>

      <div className="flex items-center gap-4 px-4 h-16">
        {/* Seal + title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-md bg-gradient-to-br from-emerald-700 to-emerald-900 seal-frame shrink-0">
            <Scale className="h-6 w-6 text-amber-400" strokeWidth={1.5} />
            <span className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-amber-400 sovereign-pulse" />
          </div>
          <div className="min-w-0">
            <h1 className="font-serif-judicial text-lg font-bold leading-tight text-amber-300 truncate">
              المنصة القضائية الذكية
            </h1>
            <p className="font-jetbrains text-[10px] text-sidebar-foreground/60 tracking-wider truncate">
              EGYPTIAN JUDICIAL SMART · V2.1 · SOVEREIGN PILOT
            </p>
          </div>
        </div>

        {/* Operating states bar */}
        <div className="hidden lg:flex items-center gap-1.5 mx-auto">
          <span className="font-kufi text-[10px] text-sidebar-foreground/50 ml-2">حالة النظام</span>
          {OPERATING_STATES.map((s) => {
            const count = dashboard?.byOperatingState.find((o) => o.state === s.value)?.count ?? 0
            const active = systemState === s.value
            const c = colorClasses(s.color)
            return (
              <button
                key={s.value}
                title={s.labelEn}
                className={cn(
                  "flex items-center gap-1.5 rounded border px-2 py-1 font-kufi text-[10px] transition-colors",
                  active ? cn(c.bg, c.text, c.border, c.glow) : "border-sidebar-border/60 text-sidebar-foreground/50 hover:text-sidebar-foreground"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", active ? c.dot : "bg-sidebar-foreground/30")} />
                {s.label}
                {count > 0 && <span className="font-jetbrains opacity-70">{count}</span>}
              </button>
            )
          })}
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2 mr-auto">
          {serverDown ? (
            <StatusBadge label="الخادم غير متاح" color="red" glow />
          ) : loading ? (
            <StatusBadge label="بدء التشغيل…" color="amber" />
          ) : (
            <StatusBadge label={stateMeta?.label ?? "سليم"} color={stateMeta?.color ?? "green"} glow={systemState !== "NOMINAL"} />
          )}

          {/* Corpus version */}
          <div className="hidden md:flex items-center gap-2 rounded border border-sidebar-border/60 px-2.5 py-1 font-jetbrains text-[10px] text-sidebar-foreground/70">
            <Database className="h-3 w-3 text-amber-400" />
            {health?.corpusVersion ?? "EJB-CORPUS-2026.08-R1"}
          </div>

          {/* Infrastructure health */}
          <div className="hidden xl:flex items-center gap-1.5">
            <IndicatorDot ok={health?.server ?? !serverDown} label="خادم" />
            <IndicatorDot ok={health?.database ?? false} label="قاعدة بيانات" />
          </div>

          <button
            onClick={() => onNavigate("research")}
            className={cn(
              "flex items-center gap-1.5 rounded border px-2.5 py-1.5 font-kufi text-[11px] transition-colors",
              activeView === "research"
                ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                : "border-sidebar-border/60 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:border-sidebar-border"
            )}
          >
            <BookMarked className="h-3.5 w-3.5" />
            مركز البحث
          </button>
          <button
            onClick={() => onNavigate("audit")}
            className={cn(
              "flex items-center gap-1.5 rounded border px-2.5 py-1.5 font-kufi text-[11px] transition-colors",
              activeView === "audit"
                ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                : "border-sidebar-border/60 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:border-sidebar-border"
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            سجل التدقيق
          </button>
          <button
            onClick={() => onNavigate("settings")}
            className={cn(
              "flex items-center gap-1.5 rounded border px-2.5 py-1.5 font-kufi text-[11px] transition-colors",
              activeView === "settings"
                ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                : "border-sidebar-border/60 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:border-sidebar-border"
            )}
          >
            <Settings2 className="h-3.5 w-3.5" />
            الإعدادات
          </button>
        </div>
      </div>
    </header>
  )
}

function IndicatorDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1" title={label}>
      <span className={cn("h-1.5 w-1.5 rounded-full", ok ? "bg-emerald-400" : "bg-red-500 sovereign-pulse")} />
      <span className="font-kufi text-[9px] text-sidebar-foreground/60">{label}</span>
    </div>
  )
}
