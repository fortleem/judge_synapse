"use client"

import * as React from "react"
import { Scale, ShieldCheck, Activity, Settings2, BookMarked, UserRound, Search, MapPin } from "lucide-react"
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

  const [dateStr, setDateStr] = React.useState<string | null>(null)
  React.useEffect(() => {
    setDateStr(new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" }))
  }, [])

  const navItems: Array<{ key: View; label: string; icon: React.ReactNode }> = [
    { key: "operations", label: "الرئيسية", icon: <Activity className="h-3.5 w-3.5" /> },
    { key: "courts", label: "دليل المحاكم", icon: <MapPin className="h-3.5 w-3.5" /> },
    { key: "research", label: "السجل القانوني", icon: <BookMarked className="h-3.5 w-3.5" /> },
    { key: "audit", label: "التدقيق", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
    { key: "settings", label: "الإعدادات", icon: <Settings2 className="h-3.5 w-3.5" /> },
  ]

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-sidebar text-sidebar-foreground backdrop-blur supports-[backdrop-filter]:bg-sidebar/95">
      <div className="gold-rule" />

      {/* Welcome — minimal */}
      <div className="px-4 py-1 bg-sidebar-accent/30 border-b border-sidebar-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 shrink-0">
            <UserRound className="h-3 w-3" />
          </div>
          <span className="font-serif-judicial text-xs text-amber-200">
            أهلاً وسهلاً بسيادة المستشار / شريف
          </span>
        </div>
        <span className="font-jetbrains text-[9px] text-sidebar-foreground/40 hidden md:inline" suppressHydrationWarning>
          {dateStr ?? ""}
        </span>
      </div>

      {/* Main bar — clean, minimal */}
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-900 seal-frame">
            <Scale className="h-5 w-5 text-amber-400" strokeWidth={1.5} />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-serif-judicial text-base font-bold leading-tight text-amber-300">
              المنصة القضائية الذكية
            </h1>
            <p className="font-jetbrains text-[9px] text-sidebar-foreground/50 tracking-wider">
              EGYPTIAN JUDICIAL SMART · V2.1
            </p>
          </div>
        </div>

        {/* Center nav — clean pills */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const active = activeView === item.key
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-kufi text-[11px] transition-all active:scale-95",
                  active
                    ? "bg-amber-500/15 text-amber-300 font-semibold"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Right — status + search */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Status dot */}
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "h-2 w-2 rounded-full",
              serverDown ? "bg-red-500 sovereign-pulse"
                : loading ? "bg-amber-400 sovereign-pulse"
                : systemState === "NOMINAL" ? "bg-emerald-400"
                : "bg-amber-400 sovereign-pulse"
            )} />
            <span className="hidden lg:inline font-kufi text-[10px] text-sidebar-foreground/50">
              {serverDown ? "غير متاح" : loading ? "بدء التشغيل" : stateMeta?.label ?? "سليم"}
            </span>
          </div>

          {/* Cmd+K */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-cmdk"))}
            className="flex items-center gap-1.5 rounded-lg border border-sidebar-border/40 bg-sidebar-accent/20 px-2.5 py-1.5 font-kufi text-[10px] text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
            title="بحث سريع"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">بحث</span>
            <kbd className="font-jetbrains text-[8px] px-1 py-0.5 rounded border border-sidebar-border/40 bg-sidebar/30">⌘K</kbd>
          </button>
        </div>
      </div>

      {/* Mobile nav pills */}
      <nav className="md:hidden flex items-center gap-1 px-3 py-1.5 border-t border-sidebar-border/30 overflow-x-auto scroll-sovereign">
        {navItems.map((item) => {
          const active = activeView === item.key
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 font-kufi text-[10px] whitespace-nowrap transition-all active:scale-95",
                active ? "bg-amber-500/15 text-amber-300 font-semibold" : "text-sidebar-foreground/50"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          )
        })}
      </nav>
    </header>
  )
}
