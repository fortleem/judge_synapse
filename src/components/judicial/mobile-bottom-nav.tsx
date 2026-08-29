"use client"

import * as React from "react"
import {
  Home, FolderOpen, Database, ShieldCheck, Settings2, MapPin,
  Search, Plus, type LucideIcon,
} from "lucide-react"
import { cn, colorClasses } from "@/lib/judicial/ui"
import type { View } from "./judicial-brain-app"

// 2026 State-of-the-art Mobile Bottom Navigation
// — Large 56px touch targets (Apple HIG minimum)
// — Active state with glow + pill background
// — Micro-interactions: scale on press, bounce on active
// — Floating Action Button (FAB) for quick search
// — Haptic-like visual feedback

interface NavItem {
  key: View | "cases" | "search"
  label: string
  icon: LucideIcon
  color: string
}

const NAV_ITEMS: NavItem[] = [
  { key: "operations", label: "الرئيسية", icon: Home, color: "amber" },
  { key: "cases", label: "القضايا", icon: FolderOpen, color: "emerald" },
  { key: "search", label: "بحث", icon: Search, color: "violet" },
  { key: "courts", label: "المحاكم", icon: MapPin, color: "blue" },
  { key: "audit", label: "التدقيق", icon: ShieldCheck, color: "rose" },
]

export function MobileBottomNav({
  view, onNavigate, caseCount, onSearch, onShowCases,
}: {
  view: View
  onNavigate: (v: View) => void
  caseCount: number
  onSearch: () => void
  onShowCases: () => void
}) {
  const handleNav = (key: string) => {
    if (key === "search") onSearch()
    else if (key === "cases") onShowCases()
    else onNavigate(key as View)
  }

  return (
    <nav className="mobile-bottom-nav">
      <div className="flex items-stretch justify-between gap-1">
        {NAV_ITEMS.map((item) => {
          const active = view === item.key
          const cc = colorClasses(item.color)
          const Icon = item.icon

          return (
            <button
              key={item.key}
              onClick={() => handleNav(item.key)}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-all duration-200 active:scale-90",
                active ? "" : "opacity-60"
              )}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              {/* Active glow background */}
              {active && (
                <div className={cn("absolute inset-0 rounded-xl", cc.bg)} />
              )}

              {/* Icon with active glow */}
              <div className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                active ? cn(cc.bg, cc.text, cc.glow) : "text-muted-foreground"
              )}>
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                {/* Badge for cases */}
                {item.key === "cases" && caseCount > 0 && (
                  <span className={cn(
                    "absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[9px] font-bold px-1",
                    active ? cc.dot : "bg-muted text-muted-foreground"
                  )}>
                    {caseCount > 99 ? "99+" : caseCount}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={cn(
                "relative font-kufi text-[10px] font-medium transition-colors",
                active ? cc.text : "text-muted-foreground"
              )}>
                {item.label}
              </span>

              {/* Active indicator dot */}
              {active && (
                <div className={cn("absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full", cc.dot)} />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ─── Floating Action Button (FAB) ──────────────────────────────
// Quick access to create new case / upload document
export function MobileFAB({ onClick, icon: Icon = Plus, label }: { onClick: () => void; icon?: LucideIcon; label: string }) {
  const [expanded, setExpanded] = React.useState(false)

  return (
    <div className="fixed bottom-20 left-4 z-50 md:hidden">
      {expanded && (
        <div className="absolute bottom-16 left-0 space-y-2 animate-slide-up">
          <button
            onClick={() => { onClick(); setExpanded(false) }}
            className="flex items-center gap-2 rounded-full bg-card border border-border shadow-lg px-4 py-2.5 font-kufi text-xs hover:shadow-xl transition-shadow"
          >
            <Icon className="h-4 w-4 text-amber-600" />
            {label}
          </button>
        </div>
      )}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-xl transition-all duration-200 active:scale-90",
          expanded && "rotate-45"
        )}
        aria-label={label}
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>
    </div>
  )
}

// ─── Mobile Case Tabs (horizontal scroll with snap) ─────────────
export function MobileCaseTabs({
  tabs, active, onSelect,
}: {
  tabs: Array<{ key: string; label: string; badge?: number }>
  active: string
  onSelect: (key: string) => void
}) {
  return (
    <div className="scroll-snap-x overflow-x-auto scroll-sovereign flex gap-1.5 px-3 py-2 border-b border-border bg-background/60 md:hidden">
      {tabs.map((tab) => {
        const isActive = tab.key === active
        const cc = colorClasses(isActive ? "amber" : "slate")
        return (
          <button
            key={tab.key}
            onClick={() => onSelect(tab.key)}
            className={cn(
              "scroll-snap-item flex items-center gap-1.5 rounded-full px-3.5 py-2 font-kufi text-xs whitespace-nowrap transition-all active:scale-95",
              isActive ? cn(cc.bg, cc.text, "font-semibold") : "bg-muted/50 text-muted-foreground"
            )}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={cn(
                "font-jetbrains text-[9px] px-1.5 py-0.5 rounded-full",
                isActive ? "bg-amber-500/30" : "bg-muted"
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
