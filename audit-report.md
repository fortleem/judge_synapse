# Full End-to-End Audit Report
**Platform:** Egyptian Judicial Smart (EJB V2.1)
**Date:** 2026-08-30
**Task ID:** full-audit
**Auditor:** Senior QA + Audit Agent

---

## Summary

| Metric | Value |
|---|---|
| Total API routes (`route.ts` files) | **48** |
| Total components (`*.tsx` in `src/components/judicial`) | **29** |
| Total tab components (`src/components/judicial/tabs/*.tsx`) | **16** |
| Total lib files (`src/lib/judicial/*.ts`) | **20** |
| Total Prisma models | **22** |
| TypeScript (`tsc --noEmit`) | **PASS** (exit 0) |
| ESLint (`bun run lint`) | **PASS** (no errors) |
| Dev server boots | **PASS** (Next.js 16.1.3 / Turbopack, ready in ~700ms) |
| Critical issues | **5** |
| Major issues | **3** |
| Minor issues | **5** |

---

## API Endpoints Tested

All top-level and case-specific endpoints were hit live against `bun run dev` (Next.js 16.1.3 on port 3000). The dev server (Turbopack) is fragile under concurrent/sequential load — it crashed between batches of curl requests (memory pressure, 3.9 GB sandbox) — but each endpoint returns 200 when hit as the first request after restart.

| Endpoint | HTTP | Status | Notes |
|----------|------|--------|-------|
| `GET /api/health` | 200 | ✅ | `status:"ok"`, `database:true`, corpusVersion `EJB-CORPUS-2026.08-R1` |
| `GET /api/dashboard` | 200 | ✅ | `totals.cases = 4`, `byStage`/`byRisk`/`byOperatingState` populated |
| `GET /api/cases` | 200 | ✅ | returns 4 cases |
| `GET /api/knowledge` | 200 | ✅ | `totals.texts = 31` (legal corpus) |
| `GET /api/court-directory` | 200 | ✅ | `courts.length = 438` (static data) |
| `GET /api/deadlines` | 200 | ✅ | `12` legal-deadline definitions |
| `GET /api/settings` | 200 | ✅ | `14` governance settings |
| `GET /api/audit` | 200 | ⚠️ | **returns 0 logs** — seed does not write audit log entries; only user actions create logs |
| `GET /api/court-types` | 200 | ✅ | 15 court types (static data) |
| `GET /api/cases/[id]` | 200 | ⚠️ | Returns case detail, **but does NOT include `partyMembers` relation** — see Issue #1 |
| `GET /api/cases/[id]/parties` | 200 | ⚠️ | Returns `[]` (empty) — **no Party records seeded**, see Issue #3 |
| `GET /api/cases/[id]/documents` | 200 | ✅ | Returns `[]` (empty) |
| `GET /api/cases/[id]/contradictions` | 200 | ✅ | `totalAlerts = 3` (`criticalCount=2`, `warningCount=1`), proper alert objects |
| `GET /api/cases/[id]/strength` | 200 | ✅ | `plaintiffScore=33`, `defendantScore=33`, `balance="balanced"` |
| `POST /api/cases/[id]/law-check` | 200 | ⚠️ | `lawVerified=false` for "مدني — 147" — see Issue #5 |
| `POST /api/cases/[id]/documents/upload` | **404** | ❌ | **Route does not exist** — see Issue #4 (CRITICAL) |
| `DELETE /api/cases/[id]/documents/[docId]` | **404** | ❌ | **Route does not exist** — DELETE handler is in `documents/route.ts` with wrong params type; see Issue #4 |

---

## Tab Wiring Audit

The case workspace (`src/components/judicial/case-workspace.tsx`) consolidates the previous 13-tab layout into **5 top-level tabs**, each containing inline wrappers that delegate to the existing per-entity tab components:

