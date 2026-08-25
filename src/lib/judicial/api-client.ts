// Egyptian Judicial Brain V2.1 — Typed API Client
// Frontend client with typed responses + demo fallback when server unreachable

import { z } from "zod"
import {
  CaseSchema, CaseDetailSchema, DashboardSchema, HealthSchema, SettingSchema,
  ContrarySearchResultSchema,
  type CaseT, type CaseDetailT, type DashboardT, type HealthT,
  type SettingT, type ContrarySearchResult,
} from "./schemas"

export const API_BASE = "/api"

let serverUnreachable = false
let lastCheckedAt = 0

export function isServerUnreachable() {
  return serverUnreachable
}

export function markServerUnreachable(v: boolean) {
  serverUnreachable = v
}

async function request<T>(path: string, init?: RequestInit, schema?: { parse: (x: unknown) => T }): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    const json = await res.json()
    markServerUnreachable(false)
    if (json?.ok === false) {
      throw new Error(json.error?.message ?? "API error")
    }
    const data = json?.data ?? json
    return schema ? schema.parse(data) : (data as T)
  } catch (err) {
    markServerUnreachable(true)
    throw err
  }
}

// ─── Cases ───────────────────────────────────────────────────────
export const api = {
  async health(): Promise<HealthT> {
    return request("/health", { cache: "no-store" }, HealthSchema)
  },

  async dashboard(): Promise<DashboardT> {
    return request("/dashboard", { cache: "no-store" }, DashboardSchema)
  },

  async listCases(params?: { stage?: string; risk?: string; q?: string }): Promise<CaseT[]> {
    const qs = new URLSearchParams()
    if (params?.stage) qs.set("stage", params.stage)
    if (params?.risk) qs.set("risk", params.risk)
    if (params?.q) qs.set("q", params.q)
    const path = `/cases${qs.toString() ? `?${qs.toString()}` : ""}`
    return request(path, { cache: "no-store" }, z.array(CaseSchema))
  },

  async getCase(id: string): Promise<CaseDetailT> {
    return request(`/cases/${encodeURIComponent(id)}`, { cache: "no-store" }, CaseDetailSchema)
  },

  async createCase(input: Record<string, unknown>): Promise<CaseT> {
    return request("/cases", {
      method: "POST",
      body: JSON.stringify(input),
    }, CaseSchema)
  },

  async updateCase(id: string, patch: Record<string, unknown>): Promise<CaseT> {
    return request(`/cases/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }, CaseSchema)
  },

  async deleteCase(id: string): Promise<void> {
    await request(`/cases/${encodeURIComponent(id)}`, { method: "DELETE" })
  },

  // ─── Sub-entities ──
  async createFact(caseId: string, input: Record<string, unknown>) {
    return request(`/cases/${encodeURIComponent(caseId)}/facts`, {
      method: "POST", body: JSON.stringify(input),
    })
  },

  async updateFact(caseId: string, factId: string, patch: Record<string, unknown>) {
    return request(`/cases/${encodeURIComponent(caseId)}/facts/${encodeURIComponent(factId)}`, {
      method: "PATCH", body: JSON.stringify(patch),
    })
  },

  async deleteFact(caseId: string, factId: string) {
    await request(`/cases/${encodeURIComponent(caseId)}/facts/${encodeURIComponent(factId)}`, { method: "DELETE" })
  },

  async createEvidence(caseId: string, input: Record<string, unknown>) {
    return request(`/cases/${encodeURIComponent(caseId)}/evidence`, {
      method: "POST", body: JSON.stringify(input),
    })
  },

  async deleteEvidence(caseId: string, evidenceId: string) {
    await request(`/cases/${encodeURIComponent(caseId)}/evidence/${encodeURIComponent(evidenceId)}`, { method: "DELETE" })
  },

  async createTimelineEvent(caseId: string, input: Record<string, unknown>) {
    return request(`/cases/${encodeURIComponent(caseId)}/timeline`, {
      method: "POST", body: JSON.stringify(input),
    })
  },

  async deleteTimelineEvent(caseId: string, eventId: string) {
    await request(`/cases/${encodeURIComponent(caseId)}/timeline/${encodeURIComponent(eventId)}`, { method: "DELETE" })
  },

  async createIssue(caseId: string, input: Record<string, unknown>) {
    return request(`/cases/${encodeURIComponent(caseId)}/issues`, {
      method: "POST", body: JSON.stringify(input),
    })
  },

  async deleteIssue(caseId: string, issueId: string) {
    await request(`/cases/${encodeURIComponent(caseId)}/issues/${encodeURIComponent(issueId)}`, { method: "DELETE" })
  },

  async createAuthority(caseId: string, input: Record<string, unknown>) {
    return request(`/cases/${encodeURIComponent(caseId)}/authorities`, {
      method: "POST", body: JSON.stringify(input),
    })
  },

  async deleteAuthority(caseId: string, authorityId: string) {
    await request(`/cases/${encodeURIComponent(caseId)}/authorities/${encodeURIComponent(authorityId)}`, { method: "DELETE" })
  },

  // ─── Contrary authority active search ──
  async searchContraryAuthorities(caseId: string, proposition: string): Promise<ContrarySearchResult> {
    return request(
      `/cases/${encodeURIComponent(caseId)}/contrary-search`,
      { method: "POST", body: JSON.stringify({ proposition }) },
      ContrarySearchResultSchema
    )
  },

  // ─── Judge fields ──
  async updateJudgeField(caseId: string, fieldType: string, content: string, status?: string) {
    return request(`/cases/${encodeURIComponent(caseId)}/judge/${fieldType}`, {
      method: "PATCH",
      body: JSON.stringify({ content, status }),
    })
  },

  // ─── Settings ──
  async listSettings(): Promise<SettingT[]> {
    return request("/settings", { cache: "no-store" }, z.array(SettingSchema))
  },

  async upsertSetting(category: string, key: string, value: string) {
    return request("/settings", {
      method: "POST",
      body: JSON.stringify({ category, key, value }),
    })
  },
}
