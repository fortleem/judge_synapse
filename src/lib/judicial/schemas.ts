// Egyptian Judicial Brain V2.1 — Zod Schemas
// Typed API contract for the judicial control system

import { z } from "zod"

// ─── Enums (mirror constants) ────────────────────────────────────
export const ProceduralStageSchema = z.enum([
  "FILED", "REGISTERED", "SERVICE", "PLEADINGS", "EVIDENCE", "EXPERT",
  "HEARING", "DELIBERATION", "JUDGMENT", "APPEAL", "FINALITY", "EXECUTION",
])
export const RiskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
export const OperatingStateSchema = z.enum([
  "NOMINAL", "REVIEW", "INSUFFICIENT_EVIDENCE", "CONFLICT", "SYSTEM_DEGRADED",
])
export const FactStatusSchema = z.enum([
  "alleged", "admitted", "denied", "undisputed", "supported",
  "contradicted", "judicially_established", "unresolved",
])
export const FactMaterialitySchema = z.enum(["outcome_material", "supporting", "immaterial"])
export const EvidenceTypeSchema = z.enum([
  "contract", "email", "message", "pdf", "spreadsheet", "image",
  "video", "audio", "signature", "scan", "official_record",
])
export const AdmissibilitySchema = z.enum(["admissible", "challenged", "excluded", "pending_review"])
export const IssueTypeSchema = z.enum([
  "jurisdiction", "admissibility", "procedural", "primary",
  "defense", "counterclaim", "constitutional", "remedy",
])
export const AuthorityStanceSchema = z.enum([
  "supporting", "opposing", "contrary", "distinguishing", "neutral",
])
export const LegalForceSchema = z.enum([
  "constitutional_provision", "statute", "regulation", "executive_decision",
  "constitutional_judgment", "judicial_principle", "court_judgment",
  "state_council_opinion", "administrative_interpretation", "verified_secondary",
  "academic_commentary", "research_only",
])
export const VerificationStatusSchema = z.enum([
  "verified", "partially_verified", "unverified", "blocked",
])
export const JudgeFieldTypeSchema = z.enum([
  "judge_results", "judge_reasoning", "draft", "integrity_review",
])
export const JudgeFieldStatusSchema = z.enum([
  "empty", "ai_proposed", "judge_reviewing", "judge_accepted", "judge_rejected", "judge_modified",
])
export const AIResponseStatusSchema = z.enum([
  "verified", "partially_verified", "conflicted", "insufficient", "unverified", "blocked",
])
export const IndicatorTypeSchema = z.enum([
  "citation_soundness", "legal_version", "defense_coverage", "evidence_consistency",
])
export const IndicatorStatusSchema = z.enum(["pending", "pass", "warn", "fail"])

// ─── Entity schemas ──────────────────────────────────────────────
export const CaseSchema = z.object({
  id: z.string(),
  caseNumber: z.string(),
  title: z.string(),
  court: z.string(),
  circuit: z.string(),
  caseType: z.string(),
  parties: z.string(),
  subjectMatter: z.string(),
  proceduralStage: ProceduralStageSchema,
  riskLevel: RiskLevelSchema,
  operatingState: OperatingStateSchema,
  summary: z.string(),
  filedDate: z.string().nullable(),
  nextHearing: z.string().nullable(),
  aiSyncEnabled: z.boolean(),
  corpusVersion: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type CaseT = z.infer<typeof CaseSchema>

export const FactSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  statement: z.string(),
  status: FactStatusSchema,
  materiality: FactMaterialitySchema,
  party: z.string().nullable(),
  sourceNote: z.string().nullable(),
  aiExtracted: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type FactT = z.infer<typeof FactSchema>

export const EvidenceSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  title: z.string(),
  type: z.enum(["document", "digital"]),
  evidenceType: EvidenceTypeSchema,
  origin: z.string().nullable(),
  source: z.string().nullable(),
  date: z.string().nullable(),
  integrityHash: z.string().nullable(),
  admissibility: AdmissibilitySchema,
  judicialTreatment: z.enum(["unexamined", "accepted", "rejected", "weighed"]),
  relevance: z.string().nullable(),
  metadata: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type EvidenceT = z.infer<typeof EvidenceSchema>

export const TimelineEventSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  eventDate: z.string(),
  eventType: z.string(),
  legalRegime: z.string().nullable(),
  createdAt: z.string(),
})
export type TimelineEventT = z.infer<typeof TimelineEventSchema>

