// Egyptian Judicial Brain V2.1 — Typed API Client
// Frontend client with typed responses + demo fallback when server unreachable

import { z } from "zod"
import {
  CaseSchema, CaseDetailSchema, DashboardSchema, HealthSchema, SettingSchema,
  ContrarySearchResultSchema,
  LegalSourceSchema, LegalTextSchema, CorpusSnapshotSchema, ImportJobSchema,
  AuditLogSchema, ConflictSchema, AdversaryReviewSchema, JudgeNoteSchema, CitationVerificationSchema,
  CaseDeadlineSchema, StoredDocumentSchema,
  type CaseT, type CaseDetailT, type DashboardT, type HealthT,
  type SettingT, type ContrarySearchResult,
  type LegalSourceT, type LegalTextT, type CorpusSnapshotT, type ImportJobT,
  type AuditLogT, type ConflictT, type AdversaryReviewT, type JudgeNoteT, type CitationVerificationT,
  type CaseDeadlineT, type StoredDocumentT,
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

  // ─── Legal Corpus ──
  async listSources(params?: { sourceType?: string; accessStatus?: string; q?: string }): Promise<LegalSourceT[]> {
    const qs = new URLSearchParams()
    if (params?.sourceType) qs.set("sourceType", params.sourceType)
    if (params?.accessStatus) qs.set("accessStatus", params.accessStatus)
    if (params?.q) qs.set("q", params.q)
    const path = `/corpus/sources${qs.toString() ? `?${qs.toString()}` : ""}`
    return request(path, { cache: "no-store" }, z.array(LegalSourceSchema))
  },

  async createSource(input: Record<string, unknown>): Promise<LegalSourceT> {
    return request("/corpus/sources", { method: "POST", body: JSON.stringify(input) }, LegalSourceSchema)
  },

  async listTexts(params?: { q?: string; legalDomain?: string; documentType?: string; verificationStatus?: string; temporalStatus?: string; sourceId?: string }): Promise<LegalTextT[]> {
    const qs = new URLSearchParams()
    if (params?.q) qs.set("q", params.q)
    if (params?.legalDomain) qs.set("legalDomain", params.legalDomain)
    if (params?.documentType) qs.set("documentType", params.documentType)
    if (params?.verificationStatus) qs.set("verificationStatus", params.verificationStatus)
    if (params?.temporalStatus) qs.set("temporalStatus", params.temporalStatus)
    if (params?.sourceId) qs.set("sourceId", params.sourceId)
    const path = `/corpus/texts${qs.toString() ? `?${qs.toString()}` : ""}`
    return request(path, { cache: "no-store" }, z.array(LegalTextSchema))
  },

  async createText(input: Record<string, unknown>): Promise<LegalTextT> {
    return request("/corpus/texts", { method: "POST", body: JSON.stringify(input) }, LegalTextSchema)
  },

  async listSnapshots(): Promise<CorpusSnapshotT[]> {
    return request("/corpus/snapshots", { cache: "no-store" }, z.array(CorpusSnapshotSchema))
  },

  async createSnapshot(input: Record<string, unknown>): Promise<CorpusSnapshotT> {
    return request("/corpus/snapshots", { method: "POST", body: JSON.stringify(input) }, CorpusSnapshotSchema)
  },

  async listImportJobs(): Promise<ImportJobT[]> {
    return request("/corpus/import-queue", { cache: "no-store" }, z.array(ImportJobSchema))
  },

  async createImportJob(input: Record<string, unknown>): Promise<ImportJobT> {
    return request("/corpus/import-queue", { method: "POST", body: JSON.stringify(input) }, ImportJobSchema)
  },

  async updateImportJob(id: string, patch: Record<string, unknown>): Promise<ImportJobT> {
    return request(`/corpus/import-queue/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) }, ImportJobSchema)
  },

  async searchCorpus(query: string, opts?: { legalDomain?: string; documentType?: string; temporalStatus?: string; verificationFilter?: boolean }) {
    return request("/corpus/search", {
      method: "POST",
      body: JSON.stringify({ query, ...opts }),
    })
  },

  // ─── Conflicts ──
  async detectConflicts(caseId: string): Promise<ConflictT[]> {
    return request(`/cases/${encodeURIComponent(caseId)}/conflicts`, { cache: "no-store" }, z.array(ConflictSchema))
  },

  async updateConflict(caseId: string, conflictId: string, patch: Record<string, unknown>): Promise<ConflictT> {
    return request(`/cases/${encodeURIComponent(caseId)}/conflicts/${encodeURIComponent(conflictId)}`, {
      method: "PATCH", body: JSON.stringify(patch),
    }, ConflictSchema)
  },

  // ─── Adversary Review (Judicial Shadow) ──
  async generateAdversaryReview(caseId: string, proposition: string, targetType?: string, targetId?: string): Promise<AdversaryReviewT> {
    return request(`/cases/${encodeURIComponent(caseId)}/adversary-review`, {
      method: "POST",
      body: JSON.stringify({ proposition, targetType: targetType ?? "proposition", targetId: targetId ?? null }),
    }, AdversaryReviewSchema)
  },

  async transferAdversaryReview(caseId: string, reviewId: string, transferStatus: string, judgeNote?: string): Promise<AdversaryReviewT> {
    return request(`/cases/${encodeURIComponent(caseId)}/adversary-review/${encodeURIComponent(reviewId)}`, {
      method: "PATCH",
      body: JSON.stringify({ transferStatus, judgeNote: judgeNote ?? null }),
    }, AdversaryReviewSchema)
  },

  // ─── Judge Notes ──
  async listNotes(caseId: string): Promise<JudgeNoteT[]> {
    return request(`/cases/${encodeURIComponent(caseId)}/notes`, { cache: "no-store" }, z.array(JudgeNoteSchema))
  },

  async createNote(caseId: string, content: string, itemType?: string, itemId?: string): Promise<JudgeNoteT> {
    return request(`/cases/${encodeURIComponent(caseId)}/notes`, {
      method: "POST",
      body: JSON.stringify({ content, itemType: itemType ?? "general", itemId: itemId ?? null }),
    }, JudgeNoteSchema)
  },

  async updateNote(caseId: string, noteId: string, patch: Record<string, unknown>): Promise<JudgeNoteT> {
    return request(`/cases/${encodeURIComponent(caseId)}/notes/${encodeURIComponent(noteId)}`, {
      method: "PATCH", body: JSON.stringify(patch),
    }, JudgeNoteSchema)
  },

  async deleteNote(caseId: string, noteId: string) {
    await request(`/cases/${encodeURIComponent(caseId)}/notes/${encodeURIComponent(noteId)}`, { method: "DELETE" })
  },

  // ─── Audit Log ──
  async listAudit(caseId?: string, source?: string): Promise<AuditLogT[]> {
    const qs = new URLSearchParams()
    if (caseId) qs.set("caseId", caseId)
    if (source) qs.set("source", source)
    const path = `/audit${qs.toString() ? `?${qs.toString()}` : ""}`
    return request(path, { cache: "no-store" }, z.array(AuditLogSchema))
  },

  // ─── Citation Verification ──
  async verifyCitation(caseId: string, citation: string, claimedSource?: string): Promise<CitationVerificationT> {
    return request(`/cases/${encodeURIComponent(caseId)}/verify-citation`, {
      method: "POST",
      body: JSON.stringify({ citation, claimedSource: claimedSource ?? null }),
    }, CitationVerificationSchema)
  },

  // ─── Legal Deadlines ──
  async listDeadlines(caseId: string): Promise<CaseDeadlineT[]> {
    return request(`/cases/${encodeURIComponent(caseId)}/deadlines`, { cache: "no-store" }, z.array(CaseDeadlineSchema))
  },

  async createDeadline(caseId: string, deadlineType: string, startDate: string, defendantAbroad = false, notes?: string): Promise<CaseDeadlineT> {
    return request(`/cases/${encodeURIComponent(caseId)}/deadlines`, {
      method: "POST",
      body: JSON.stringify({ deadlineType, startDate, defendantAbroad, notes: notes ?? null }),
    }, CaseDeadlineSchema)
  },

  async deleteDeadline(caseId: string, deadlineId: string) {
    await request(`/cases/${encodeURIComponent(caseId)}/deadlines/${encodeURIComponent(deadlineId)}`, { method: "DELETE" })
  },

  // ─── Sphinx AI Assist (External Model Gateway) ──
  async aiAssist(caseId: string, task: string, prompt: string, maxTokens?: number) {
    return request(`/cases/${encodeURIComponent(caseId)}/ai-assist`, {
      method: "POST",
      body: JSON.stringify({ task, prompt, maxTokens }),
    })
  },

  // ─── Document Upload & AI Extraction ──
  async uploadDocument(caseId: string, file: File, uploadedBy = "judge", sourceType = "case_file"): Promise<StoredDocumentT> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("uploadedBy", uploadedBy)
    formData.append("sourceType", sourceType)
    const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}/documents/upload`, {
      method: "POST",
      body: formData,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    markServerUnreachable(false)
    if (json?.ok === false) throw new Error(json.error?.message ?? "Upload error")
    return StoredDocumentSchema.parse(json.data)
  },

  async listDocuments(caseId: string): Promise<StoredDocumentT[]> {
    return request(`/cases/${encodeURIComponent(caseId)}/documents`, { cache: "no-store" }, z.array(StoredDocumentSchema))
  },

  async deleteDocument(caseId: string, docId: string) {
    await request(`/cases/${encodeURIComponent(caseId)}/documents/${encodeURIComponent(docId)}`, { method: "DELETE" })
  },

  async extractDocument(caseId: string, docId: string, manualText?: string) {
    return request(`/cases/${encodeURIComponent(caseId)}/documents/${encodeURIComponent(docId)}/extract`, {
      method: "POST",
      body: JSON.stringify({ text: manualText ?? null }),
    })
  },

  async promoteExtractions(caseId: string, docId: string, items: Array<{ type: string; data: Record<string, unknown> }>) {
    return request(`/cases/${encodeURIComponent(caseId)}/documents/${encodeURIComponent(docId)}/promote`, {
      method: "POST",
      body: JSON.stringify({ items }),
    })
  },

  // ─── Law Number Check (with web search) ──
  async checkLaw(caseId: string, lawNumber: string, courtType: string) {
    return request(`/cases/${encodeURIComponent(caseId)}/law-check`, {
      method: "POST",
      body: JSON.stringify({ lawNumber, courtType }),
    })
  },

  // ─── Contradiction Alerts ──
  async scanContradictions(caseId: string) {
    return request(`/cases/${encodeURIComponent(caseId)}/contradictions`, { cache: "no-store" })
  },

  // ─── Legal Strength Analysis ──
  async analyzeStrength(caseId: string) {
    return request(`/cases/${encodeURIComponent(caseId)}/strength`, { cache: "no-store" })
  },
}
