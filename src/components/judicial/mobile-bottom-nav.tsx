"use client"

import * as React from "react"
import { Home, FolderOpen, Database, ShieldCheck, Lightbulb } from "lucide-react"
import { cn, colorClasses } from "@/lib/judicial/ui"
import type { View } from "./judicial-brain-app"

const NAV_ITEMS: Array<{ key: View; label: string; icon: React.ReactNode }> = [
  { key: "operations", label: "الرئيسية", icon: <Home className="h-5 w-5" /> },
  { key: "research", label: "السجل", icon: <Database className="h-5 w-5" /> },
  { key: "audit", label: "التدقيق", icon: <ShieldCheck className="h-5 w-5" /> },
  { key: "settings", label: "الإعدادات", icon: <Lightbulb className="h-5 w-5" /> },
]

export function MobileBottomNav({
  view, onNavigate, caseCount,
}: {
  view: View
  onNavigate: (v: View) => void
  caseCount: number
}) {
  return (
    <nav className="mobile-bottom-nav">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const active = view === item.key
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all press-feedback",
                active ? "text-amber-600" : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                active ? "bg-amber-500/15" : ""
              )}>
                {item.icon}
              </div>
              <span className="font-kufi text-[9px]">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