export const LegalIssueSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  issueType: IssueTypeSchema,
  status: z.enum(["open", "resolved", "unresolved", "blocked"]),
  parentId: z.string().nullable(),
  sortOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type LegalIssueT = z.infer<typeof LegalIssueSchema>

export const AuthoritySchema = z.object({
  id: z.string(),
  caseId: z.string(),
  title: z.string(),
  issuingAuthority: z.string().nullable(),
  judicialBody: z.string().nullable(),
  court: z.string().nullable(),
  chamber: z.string().nullable(),
  documentType: z.string().nullable(),
  legalDomain: z.string().nullable(),
  jurisdiction: z.string().nullable(),
  citation: z.string().nullable(),
  referenceDate: z.string().nullable(),
  stance: AuthorityStanceSchema,
  authorityStatus: z.enum(["active", "superseded", "repealed", "archived"]),
  legalForce: LegalForceSchema,
  temporalStatus: z.enum(["current", "historical", "transitional"]),
  sourceTier: z.number(),
  verificationStatus: VerificationStatusSchema,
  exactPassage: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  relationNote: z.string().nullable(),
  contrarySearched: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type AuthorityT = z.infer<typeof AuthoritySchema>

export const JudgeFieldSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  fieldType: JudgeFieldTypeSchema,
  content: z.string(),
  status: JudgeFieldStatusSchema,
  updatedAt: z.string(),
})
export type JudgeFieldT = z.infer<typeof JudgeFieldSchema>

export const AIAnalysisSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  analysisType: z.string(),
  title: z.string(),
  content: z.string(),
  responseStatus: AIResponseStatusSchema,
  provenance: z.string().nullable(),
  modelId: z.string(),
  nonAuthoritative: z.boolean(),
  createdAt: z.string(),
})
export type AIAnalysisT = z.infer<typeof AIAnalysisSchema>

export const IndicatorSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  indicatorType: IndicatorTypeSchema,
  score: z.number(),
  status: IndicatorStatusSchema,
  details: z.string().nullable(),
  updatedAt: z.string(),
})
export type IndicatorT = z.infer<typeof IndicatorSchema>

export const SettingSchema = z.object({
  id: z.string(),
  category: z.string(),
  key: z.string(),
  value: z.string(),
  updatedAt: z.string(),
})
export type SettingT = z.infer<typeof SettingSchema>

// ─── Legal Corpus Layer ──────────────────────────────────────────
export const LegalSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameEn: z.string().nullable(),
  portalUrl: z.string().nullable(),
  sourceType: z.string(),
  issuingBody: z.string(),
  jurisdiction: z.string().nullable(),
  accessStatus: z.string(),
  sourceTier: z.number(),
  contentAvailable: z.string().nullable(),
  accessNotes: z.string().nullable(),
  lastChecked: z.string().nullable(),
  verified: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type LegalSourceT = z.infer<typeof LegalSourceSchema>

export const LegalTextSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  title: z.string(),
  citation: z.string(),
  documentType: z.string(),
  legalDomain: z.string().nullable(),
  legalForce: z.string(),
  effectiveFrom: z.string(),
  effectiveTo: z.string().nullable(),
  versionLabel: z.string(),
  sourceHash: z.string(),
  retrievalTimestamp: z.string(),
  publicationDate: z.string().nullable(),
  officialJournalRef: z.string().nullable(),
  verificationStatus: z.string(),
  temporalStatus: z.string(),
  exactText: z.string(),
  sourceUrl: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type LegalTextT = z.infer<typeof LegalTextSchema>

export const CorpusSnapshotSchema = z.object({
  id: z.string(),
  versionLabel: z.string(),
  createdAt: z.string(),
  sourceManifest: z.string(),
  hash: z.string(),
  signature: z.string().nullable(),
  approvalStatus: z.string(),
  effectiveFrom: z.string(),
  effectiveTo: z.string().nullable(),
  textCount: z.number(),
  sourceCount: z.number(),
  notes: z.string().nullable(),
})
export type CorpusSnapshotT = z.infer<typeof CorpusSnapshotSchema>

