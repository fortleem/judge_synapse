"use client"

import * as React from "react"
import { Scale, Database, ShieldCheck, WifiOff, ServerOff } from "lucide-react"
import { cn, colorClasses } from "@/lib/judicial/ui"
import { OPERATING_STATES, findConstant } from "@/lib/judicial/constants"

export function SovereignFooter({
  corpusVersion, systemState, serverDown,
}: {
  corpusVersion: string
  systemState: string
  serverDown: boolean
}) {
  const stateMeta = findConstant(OPERATING_STATES, serverDown ? "SYSTEM_DEGRADED" : systemState)
  const cc = colorClasses(stateMeta?.color ?? "green")

  return (
    <footer className="mt-auto border-t border-border bg-sidebar text-sidebar-foreground">
      <div className="gold-rule opacity-60" />
      <div className="px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-serif-judicial text-sm font-bold text-amber-300">المنصة القضائية الذكية</span>
            <span className="font-jetbrains text-[9px] text-sidebar-foreground/50">V2.1</span>
          </div>
          <span className="text-sidebar-border">|</span>
          <div className="flex items-center gap-1.5 font-jetbrains text-[10px] text-sidebar-foreground/70">
            <Database className="h-3 w-3 text-amber-400" />
            {corpusVersion}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            {serverDown ? <WifiOff className="h-3 w-3 text-red-400" /> : <ShieldCheck className={cn("h-3 w-3", cc.text)} />}
            <span className={cn("font-kufi text-[10px]", cc.text)}>
              {serverDown ? "وضع تجريبي — الخادم غير متاح" : stateMeta?.label ?? "سليم"}
            </span>
          </div>
          <span className="font-kufi text-[9px] text-sidebar-foreground/40">سجل تدقيق مُلحق — قابل لإعادة الإنتاج</span>
        </div>
      </div>
    </footer>
  )
}
