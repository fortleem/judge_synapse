"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { api, isServerUnreachable } from "@/lib/judicial/api-client"
import type { CaseT, DashboardT, CaseDetailT, HealthT } from "@/lib/judicial/schemas"
import { SovereignHeader } from "./sovereign-header"
import { CaseSidebar } from "./case-sidebar"
import { CaseWorkspace } from "./case-workspace"
import { OperationsDashboard } from "./operations-dashboard"
import { SovereignFooter } from "./sovereign-footer"
import { FallbackDemoMode } from "./fallback"
import { SettingsTab } from "./tabs/settings"
import { LegalResearchCenter } from "./legal-research-center"
import { AuditLogView } from "./audit-log-view"
import { CourtDirectory } from "./court-directory-view"
import { CommandPalette } from "./command-palette"
import { MobileBottomNav, MobileFAB } from "./mobile-bottom-nav"

export type View = "operations" | "settings" | "research" | "audit" | "courts"

export function JudicialBrainApp() {
  const [selectedCaseId, setSelectedCaseId] = React.useState<string | null>(null)
  const [view, setView] = React.useState<View>("operations")
  const [cmdkOpen, setCmdkOpen] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  const healthQ = useQuery<HealthT>({
    queryKey: ["health"],
    queryFn: api.health,
    refetchInterval: 30000,
    retry: 1,
  })

  const dashboardQ = useQuery<DashboardT>({
    queryKey: ["dashboard"],
    queryFn: api.dashboard,
    enabled: !healthQ.isError,
    retry: 1,
  })

  const casesQ = useQuery<CaseT[]>({
    queryKey: ["cases"],
    queryFn: () => api.listCases(),
    enabled: !healthQ.isError,
    retry: 1,
  })

  const selectedQ = useQuery<CaseDetailT>({
    queryKey: ["case", selectedCaseId],
    queryFn: () => api.getCase(selectedCaseId!),
    enabled: !!selectedCaseId && !healthQ.isError,
    retry: 1,
  })

  const serverDown = healthQ.isError || isServerUnreachable()

  // Detect mobile
  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // Keyboard shortcuts
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K — command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCmdkOpen((v) => !v)
        return
      }
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return

      // G + key navigation (Vim-style)
      if (e.key === "g") {
        const handler2 = (e2: KeyboardEvent) => {
          if (e2.key === "h") { setView("operations"); setSelectedCaseId(null) }
          else if (e2.key === "r") { setView("research"); setSelectedCaseId(null) }
          else if (e2.key === "a") { setView("audit"); setSelectedCaseId(null) }
          else if (e2.key === "s") { setView("settings"); setSelectedCaseId(null) }
          window.removeEventListener("keydown", handler2)
        }
        window.addEventListener("keydown", handler2, { once: true })
        setTimeout(() => window.removeEventListener("keydown", handler2), 1000)
      }
      // Escape — go back to dashboard
      if (e.key === "Escape" && selectedCaseId) {
        setSelectedCaseId(null)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [selectedCaseId])

  // Listen for custom navigation events (from command palette / quick actions)
  React.useEffect(() => {
    const navHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail === "research") { setView("research"); setSelectedCaseId(null) }
      else if (detail === "audit") { setView("audit"); setSelectedCaseId(null) }
      else if (detail === "settings") { setView("settings"); setSelectedCaseId(null) }
      else if (detail === "operations") { setView("operations"); setSelectedCaseId(null) }
      else if (detail === "navigate-case" && casesQ.data?.[0]) { setSelectedCaseId(casesQ.data[0].id); setView("operations") }
      else if (detail === "new-case" && casesQ.data?.[0]) { setSelectedCaseId(casesQ.data[0].id); setView("operations") }
    }
    const cmdkHandler = () => setCmdkOpen(true)
    window.addEventListener("navigate", navHandler as EventListener)
    window.addEventListener("open-cmdk", cmdkHandler)
    return () => {
      window.removeEventListener("navigate", navHandler as EventListener)
      window.removeEventListener("open-cmdk", cmdkHandler)
    }
  }, [casesQ.data])

  const handleNavigate = (v: View) => { setView(v); setSelectedCaseId(null) }

  return (
    <div className="min-h-screen flex flex-col bg-background sovereign-grid">
      {/* Command Palette */}
      <CommandPalette
        open={cmdkOpen}
        onOpenChange={setCmdkOpen}
        onSelectCase={(id) => { setSelectedCaseId(id); setView("operations") }}
      />

      <SovereignHeader
        health={healthQ.data}
        dashboard={dashboardQ.data}
        loading={healthQ.isLoading}
        serverDown={serverDown}
        onNavigate={handleNavigate}
        activeView={view}
      />

      <div className="flex-1 flex min-h-0">
        {/* Hide sidebar on mobile */}
        {!isMobile && (
          <CaseSidebar
            cases={casesQ.data ?? []}
            loading={casesQ.isLoading}
            selectedId={selectedCaseId}
            onSelect={(id) => { setSelectedCaseId(id); setView("operations") }}
            serverDown={serverDown}
          />
        )}

        <main className="flex-1 min-w-0 flex flex-col pb-16 md:pb-0">
          {serverDown ? (
            <FallbackDemoMode />
          ) : selectedCaseId ? (
            selectedQ.isLoading || !selectedQ.data ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
              </div>
            ) : (
              <CaseWorkspace caseDetail={selectedQ.data} loading={false} />
            )
          ) : view === "settings" ? (
            <SettingsTab />
          ) : view === "research" ? (
            <LegalResearchCenter />
          ) : view === "audit" ? (
            <AuditLogView />
          ) : view === "courts" ? (
            <CourtDirectory />
          ) : (
            <OperationsDashboard
              dashboard={dashboardQ.data}
              cases={casesQ.data ?? []}
              loading={dashboardQ.isLoading}
              onSelectCase={(id) => setSelectedCaseId(id)}
            />
          )}
        </main>
      </div>

      <SovereignFooter
        corpusVersion={dashboardQ.data?.corpusVersion ?? "EJB-CORPUS-2026.08-R1"}
        systemState={dashboardQ.data?.systemState ?? "NOMINAL"}
        serverDown={serverDown}
      />

      {/* Mobile bottom navigation */}
      {isMobile && (
        <>
          <MobileBottomNav
            view={view}
            onNavigate={handleNavigate}
            caseCount={casesQ.data?.length ?? 0}
            onSearch={() => setCmdkOpen(true)}
            onShowCases={() => { setView("operations"); setSelectedCaseId(null) }}
          />
          {/* FAB — only on dashboard view */}
          {!selectedCaseId && view === "operations" && (
            <MobileFAB
              onClick={() => { if (casesQ.data?.[0]) { setSelectedCaseId(casesQ.data[0].id); setView("operations") } }}
              label="قضية جديدة"
            />
          )}
        </>
      )}
    </div>
  )
}