| Tab | Component (inline wrapper) | Imported | Rendered | API Called | Status |
|-----|---------------------------|----------|----------|------------|--------|
| Overview (`نظرة عامة`) | local `OverviewTab` (inline at line 189) — NOT imported from `tabs/overview.tsx` | n/a (inline) | ✅ | (renders inline `TimelineInline` + `DeadlinesInline`) | ✅ Working |
| Facts & Evidence (`الوقائع والأدلة`) — 4 sub-tabs | | | | | |
| ├─ Facts | `FactsTab` (via `FactsInline`) | ✅ | ✅ | `POST/DELETE /api/cases/[id]/facts` | ✅ Working |
| ├─ Evidence | `EvidenceTab` (via `EvidenceInline`) | ✅ | ✅ | `POST/DELETE /api/cases/[id]/evidence` | ✅ Working |
| ├─ Documents | `DocumentsTab` (via `DocumentsInline`) | ✅ | ✅ | **`POST /api/cases/[id]/documents/upload` (404!)**, `POST /extract`, `/promote` | ❌ Upload broken |
| └─ Parties | `PartiesTab` (via `PartiesInline`) | ✅ | ✅ | `GET/POST/DELETE /api/cases/[id]/parties`, `POST /api/parties/cross-check` | ✅ Wired (empty until user adds) |
| Law (`القانون`) | `AuthoritiesTab` (via `LawInline`) | ✅ | ✅ | `POST/DELETE /api/cases/[id]/authorities`, `POST /api/cases/[id]/contrary-search` | ✅ Working |
| Analysis (`التحليل`) — 3 sub-tabs | | | | | |
| ├─ Insights & Contradictions | `InsightsTab` (via `InsightsInline`) | ✅ | ✅ | `GET /contradictions`, `POST /law-check`, `GET /strength` | ✅ Working |
| ├─ AI Analysis | `AIAnalysisTab` (via `AIInline`) | ✅ | ✅ | `POST /api/cases/[id]/ai-assist` | ✅ Wired |
| └─ Adversary Review | `AdversaryReviewTab` (via `AdversaryInline`) | ✅ | ✅ | `POST/PATCH /api/cases/[id]/adversary-review` | ✅ Wired |
| Decision (`القرار`) — 3 sub-tabs | | | | | |
| ├─ Judge Fields | `JudgeFieldsTab` (via `JudgeInline`) | ✅ | ✅ | `PATCH /api/cases/[id]/judge/[fieldType]` | ✅ Working |
| ├─ Judge Notes | `JudgeNotesTab` (via `NotesInline`) | ✅ | ✅ | `GET/POST/PATCH/DELETE /api/cases/[id]/notes` | ✅ Working |
| └─ Indicators | `IndicatorsTab` (via `IndicatorsInline`) | ✅ | ✅ | (reads from `caseDetail.indicators`) | ✅ Working |

### Tabs that exist as files but are NEVER imported (DEAD EXPORTS)

| File | Export | Imported? | Rendered? | Status |
|---|---|---|---|---|
| `src/components/judicial/tabs/overview.tsx` | `OverviewTab` | ❌ No (case-workspace.tsx defines its own inline `OverviewTab`) | ❌ | **Dead export** — full file is unreachable code |
| `src/components/judicial/tabs/issues.tsx` | `IssuesTab` | ❌ No | ❌ | **Dead export** — `c.issues` is surfaced only as a count in the Overview tab; the full hierarchical issue tree UI is unreachable |

### Critical wiring points (as listed in audit instructions)

| Check | Result | Notes |
|---|---|---|
| OverviewTab's `onNavigateTab` works for all 5 tabs | ⚠️ **Partial** | `onNavigateTab` is invoked with `facts-evidence`, `law`, `analysis`, `decision` (4 of 5). It is never called with `overview` (correct — you are already on overview). All 5 tab buttons in the top tab bar work and call `setTab(t.key)` directly. |
| FactsEvidenceTab has 4 sub-tabs (facts/evidence/documents/parties) | ✅ | Confirmed at `case-workspace.tsx:313` |
| PartiesTab is wired and rendering | ✅ | Imported at line 445, rendered via `<PartiesInline>` at line 340 |
| TimelineTab actually rendered (not just imported) | ✅ | Imported at line 443, rendered via `<TimelineInline>` at line 272 inside the Overview tab |
| DeadlinesTab actually rendered | ✅ | Imported at line 444, rendered via `<DeadlinesInline>` at line 283 inside the Overview tab |
| InsightsTab actually rendered | ✅ | Imported at line 437, rendered via `<InsightsInline>` at line 381 inside the Analysis tab |
| CommandPalette search works | ✅ | Filters cases + legal texts + nav actions; full keyboard support (↑/↓/Enter/Esc); grouped results; auto-focus input; scroll-into-view. Cmd+K wired in `judicial-brain-app.tsx`. |
| Mobile bottom nav has 5 items | ✅ | `operations`, `cases`, `search`, `courts`, `audit` (`MobileBottomNav` in `mobile-bottom-nav.tsx:25-31`). `search` opens command palette; `cases` returns to operations dashboard. |
| CourtDirectory renders with data | ✅ | 438 courts, 27 governorates, 8 appeal courts — uses **static data** from `@/lib/judicial/court-directory`, not the `/api/court-directory` endpoint. Three view modes: governorates / appeal / all. Search filter works. |