export const ImportJobSchema = z.object({
  id: z.string(),
  sourceName: z.string(),
  sourceUrl: z.string().nullable(),
  sourceType: z.string(),
  status: z.string(),
  priority: z.number(),
  requiresAuth: z.boolean(),
  authType: z.string().nullable(),
  lastAttempt: z.string().nullable(),
  contentScope: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type ImportJobT = z.infer<typeof ImportJobSchema>

// ─── Conflict Engine ─────────────────────────────────────────────
export const ConflictSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  conflictType: z.string(),
  status: z.string(),
  authorityAId: z.string().nullable(),
  authorityBId: z.string().nullable(),
  description: z.string(),
  significance: z.string().nullable(),
  explanation: z.string().nullable(),
  judgeReview: z.string(),
  createdAt: z.string(),
})
export type ConflictT = z.infer<typeof ConflictSchema>

// ─── Adversary Review (Judicial Shadow) ──────────────────────────
export const AdversaryReviewSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  targetType: z.string(),
  targetId: z.string().nullable(),
  proposition: z.string(),
  factsAngle: z.string(),
  textAngle: z.string(),
  defenseAngle: z.string(),
  proceduralAngle: z.string(),
  vulnerabilities: z.string().nullable(),
  transferStatus: z.string(),
  transferredAt: z.string().nullable(),
  judgeNote: z.string().nullable(),
  createdAt: z.string(),
})
export type AdversaryReviewT = z.infer<typeof AdversaryReviewSchema>

// ─── Judge Notes ─────────────────────────────────────────────────
export const JudgeNoteSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  itemType: z.string(),
  itemId: z.string().nullable(),
  content: z.string(),
  pinned: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type JudgeNoteT = z.infer<typeof JudgeNoteSchema>

// ─── Audit Log ────────────────────────────────────────────────────
export const AuditLogSchema = z.object({
  id: z.string(),
  caseId: z.string().nullable(),
  actor: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().nullable(),
  source: z.string(),
  details: z.string().nullable(),
  timestamp: z.string(),
})
export type AuditLogT = z.infer<typeof AuditLogSchema>

// ─── Citation Verification ───────────────────────────────────────
export const CitationVerificationSchema = z.object({
  id: z.string(),
  caseId: z.string().nullable(),
  citation: z.string(),
  claimedSource: z.string().nullable(),
  verificationStatus: z.string(),
  canonicalMatch: z.string().nullable(),
  sourceHash: z.string().nullable(),
  legalTextId: z.string().nullable(),
  verifiedAt: z.string(),
  notes: z.string().nullable(),
})
export type CitationVerificationT = z.infer<typeof CitationVerificationSchema>

// ─── Composite / case detail ────────────────────────────────────
export const CaseDetailSchema = CaseSchema.extend({
  facts: z.array(FactSchema),
  evidence: z.array(EvidenceSchema),
  timeline: z.array(TimelineEventSchema),
  issues: z.array(LegalIssueSchema),
  authorities: z.array(AuthoritySchema),
  judgeFields: z.array(JudgeFieldSchema),
  aiAnalyses: z.array(AIAnalysisSchema),
  indicators: z.array(IndicatorSchema),
  conflicts: z.array(ConflictSchema),
  adversaryReviews: z.array(AdversaryReviewSchema),
  notes: z.array(JudgeNoteSchema),
  auditLogs: z.array(AuditLogSchema),
  citationVerifications: z.array(CitationVerificationSchema),
})
export type CaseDetailT = z.infer<typeof CaseDetailSchema>

// ─── API helpers ─────────────────────────────────────────────────
export const ApiSuccessSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ ok: z.literal(true), data })

export const ApiErrorSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
})

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

// ─── Dashboard ───────────────────────────────────────────────────
export const DashboardSchema = z.object({
  totals: z.object({
    cases: z.number(),
    facts: z.number(),
    evidence: z.number(),
    authorities: z.number(),
    pendingReview: z.number(),
    conflicts: z.number(),
  }),
  byStage: z.array(z.object({ stage: z.string(), count: z.number() })),
  byRisk: z.array(z.object({ risk: z.string(), count: z.number() })),
  byOperatingState: z.array(z.object({ state: z.string(), count: z.number() })),
  recentCases: z.array(CaseSchema),
  corpusVersion: z.string(),
  systemState: OperatingStateSchema,
  degraded: z.boolean(),
})
export type DashboardT = z.infer<typeof DashboardSchema>

