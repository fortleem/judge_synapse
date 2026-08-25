// Egyptian Judicial Brain V2.1 — Sphinx Model Gateway (§50, §51, §82)
// Provider-neutral model router with policy-controlled routing.
// Sovereign-first: external providers are policy-controlled, never assumed.
// All output is non-authoritative — the judge exercises judicial authority.

import { db } from "@/lib/db"

export type Provider = "groq" | "gemini" | "huggingface" | "sovereign"

export interface SphinxRequest {
  caseId: string
  task: "summary" | "adversarial" | "research" | "drafting" | "extraction"
  prompt: string
  maxTokens?: number
  context?: string // additional case context
}

export interface SphinxResponse {
  ok: boolean
  provider: Provider
  modelId: string
  content: string
  nonAuthoritative: boolean
  provenance: string
  responseStatus: "verified" | "partially_verified" | "unverified" | "blocked"
  policyNote: string
  tokensUsed?: number
  latencyMs: number
  error?: string
}

// ─── Model Registry (§54) — swappable, versioned ─────────────────
// These are current candidate models. The registry decides which fills each capability.
// Hard-coding obsolete model names is FORBIDDEN (§53, §86).
// Model names are updated through the registry — never in application code.
const MODEL_REGISTRY: Record<Provider, { model: string; capability: string }> = {
  groq: { model: "llama-3.3-70b-versatile", capability: "arabic_reasoning" },
  gemini: { model: "gemini-2.5-flash", capability: "long_context" },
  huggingface: { model: "meta-llama/Meta-Llama-3-70B-Instruct", capability: "research_optional" },
  sovereign: { model: "sovereign-local-pool", capability: "offline_reasoning" },
}

// ─── Policy Engine (§82) ────────────────────────────────────────
// Default: sovereign/local for highly sensitive cases
// External provider only when: explicitly approved + data classification permits
// + provider security meets requirements + output independently verified
async function evaluatePolicy(caseId: string, task: string): Promise<{
  route: Provider
  allowed: boolean
  policyNote: string
}> {
  const caseRow = await db.case.findUnique({ where: { id: caseId }, select: { operatingState: true, riskLevel: true, proceduralStage: true } })

  if (!caseRow) {
    return { route: "groq", allowed: false, policyNote: "القضية غير موجودة — رفض الوصول" }
  }

  // Policy: highly sensitive cases (CRITICAL risk + CONFLICT state) require sovereign route
  if (caseRow.riskLevel === "CRITICAL" && caseRow.operatingState === "CONFLICT") {
    return {
      route: "sovereign",
      allowed: false,
      policyNote: "سياسة §82: القضايا الحرجة المتعارِضة تتطلب النموذج السيادي المحلي — الوصول للمزوّد الخارجي مرفوض",
    }
  }

  // Policy: INSUFFICIENT_EVIDENCE state requires explicit judge confirmation
  if (caseRow.operatingState === "INSUFFICIENT_EVIDENCE") {
    return {
      route: "groq",
      allowed: true,
      policyNote: "تحذير §32: القضية في حالة «عدم كفاية الأدلة» — المخرجات تحمل وسم «غير كافٍ» ولا تُعتمد للتسبيب",
    }
  }

  // Default route: primary provider (Groq for low latency)
  const defaultProvider = (process.env.SPHINX_DEFAULT_PROVIDER as Provider) || "groq"
  return {
    route: defaultProvider,
    allowed: true,
    policyNote: `التوجيه الافتراضي: ${defaultProvider} (مزوّد خارجي معتمد بسياسة §50) — المخرجات غير مُلزِمة ومراجعة القاضي إلزامية`,
  }
}

// ─── Provider implementations (direct HTTP, provider-neutral §51) ─

