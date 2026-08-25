// Egyptian Judicial Brain V2.1 — Serialization helpers
// Convert Prisma entities (Date objects) to Zod-validated ISO-string shapes

import type {
  CaseT, FactT, EvidenceT, TimelineEventT, LegalIssueT, AuthorityT,
  JudgeFieldT, AIAnalysisT, IndicatorT, SettingT, CaseDetailT,
  LegalSourceT, LegalTextT, CorpusSnapshotT, ImportJobT,
  ConflictT, AdversaryReviewT, JudgeNoteT, AuditLogT, CitationVerificationT,
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

// ─── Legal Corpus ──────────────────────────────────────────────────
export function serializeLegalSource(row: AnyRow): LegalSourceT {
  return {
    id: String(row.id),
    name: String(row.name),
    nameEn: row.nameEn ? String(row.nameEn) : null,
    portalUrl: row.portalUrl ? String(row.portalUrl) : null,
    sourceType: String(row.sourceType),
    issuingBody: String(row.issuingBody),
    jurisdiction: row.jurisdiction ? String(row.jurisdiction) : null,
    accessStatus: String(row.accessStatus),
    sourceTier: Number(row.sourceTier ?? 3),
    contentAvailable: row.contentAvailable ? String(row.contentAvailable) : null,
    accessNotes: row.accessNotes ? String(row.accessNotes) : null,
    lastChecked: iso(row.lastChecked as Date | null),
    verified: Boolean(row.verified),
    createdAt: iso(row.createdAt as Date)!,
    updatedAt: iso(row.updatedAt as Date)!,
  }
}

export function serializeLegalText(row: AnyRow): LegalTextT {
  return {
    id: String(row.id),
    sourceId: String(row.sourceId),
    title: String(row.title),
    citation: String(row.citation),
    documentType: String(row.documentType),
    legalDomain: row.legalDomain ? String(row.legalDomain) : null,
    legalForce: String(row.legalForce),
    effectiveFrom: iso(row.effectiveFrom as Date)!,
    effectiveTo: iso(row.effectiveTo as Date | null),
    versionLabel: String(row.versionLabel),
    sourceHash: String(row.sourceHash),
    retrievalTimestamp: iso(row.retrievalTimestamp as Date)!,
    publicationDate: iso(row.publicationDate as Date | null),
    officialJournalRef: row.officialJournalRef ? String(row.officialJournalRef) : null,
    verificationStatus: String(row.verificationStatus),
    temporalStatus: String(row.temporalStatus),
    exactText: String(row.exactText),
    sourceUrl: row.sourceUrl ? String(row.sourceUrl) : null,
    notes: row.notes ? String(row.notes) : null,
    createdAt: iso(row.createdAt as Date)!,
    updatedAt: iso(row.updatedAt as Date)!,
  }
}

export function serializeCorpusSnapshot(row: AnyRow): CorpusSnapshotT {
  return {
    id: String(row.id),
    versionLabel: String(row.versionLabel),
    createdAt: iso(row.createdAt as Date)!,
    sourceManifest: String(row.sourceManifest),
    hash: String(row.hash),
    signature: row.signature ? String(row.signature) : null,
    approvalStatus: String(row.approvalStatus),
    effectiveFrom: iso(row.effectiveFrom as Date)!,
    effectiveTo: iso(row.effectiveTo as Date | null),
    textCount: Number(row.textCount ?? 0),
    sourceCount: Number(row.sourceCount ?? 0),
    notes: row.notes ? String(row.notes) : null,
  }
}

export function serializeImportJob(row: AnyRow): ImportJobT {
  return {
    id: String(row.id),
    sourceName: String(row.sourceName),
    sourceUrl: row.sourceUrl ? String(row.sourceUrl) : null,
    sourceType: String(row.sourceType),
    status: String(row.status),
    priority: Number(row.priority ?? 5),
    requiresAuth: Boolean(row.requiresAuth),
    authType: row.authType ? String(row.authType) : null,
    lastAttempt: iso(row.lastAttempt as Date | null),
    contentScope: row.contentScope ? String(row.contentScope) : null,
    notes: row.notes ? String(row.notes) : null,
    createdAt: iso(row.createdAt as Date)!,
    updatedAt: iso(row.updatedAt as Date)!,
  }
}

// ─── Conflict / Adversary / Notes / Audit / Citation ──────────────
export function serializeConflict(row: AnyRow): ConflictT {
  return {
    id: String(row.id),
    caseId: String(row.caseId),
    conflictType: String(row.conflictType),
    status: String(row.status),
    authorityAId: row.authorityAId ? String(row.authorityAId) : null,
    authorityBId: row.authorityBId ? String(row.authorityBId) : null,
    description: String(row.description),
    significance: row.significance ? String(row.significance) : null,
    explanation: row.explanation ? String(row.explanation) : null,
    judgeReview: String(row.judgeReview),
    createdAt: iso(row.createdAt as Date)!,
  }
}

export function serializeAdversaryReview(row: AnyRow): AdversaryReviewT {
  return {
    id: String(row.id),
    caseId: String(row.caseId),
    targetType: String(row.targetType),
    targetId: row.targetId ? String(row.targetId) : null,
    proposition: String(row.proposition),
    factsAngle: String(row.factsAngle),
    textAngle: String(row.textAngle),
    defenseAngle: String(row.defenseAngle),
    proceduralAngle: String(row.proceduralAngle),
    vulnerabilities: row.vulnerabilities ? String(row.vulnerabilities) : null,
    transferStatus: String(row.transferStatus),
    transferredAt: iso(row.transferredAt as Date | null),
    judgeNote: row.judgeNote ? String(row.judgeNote) : null,
    createdAt: iso(row.createdAt as Date)!,
  }
}

export function serializeJudgeNote(row: AnyRow): JudgeNoteT {
  return {
    id: String(row.id),
    caseId: String(row.caseId),
    itemType: String(row.itemType),
    itemId: row.itemId ? String(row.itemId) : null,
    content: String(row.content),
    pinned: Boolean(row.pinned),
    createdAt: iso(row.createdAt as Date)!,
    updatedAt: iso(row.updatedAt as Date)!,
  }
}

export function serializeAuditLog(row: AnyRow): AuditLogT {
  return {
    id: String(row.id),
    caseId: row.caseId ? String(row.caseId) : null,
    actor: String(row.actor),
    action: String(row.action),
    entityType: String(row.entityType),
    entityId: row.entityId ? String(row.entityId) : null,
    source: String(row.source),
    details: row.details ? String(row.details) : null,
    timestamp: iso(row.timestamp as Date)!,
  }
}

export function serializeCitationVerification(row: AnyRow): CitationVerificationT {
  return {
    id: String(row.id),
    caseId: row.caseId ? String(row.caseId) : null,
    citation: String(row.citation),
    claimedSource: row.claimedSource ? String(row.claimedSource) : null,
    verificationStatus: String(row.verificationStatus),
    canonicalMatch: row.canonicalMatch ? String(row.canonicalMatch) : null,
    sourceHash: row.sourceHash ? String(row.sourceHash) : null,
    legalTextId: row.legalTextId ? String(row.legalTextId) : null,
    verifiedAt: iso(row.verifiedAt as Date)!,
    notes: row.notes ? String(row.notes) : null,
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
    conflicts: ((row.conflicts as AnyRow[]) ?? []).map(serializeConflict),
    adversaryReviews: ((row.adversaryReviews as AnyRow[]) ?? []).map(serializeAdversaryReview),
    notes: ((row.notes as AnyRow[]) ?? []).map(serializeJudgeNote),
    auditLogs: ((row.auditLogs as AnyRow[]) ?? []).map(serializeAuditLog),
    citationVerifications: ((row.citationVerifications as AnyRow[]) ?? []).map(serializeCitationVerification),
  }
}