// ─── Health check ───────────────────────────────────────────────
export const HealthSchema = z.object({
  status: z.enum(["ok", "degraded", "down"]),
  server: z.boolean(),
  database: z.boolean(),
  corpusVersion: z.string(),
  timestamp: z.string(),
  uptimeMs: z.number(),
})
export type HealthT = z.infer<typeof HealthSchema>

// ─── Input schemas (create/update) ───────────────────────────────
export const CreateCaseInputSchema = z.object({
  caseNumber: z.string().min(1),
  title: z.string().min(1),
  court: z.string().min(1),
  circuit: z.string().min(1),
  caseType: z.string().min(1),
  parties: z.string().min(1),
  subjectMatter: z.string().min(1),
  proceduralStage: ProceduralStageSchema,
  riskLevel: RiskLevelSchema,
  operatingState: OperatingStateSchema.default("NOMINAL"),
  summary: z.string().default(""),
  filedDate: z.string().nullable().optional(),
  nextHearing: z.string().nullable().optional(),
})
export type CreateCaseInput = z.infer<typeof CreateCaseInputSchema>

export const UpdateJudgeFieldInputSchema = z.object({
  content: z.string(),
  status: JudgeFieldStatusSchema.optional(),
})
export type UpdateJudgeFieldInput = z.infer<typeof UpdateJudgeFieldInputSchema>

export const CreateFactInputSchema = z.object({
  statement: z.string().min(1),
  status: FactStatusSchema,
  materiality: FactMaterialitySchema,
  party: z.string().nullable().optional(),
  sourceNote: z.string().nullable().optional(),
})
export type CreateFactInput = z.infer<typeof CreateFactInputSchema>

export const CreateEvidenceInputSchema = z.object({
  title: z.string().min(1),
  type: z.enum(["document", "digital"]).default("document"),
  evidenceType: EvidenceTypeSchema,
  origin: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  relevance: z.string().nullable().optional(),
})
export type CreateEvidenceInput = z.infer<typeof CreateEvidenceInputSchema>

export const CreateTimelineEventInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  eventDate: z.string(),
  eventType: z.string().min(1),
  legalRegime: z.string().nullable().optional(),
})
export type CreateTimelineEventInput = z.infer<typeof CreateTimelineEventInputSchema>

export const CreateIssueInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  issueType: IssueTypeSchema,
  status: z.enum(["open", "resolved", "unresolved", "blocked"]).default("open"),
  parentId: z.string().nullable().optional(),
})
export type CreateIssueInput = z.infer<typeof CreateIssueInputSchema>

export const CreateAuthorityInputSchema = z.object({
  title: z.string().min(1),
  issuingAuthority: z.string().nullable().optional(),
  judicialBody: z.string().nullable().optional(),
  court: z.string().nullable().optional(),
  chamber: z.string().nullable().optional(),
  documentType: z.string().nullable().optional(),
  legalDomain: z.string().nullable().optional(),
  jurisdiction: z.string().nullable().optional(),
  citation: z.string().nullable().optional(),
  referenceDate: z.string().nullable().optional(),
  stance: AuthorityStanceSchema,
  legalForce: LegalForceSchema,
  verificationStatus: VerificationStatusSchema.default("verified"),
  exactPassage: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  relationNote: z.string().nullable().optional(),
})
export type CreateAuthorityInput = z.infer<typeof CreateAuthorityInputSchema>

// ─── Contrary authority search result ───────────────────────────
export const ContrarySearchResultSchema = z.object({
  query: z.string(),
  found: z.number(),
  results: z.array(z.object({
    title: z.string(),
    court: z.string(),
    citation: z.string(),
    referenceDate: z.string(),
    stance: z.literal("contrary"),
    legalForce: LegalForceSchema,
    exactPassage: z.string(),
    verificationStatus: VerificationStatusSchema,
    relationNote: z.string(),
  })),
  coverage: z.object({
    sourcesSearched: z.number(),
    coveragePercent: z.number(),
    limitations: z.array(z.string()),
  }),
  nonAuthoritative: z.literal(true),
})
export type ContrarySearchResult = z.infer<typeof ContrarySearchResultSchema>
