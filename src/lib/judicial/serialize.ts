// Egyptian Judicial Brain V2.1 — Serialization helpers
// Convert Prisma entities (Date objects) to Zod-validated ISO-string shapes

import type {
  CaseT, FactT, EvidenceT, TimelineEventT, LegalIssueT, AuthorityT,
  JudgeFieldT, AIAnalysisT, IndicatorT, SettingT, CaseDetailT,
} from "./schemas"

function iso(d: Date | string | null | undefined): string | null {
  if (d == null) return null
  return typeof d === "string" ? d : d.toISOString()
}

type AnyRow = Record<string, unknown>

export function serializeCase(row: AnyRow): CaseT {
  return {
    id: String(row.id),
    caseNumber: String(row.caseNumber),
    title: String(row.title),
    court: String(row.court),
    circuit: String(row.circuit),
    caseType: String(row.caseType),
    parties: String(row.parties),
    subjectMatter: String(row.subjectMatter),
    proceduralStage: String(row.proceduralStage) as CaseT["proceduralStage"],
    riskLevel: String(row.riskLevel) as CaseT["riskLevel"],
    operatingState: String(row.operatingState) as CaseT["operatingState"],
    summary: String(row.summary ?? ""),
    filedDate: iso(row.filedDate as Date | null),
    nextHearing: iso(row.nextHearing as Date | null),
    aiSyncEnabled: Boolean(row.aiSyncEnabled),
    corpusVersion: String(row.corpusVersion),
    createdAt: iso(row.createdAt as Date)!,
    updatedAt: iso(row.updatedAt as Date)!,
  }
}

export function serializeFact(row: AnyRow): FactT {
  return {
    id: String(row.id),
    caseId: String(row.caseId),
    statement: String(row.statement),
    status: String(row.status) as FactT["status"],
    materiality: String(row.materiality) as FactT["materiality"],
    party: row.party ? String(row.party) : null,
    sourceNote: row.sourceNote ? String(row.sourceNote) : null,
    aiExtracted: Boolean(row.aiExtracted),
    createdAt: iso(row.createdAt as Date)!,
    updatedAt: iso(row.updatedAt as Date)!,
  }
}

export function serializeEvidence(row: AnyRow): EvidenceT {
  return {
    id: String(row.id),
    caseId: String(row.caseId),
    title: String(row.title),
    type: String(row.type) as EvidenceT["type"],
    evidenceType: String(row.evidenceType) as EvidenceT["evidenceType"],
    origin: row.origin ? String(row.origin) : null,
    source: row.source ? String(row.source) : null,
    date: iso(row.date as Date | null),
    integrityHash: row.integrityHash ? String(row.integrityHash) : null,
    admissibility: String(row.admissibility) as EvidenceT["admissibility"],
    judicialTreatment: String(row.judicialTreatment) as EvidenceT["judicialTreatment"],
    relevance: row.relevance ? String(row.relevance) : null,
    metadata: row.metadata ? String(row.metadata) : null,
    createdAt: iso(row.createdAt as Date)!,
    updatedAt: iso(row.updatedAt as Date)!,
  }
}

export function serializeTimeline(row: AnyRow): TimelineEventT {
  return {
    id: String(row.id),
    caseId: String(row.caseId),
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    eventDate: iso(row.eventDate as Date)!,
    eventType: String(row.eventType),
    legalRegime: row.legalRegime ? String(row.legalRegime) : null,
    createdAt: iso(row.createdAt as Date)!,
  }
}

export function serializeIssue(row: AnyRow): LegalIssueT {
  return {
    id: String(row.id),
    caseId: String(row.caseId),
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    issueType: String(row.issueType) as LegalIssueT["issueType"],
    status: String(row.status) as LegalIssueT["status"],
    parentId: row.parentId ? String(row.parentId) : null,
    sortOrder: Number(row.sortOrder ?? 0),
    createdAt: iso(row.createdAt as Date)!,
    updatedAt: iso(row.updatedAt as Date)!,
  }
}

