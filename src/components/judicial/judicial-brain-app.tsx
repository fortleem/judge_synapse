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

export type View = "operations" | "settings" | "research" | "audit"

export function JudicialBrainApp() {
  const [selectedCaseId, setSelectedCaseId] = React.useState<string | null>(null)
  const [view, setView] = React.useState<View>("operations")

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

  return (
    <div className="min-h-screen flex flex-col bg-background sovereign-grid">
      <SovereignHeader
        health={healthQ.data}
        dashboard={dashboardQ.data}
        loading={healthQ.isLoading}
        serverDown={serverDown}
        onNavigate={(v) => { setView(v); setSelectedCaseId(null) }}
        activeView={view}
      />

      <div className="flex-1 flex min-h-0">
        <CaseSidebar
          cases={casesQ.data ?? []}
          loading={casesQ.isLoading}
          selectedId={selectedCaseId}
          onSelect={(id) => { setSelectedCaseId(id); setView("operations") }}
          serverDown={serverDown}
        />

        <main className="flex-1 min-w-0 flex flex-col">
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
    </div>
  )
}