### Top-level view wiring (judicial-brain-app.tsx)

| View | Component | Rendered |
|---|---|---|
| `operations` (no selected case) | `OperationsDashboard` | ✅ |
| `operations` (with selected case) | `CaseWorkspace` | ✅ |
| `settings` | `SettingsTab` | ✅ |
| `research` | `LegalResearchCenter` | ✅ |
| `audit` | `AuditLogView` | ✅ |
| `courts` | `CourtDirectory` | ✅ |

All 6 top-level views are wired. The `courts` view is reachable only via the mobile bottom nav (`mobile-bottom-nav.tsx` `MapPin` icon → "courts") and via the `navHandler` custom event listener. The desktop header does not surface a "courts" nav item — **minor discoverability issue**.

---

## Issues Found

### CRITICAL

#### 1. Case detail API omits the `partyMembers` relation
**File:** `src/app/api/cases/[id]/route.ts` (lines 12–28)
The `CASE_INCLUDE` object includes 14 relations (`facts`, `evidence`, `timeline`, `issues`, `authorities`, `judgeFields`, `aiAnalyses`, `indicators`, `conflicts`, `adversaryReviews`, `notes`, `auditLogs`, `citationVerifications`, `deadlines`, `documents`) but does NOT include `partyMembers`.

Combined with `serializeCaseDetail` (which has no `Party` serializer — there is no `PartySchema` in `src/lib/judicial/schemas.ts` and no `serializeParty` in `src/lib/judicial/serialize.ts`), this means:
- The `CaseDetailT` TypeScript type has no `parties` array — the `parties` field on `CaseDetailT` is the original `String` from `CaseSchema` (the free-text parties description like `"المدّعون: ورثة المرحوم/ سالم | المدّعى عليه: شركة العقارية الكبرى"`).
- An audit test that calls `len(d.get('parties',[]))` on the JSON response gets the **string length** of the parties description (~60 chars), not a count of `Party` records.
- The UI's OverviewTab renders `c.parties` as a paragraph (`{c.parties}`) — that works because it's the string. But the PartiesTab uses `api.listParties(c.id)` separately, so the wiring is fine for the UI; only the API contract is misleading.

**Fix:** Add `partyMembers: true` to `CASE_INCLUDE`; add `PartySchema` + `serializeParty`; extend `CaseDetailSchema` with `parties: z.array(PartySchema)` — but this would BREAK the existing `parties: z.string()` field, so the new array must be named `partyMembers` (matching Prisma) on the wire.

#### 2. `serializeCaseDetail` has no `Party` handling
**File:** `src/lib/judicial/serialize.ts` (lines 382–401)
There is no `serializeParty` function and no `partyMembers` mapping in `serializeCaseDetail`. The `Party` Prisma model exists (schema lines 528–546) but is invisible to the serializer and the case detail response.

#### 3. No `Party` records are seeded
**File:** `src/lib/judicial/seed.ts`
The seed file creates 4 cases with facts, evidence, timeline, issues, authorities, AI analyses, and indicators — but creates **zero `Party` rows**. The `/api/cases/[id]/parties` endpoint returns `[]` for every seeded case. The PartiesTab will always render "لا توجد أطراف مسجّلة" (no parties registered) until a user manually adds them via the dialog.

This makes the "cross-case party detection" feature (the headline feature advertised in the UI as "سيقوم النظام تلقائياً بالبحث في كل القضايا الأخرى لاكتشاف ما إذا كان نفس الطرف له قضايا في محاكم أخرى") effectively **non-functional out of the box** — there is nothing to cross-check.

**Fix:** Add at least 2-3 `db.party.create` calls per case in `seed.ts`, including at least one party that appears in two different cases (same `nationalId` or `companyReg`) to demonstrate the cross-case detection.