export function serializeAuthority(row: AnyRow): AuthorityT {
  return {
    id: String(row.id),
    caseId: String(row.caseId),
    title: String(row.title),
    issuingAuthority: row.issuingAuthority ? String(row.issuingAuthority) : null,
    judicialBody: row.judicialBody ? String(row.judicialBody) : null,
    court: row.court ? String(row.court) : null,
    chamber: row.chamber ? String(row.chamber) : null,
    documentType: row.documentType ? String(row.documentType) : null,
    legalDomain: row.legalDomain ? String(row.legalDomain) : null,
    jurisdiction: row.jurisdiction ? String(row.jurisdiction) : null,
    citation: row.citation ? String(row.citation) : null,
    referenceDate: iso(row.referenceDate as Date | null),
    stance: String(row.stance) as AuthorityT["stance"],
    authorityStatus: String(row.authorityStatus) as AuthorityT["authorityStatus"],
    legalForce: String(row.legalForce) as AuthorityT["legalForce"],
    temporalStatus: String(row.temporalStatus) as AuthorityT["temporalStatus"],
    sourceTier: Number(row.sourceTier ?? 3),
    verificationStatus: String(row.verificationStatus) as AuthorityT["verificationStatus"],
    exactPassage: row.exactPassage ? String(row.exactPassage) : null,
    sourceUrl: row.sourceUrl ? String(row.sourceUrl) : null,
    relationNote: row.relationNote ? String(row.relationNote) : null,
    contrarySearched: Boolean(row.contrarySearched),
    createdAt: iso(row.createdAt as Date)!,
    updatedAt: iso(row.updatedAt as Date)!,
  }
}

export function serializeJudgeField(row: AnyRow): JudgeFieldT {
  return {
    id: String(row.id),
    caseId: String(row.caseId),
    fieldType: String(row.fieldType) as JudgeFieldT["fieldType"],
    content: String(row.content ?? ""),
    status: String(row.status) as JudgeFieldT["status"],
    updatedAt: iso(row.updatedAt as Date)!,
  }
}

export function serializeAIAnalysis(row: AnyRow): AIAnalysisT {
  return {
    id: String(row.id),
    caseId: String(row.caseId),
    analysisType: String(row.analysisType),
    title: String(row.title),
    content: String(row.content),
    responseStatus: String(row.responseStatus) as AIAnalysisT["responseStatus"],
    provenance: row.provenance ? String(row.provenance) : null,
    modelId: String(row.modelId),
    nonAuthoritative: Boolean(row.nonAuthoritative),
    createdAt: iso(row.createdAt as Date)!,
  }
}

export function serializeIndicator(row: AnyRow): IndicatorT {
  return {
    id: String(row.id),
    caseId: String(row.caseId),
    indicatorType: String(row.indicatorType) as IndicatorT["indicatorType"],
    score: Number(row.score ?? 0),
    status: String(row.status) as IndicatorT["status"],
    details: row.details ? String(row.details) : null,
    updatedAt: iso(row.updatedAt as Date)!,
  }
}

export function serializeSetting(row: AnyRow): SettingT {
  return {
    id: String(row.id),
    category: String(row.category),
    key: String(row.key),
    value: String(row.value),
    updatedAt: iso(row.updatedAt as Date)!,
  }
}

export function serializeCaseDetail(row: AnyRow): CaseDetailT {
  return {
    ...serializeCase(row),
    facts: ((row.facts as AnyRow[]) ?? []).map(serializeFact),
    evidence: ((row.evidence as AnyRow[]) ?? []).map(serializeEvidence),
    timeline: ((row.timeline as AnyRow[]) ?? []).map(serializeTimeline),
    issues: ((row.issues as AnyRow[]) ?? []).map(serializeIssue),
    authorities: ((row.authorities as AnyRow[]) ?? []).map(serializeAuthority),
    judgeFields: ((row.judgeFields as AnyRow[]) ?? []).map(serializeJudgeField),
    aiAnalyses: ((row.aiAnalyses as AnyRow[]) ?? []).map(serializeAIAnalysis),
    indicators: ((row.indicators as AnyRow[]) ?? []).map(serializeIndicator),
  }
}