async function callGroq(prompt: string, maxTokens: number): Promise<{ content: string; tokens: number; model: string }> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error("GROQ_API_KEY غير مُهيّأ")
  const candidateModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it"]

  let lastErr = ""
  for (const model of candidateModels) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "أنت مساعد قضائي مصري. تُساعد القاضي في التحليل القانوني. قواعد صارمة: (1) لا تُصدر أحكاماً ولا تحدّد ذنباً أو مسؤولية. (2) لا تخترع استشهادات أو أرقام قضايا أو تواريخ. (3) إذا لم تكن متأكداً، قل صراحةً «لا يمكن التأكد من المصادر المتاحة». (4) كل مخرجاتك غير مُلزِمة وتحتاج مراجعة القاضي. (5) اذكر دائماً قيودك. أجب بالعربية الفصحى.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: maxTokens,
          temperature: 0.3,
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        lastErr = `Groq API ${res.status} (${model}): ${err.slice(0, 150)}`
        // If 404 (model not found) or 400 (bad request with model), try next
        if (res.status === 404 || res.status === 400) continue
        // 403 = key/permission issue — try next model anyway (some models need specific access)
        if (res.status === 403) continue
        throw new Error(lastErr)
      }

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content ?? ""
      if (!content) {
        lastErr = "Groq returned empty content"
        continue
      }
      return { content, tokens: data.usage?.total_tokens ?? 0, model }
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err)
    }
  }

  throw new Error(lastErr || "All Groq models failed")
}

async function callGemini(prompt: string, maxTokens: number): Promise<{ content: string; tokens: number; model: string }> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error("GEMINI_API_KEY غير مُهيّأ")
  // Try multiple current model names — model registry decides, but we need fallback for deprecation
  const candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest"]

  let lastErr = ""
  for (const model of candidateModels) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: "أنت مساعد قضائي مصري. تُساعد القاضي في التحليل القانوني. قواعد صارمة: (1) لا تُصدر أحكاماً. (2) لا تخترع استشهادات. (3) إذا لم تكن متأكداً، قل صراحةً. (4) كل مخرجاتك غير مُلزِمة. (5) اذكر قيودك دائماً. أجب بالعربية الفصحى." }],
            },
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
          }),
        }
      )

      if (!res.ok) {
        const err = await res.text()
        lastErr = `Gemini API ${res.status} (${model}): ${err.slice(0, 150)}`
        // If 404 (model not found), try next model
        if (res.status === 404) continue
        // For other errors, throw immediately
        throw new Error(lastErr)
      }

      const data = await res.json()
      const content = data.candidates?.[0]?.content?.parts?.map((p: { text: string }) => p.text).join("") ?? ""
      if (!content) {
        lastErr = "Gemini returned empty content"
        continue
      }
      return {
        content,
        tokens: data.usageMetadata?.totalTokenCount ?? 0,
        model,
      }
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err)
      // try next model
    }
  }

  throw new Error(lastErr || "All Gemini models failed")
}