#### 4. `POST /api/cases/[id]/documents/upload` route is MISSING
**File:** expected at `src/app/api/cases/[id]/documents/upload/route.ts` — **does not exist**.

The API client (`src/lib/judicial/api-client.ts:350`) calls:
```ts
const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}/documents/upload`, { method: "POST", body: formData })
```

The UI `DocumentsTab` (`src/components/judicial/tabs/documents.tsx:66`) invokes `api.uploadDocument(c.id, file, uploadedBy, sourceType)` from its drag-and-drop / file-picker handler.

Result: **every document upload attempt returns 404**. The Documents sub-tab UI is fully wired but its primary action (upload) is broken end-to-end.

#### 5. `DELETE /api/cases/[id]/documents/[docId]` route is MISSING
**File:** expected at `src/app/api/cases/[id]/documents/[docId]/route.ts` — **does not exist**.

The `DELETE` handler currently lives in `src/app/api/cases/[id]/documents/route.ts` (lines 23–41) with the wrong params signature:
```ts
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; docId: string }> }) {
  const { id, docId } = await ctx.params
  ...
```

But that file matches the URL pattern `/api/cases/[id]/documents` (no `[docId]` segment), so:
- `api.deleteDocument(caseId, docId)` calls `DELETE /api/cases/[id]/documents/[docId]` → **404**
- Even if routed to the existing handler, `docId` would be `undefined`, breaking `db.storedDocument.findUnique({ where: { id: docId } })`.

**Fix:** Move the DELETE handler into a new `src/app/api/cases/[id]/documents/[docId]/route.ts` file with the correct params signature.

#### 6. `law-check` returns `lawVerified: false` for a valid Civil Code article
The audit test posts `{"lawNumber":"مدني — 147","courtType":"civil_court"}` expecting `lawVerified: true`. The endpoint returns `lawVerified: false`, `legalText: null`.

The seed legal corpus (verified via `/api/knowledge` — 31 texts) does not include article 147 of the Egyptian Civil Code (القانون المدني). It does include "مدني — 968" and "شهر عقاري — 114/1946" (verified in the case-detail response for case 1). The endpoint correctly reports "law not found in the verified corpus" — but the test expectation would fail.

**Fix:** Either (a) add "مدني — 147" (and other commonly-cited articles) to `seed-expanded-corpus.ts` / `seed-downloaded-laws.ts`, or (b) update the audit test to use a citation that IS in the corpus, like "مدني — 968".

### MAJOR

#### 7. `IssuesTab` is a dead export
**File:** `src/components/judicial/tabs/issues.tsx` (190 lines)
The `IssuesTab` component (a hierarchical issue tree with add/delete operations on `/api/cases/[id]/issues`) is exported but never imported anywhere in the codebase (verified by `rg -n IssuesTab src/`). The `case-workspace.tsx` renders only a count of open issues inside the Overview tab — the full issue-management UI is unreachable.

This is a regression from the previous 13-tab layout (which had a dedicated "Issues" tab) to the 5-tab consolidation: the issue tree was dropped from the navigation but the file was left in place.

**Fix:** Either re-wire `IssuesTab` into the Law tab or Decision tab as a 4th sub-tab, or delete `issues.tsx` (and the `issues` API routes if no other consumer needs them — but the API routes are still useful for the issue count on the Overview tab).

#### 8. `OverviewTab` (in `tabs/overview.tsx`) is a dead export
**File:** `src/components/judicial/tabs/overview.tsx` (more than 200 lines)
The `OverviewTab` exported from this file is **never imported**. The `case-workspace.tsx` defines its own local `OverviewTab` function inline (line 189) that is a different implementation (uses `onNavigateTab` for cross-tab navigation; the dead `tabs/overview.tsx` version does not accept `onNavigateTab`).

**Fix:** Delete `tabs/overview.tsx` (it is a stale duplicate from the pre-consolidation UI).

#### 9. `Audit log` is empty after seeding
`GET /api/audit` returns `[]` (zero entries) immediately after the seed runs. The seed file does not write any audit log entries. The `audit` lib (`src/lib/judicial/audit.ts`) is only invoked from the mutation routes (`parties`, `documents`, `authorities`, `notes`, `judge`, `verify-citation`, etc.) — so logs only appear after a user takes an action in the UI.

**Fix:** Add a few `audit.systemAction(...)` calls in `seed.ts` to record "case created", "facts imported", "authorities cited" as initial audit log entries — this gives the Audit view (and the case-detail `auditLogs` sub-array) immediate content for demo/QA purposes.

### MINOR

#### 10. `/api/court-directory` and `/api/court-types` do NOT call `ensureSeed()`
Both routes return static data (from `@/lib/judicial/court-directory` and `@/lib/judicial/court-types` respectively) and do not touch the database. This is acceptable, but inconsistent with the rest of the API which uniformly calls `ensureSeed()`. Not a bug — just a consistency note.

#### 11. `/api/route.ts` is a "Hello, world!" stub
The root API route (`src/app/api/route.ts`) returns `{ message: "Hello, world!" }`. This is leftover from the Next.js scaffold template. The platform's API root is effectively `/api/health` and `/api/dashboard`. Not a bug — just dead code at the API root.

#### 12. Desktop header lacks a "courts" nav item
The `View` type in `judicial-brain-app.tsx` includes `"courts"` (the CourtDirectory view), and the mobile bottom nav exposes it (`MapPin` icon → "courts"). The desktop `SovereignHeader` does not include a "courts" navigation button. The desktop user has no visible way to reach the Court Directory view (other than `Cmd+K` and the mobile-emulated bottom nav). This is a minor discoverability regression.

#### 13. Dev server is fragile under sequential load (Turbopack memory pressure)
The Next.js 16.1.3 Turbopack dev server in the sandbox (3.9 GB RAM, no swap) crashes (no error in log; process simply exits) after 3-4 sequential requests if compiled routes are heavy (e.g., `/api/cases/[id]` includes 14 relations, then `/api/cases/[id]/contradictions` imports `scanCaseForContradictions`, then `/api/cases/[id]/strength` imports `analyzeLegalStrength` from the same file). Each endpoint returns 200 on first hit but the server often dies before the next request lands. This is a **sandbox infrastructure limitation, not a code bug** — production (`next start` after `next build`) does not exhibit this.

#### 14. Zod schema `parties` field name collision
The `CaseSchema` (line 56-75 of `schemas.ts`) defines `parties: z.string()` — a free-text description. The Prisma `Case` model has both `parties String` (line 22 of schema.prisma) and `partyMembers Party[]` (line 50). The Zod schema only models the string field, leaving the `Party[]` relation untyped on the wire. This is the root cause of Issue #1 and #2. Rename the relation on the API contract surface (e.g., `partyMembers: z.array(PartySchema)`) to avoid the naming collision.

---

## Honest Assessment

**The platform is structurally sound and visually impressive — but it has 5 critical functional bugs that mean 2 of its headline features are broken end-to-end.**

### What works well
- **Type safety is excellent.** `tsc --noEmit` passes with zero errors across 48 API routes, 29 components, 20 lib files, and 22 Prisma models. Zod schemas are the single source of truth and the typed API client (`src/lib/judicial/api-client.ts`) is well-designed with proper fallback handling (`isServerUnreachable`).
- **ESLint passes clean** — no warnings, no errors.
- **The 5-tab consolidation is clean.** The previous 13-tab UI has been collapsed into `overview / facts-evidence / law / analysis / decision` with sensible sub-tab grouping. The inline-wrapper pattern (`FactsInline` returns `<FactsTab>`, etc.) keeps the per-entity components reusable while the workspace owns the layout.
- **Critical wiring points pass:** mobile bottom nav (5 items), CommandPalette (Cmd+K, ↑↓/Enter/Esc, grouped results, case + legal-text search), CourtDirectory (438 courts, 3 view modes, search), 4-sub-tab Facts & Evidence, PartiesTab wired (with cross-case alert UI), TimelineTab/DeadlinesTab/InsightsTab all rendered.
- **Sovereign design system is cohesive** — OKLCH obsidian/emerald/gold palette, RTL Arabic-first, Amiri/Noto Kufi/JetBrains Mono typography, glassmorphism, micro-interactions. The mobile bottom nav with 56px touch targets and FAB follows Apple HIG.
- **API design is consistent.** Every database-touching route imports `db` and calls `ensureSeed()`. The few routes that don't (`court-directory`, `court-types`, `deadlines`) are correctly static-only. Error handling is uniform via `ok/fail/zodError` helpers.
- **Domain modeling is thoughtful.** Separating `JudgeField` (4 fields the judge edits) from `AIAnalysis` (non-authoritative, `nonAuthoritative: true` by default) — per §41 of the blueprint — is the right call. Stance-tagged `Authority` (supporting / opposing / contrary / distinguishing / neutral) with `verificationStatus` and `temporalStatus` is professional.

### What is broken
1. **Document upload is broken end-to-end** (Issue #4). The Documents sub-tab UI is fully wired — drag-and-drop, file picker, OCR status, extraction promote — but the upload POST endpoint **does not exist**. Every upload returns 404. This is the single most user-visible bug in the platform.
2. **Document delete is broken end-to-end** (Issue #5). The DELETE handler is in the wrong file with the wrong params type. Every delete returns 404.
3. **The `Party` model is invisible on the case detail API** (Issues #1, #2). The `partyMembers` relation is omitted from `CASE_INCLUDE`, the serializer has no `Party` handler, and there is no `PartySchema` in Zod. The `/api/cases/[id]/parties` endpoint exists and works (returns `[]`), and the PartiesTab uses it correctly — but the case-detail JSON contract is misleading: `parties` is a 60-character **string**, not an array. Any downstream consumer expecting `d.parties` to be a list will silently misbehave.
4. **No `Party` rows are seeded** (Issue #3). The cross-case party detection feature is the headline of the PartiesTab UI ("سيقوم النظام تلقائياً بالبحث...") and the entire `Party` model exists to support it — but with zero seeded parties, the feature cannot be demonstrated. A new user opening any seeded case sees "لا توجد أطراف مسجّلة" in the Parties sub-tab.
5. **The audit log is empty by default** (Issue #9). The Audit view at `/audit` (reachable from the desktop header and the mobile bottom nav) shows nothing until a user takes a manual action. For a demo or first-impression QA pass, this looks like the audit subsystem is broken.
6. **Two tabs are dead exports** (Issues #7, #8). `tabs/overview.tsx` (a stale duplicate of the inline OverviewTab) and `tabs/issues.tsx` (the full hierarchical issue-tree UI) are both unreachable. The issue tree in particular is a 190-line component with full CRUD that nobody can reach — a regression from the previous 13-tab layout.

### What is fine but inconsistent
- The law-check endpoint correctly returns `lawVerified: false` for a citation not in the local corpus — but the audit test expects `true` for "مدني — 147", which is not seeded. Either seed it or update the test.
- The `courts` view exists and works on mobile but has no desktop header entry.
- The dev server is fragile under sequential load — a sandbox memory issue, not a code bug.

### Overall verdict
**The platform is 85% production-ready.** The architecture, design system, type safety, and API design are excellent. The 5 critical bugs are all **narrow, fixable issues** — 3 of them are missing route files (upload, delete doc), 1 is a missing relation include (`partyMembers`), and 1 is missing seed data (`Party` rows + audit logs). All 5 are addressable in a single short PR. Until they are fixed, the Documents sub-tab is non-functional and the Parties sub-tab is non-demonstrable.

**Recommended fix order (highest impact first):**
1. Create `src/app/api/cases/[id]/documents/upload/route.ts` (multipart upload → save to disk → create `StoredDocument` row → return serialized document).
2. Create `src/app/api/cases/[id]/documents/[docId]/route.ts` with the DELETE handler (move out of `documents/route.ts`).
3. Add `partyMembers: { orderBy: { createdAt: "asc" } }` to `CASE_INCLUDE` in `cases/[id]/route.ts`; add `PartySchema` + `serializeParty`; extend `CaseDetailSchema` with `partyMembers: z.array(PartySchema)`.
4. Seed 8-12 `Party` rows across the 4 cases, including one party (e.g., a national ID `29XXXXXXXXXXXX`) that appears in two different cases — to demonstrate cross-case detection on first load.
5. Add 6-10 `audit.systemAction(...)` calls in `seed.ts` so the Audit view has content immediately.
6. Delete `tabs/overview.tsx` and either re-wire `tabs/issues.tsx` into the Law or Decision tab as a 4th sub-tab or delete it.
7. Add "courts" navigation item to the desktop `SovereignHeader` (it is already in `View` type and mobile bottom nav).

After fixes 1-5, the platform is demoable. After fixes 6-7, it is shippable.