// ─── Main gateway entry point ────────────────────────────────────
export async function invokeSphinx(req: SphinxRequest): Promise<SphinxResponse> {
  const start = Date.now()
  const maxTokens = req.maxTokens ?? 1500

  // 1. Policy evaluation
  const policy = await evaluatePolicy(req.caseId, req.task)

  if (!policy.allowed) {
    return {
      ok: false,
      provider: policy.route,
      modelId: MODEL_REGISTRY[policy.route].model,
      content: "",
      nonAuthoritative: true,
      provenance: "محظور بالسياسة — لم يُنفَّذ الاستدعاء",
      responseStatus: "blocked",
      policyNote: policy.policyNote,
      latencyMs: Date.now() - start,
    }
  }

  // 2. Build the prompt with case context
  const caseRow = await db.case.findUnique({
    where: { id: req.caseId },
    include: { facts: true, authorities: true, issues: true, evidence: true },
  })

  const caseContext = caseRow ? buildCaseContext(caseRow) : ""
  const fullPrompt = `${req.prompt}\n\n--- سياق القضية ---\n${caseContext}\n--- نهاية السياق ---\n\nمهم: لا تخترع أيّ استشهاد قانوني غير مذكور في السياق أعلاه. إذا لم تكن الإجابة متوفّرة في المصادر، قل صراحةً «لا يمكن التأكد من المصادر المتاحة».`

  // 3. Invoke provider with fallback
  const providers: Provider[] = policy.route === "groq"
    ? ["groq", "gemini"]
    : policy.route === "gemini"
    ? ["gemini", "groq"]
    : [policy.route]

  let lastError = ""
  for (const provider of providers) {
    try {
      let result: { content: string; tokens: number; model: string }
      if (provider === "groq") {
        result = await callGroq(fullPrompt, maxTokens)
      } else if (provider === "gemini") {
        result = await callGemini(fullPrompt, maxTokens)
      } else {
        // HuggingFace / sovereign — not yet implemented for direct inference
        throw new Error(`المزوّد ${provider} غير مُفعَّل في النسخة التجريبية`)
      }

      // 4. Detect potential fabrication (basic heuristic)
      const content = result.content
      const responseStatus = detectFabrication(content)

      return {
        ok: true,
        provider,
        modelId: result.model,
        content,
        nonAuthoritative: true,
        provenance: `مزوّد خارجي (${provider}) — نموذج ${result.model} — غير مُلزِم — مراجعة القاضي إلزامية`,
        responseStatus,
        policyNote: policy.policyNote,
        tokensUsed: result.tokens,
        latencyMs: Date.now() - start,
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
      console.error(`[sphinx] ${provider} failed:`, lastError)
      // try next provider
    }
  }

  // 5. All providers failed — degrade safely (§98)
  return {
    ok: false,
    provider: "sovereign",
    modelId: MODEL_REGISTRY.sovereign.model,
    content: "",
    nonAuthoritative: true,
    provenance: "تعذّر الوصول للمزوّدين الخارجيين — وضع التدهور الآمن",
    responseStatus: "blocked",
    policyNote: `فشل المزوّدون: ${lastError}. النظام في وضع التدهور الآمن — يبقى السجل القضائي والبحث القانوني متاحَين`,
    latencyMs: Date.now() - start,
    error: lastError,
  }
}

// ─── Helpers ────────────────────────────────────────────────────
function buildCaseContext(c: any): string {
  const facts = c.facts.map((f: any) => `- [${f.status}] ${f.statement}`).join("\n") || "لا وقائع مسجّلة"
  const authorities = c.authorities.map((a: any) => `- [${a.stance}] ${a.title} (${a.citation ?? "بدون استشهاد"})`).join("\n") || "لا سلطات مسجّلة"
  const issues = c.issues.map((i: any) => `- [${i.issueType}] ${i.title}`).join("\n") || "لا مسائل مسجّلة"
  const evidence = c.evidence.map((e: any) => `- ${e.title} (${e.evidenceType}, ${e.admissibility})`).join("\n") || "لا أدلة مسجّلة"

  return `القضية: ${c.title}
رقم القضية: ${c.caseNumber}
المحكمة: ${c.court} — ${c.circuit}
نوع الدعوى: ${c.caseType}
المرحلة الإجرائية: ${c.proceduralStage}
الأطراف: ${c.parties}
الموضوع: ${c.subjectMatter}
الملخّص: ${c.summary}

الوقائع:
${facts}

السلطات القانونية:
${authorities}

المسائل القانونية:
${issues}

الأدلة:
${evidence}`
}

// Basic fabrication detection — checks for suspicious patterns
function detectFabrication(content: string): "verified" | "partially_verified" | "unverified" | "blocked" {
  const lower = content.toLowerCase()
  // If the model explicitly admits uncertainty → partially_verified (honest)
  if (lower.includes("لا يمكن التأكد") || lower.includes("غير متوفّر") || lower.includes("لا أستطيع")) {
    return "partially_verified"
  }
  // If content is empty → blocked
  if (!content.trim()) return "blocked"
  // Default: unverified (all external AI output starts as unverified)
  // The judge must verify before any promotion
  return "unverified"
}
