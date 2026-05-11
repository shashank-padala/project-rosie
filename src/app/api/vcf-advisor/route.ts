import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { createServerClient } from "@/lib/supabase/server"
import type { VcfStats } from "@/lib/vcf-stats"

const MODEL       = process.env.GEMMA_MODEL ?? "gemma-4-26b-a4b-it-maas"
const GCP_PROJECT = process.env.GCP_PROJECT_ID ?? ""
const GCP_REGION  = process.env.GCP_REGION ?? "global"

export interface AdvisoryNote {
  severity: "info" | "warning" | "critical"
  title: string
  detail: string
  recommendation?: string
}

const SYSTEM_PROMPT = `You are a veterinary bioinformatics advisor inspecting a VCF before a 6-hour neoantigen pipeline runs. The user is a veterinary oncologist, not a bioinformatician.

The user just uploaded a VCF. You will receive structural facts the browser parsed from it (variant count, INFO keys, sample columns, somatic flag presence, chromosomes, FILTER values). Your job is to identify 0–3 issues that would meaningfully affect neoantigen prediction quality.

Things that matter:
- Mixed germline + somatic calls (no SOMATIC flag and no obvious somatic-caller INFO keys like SS, SOMATICSTATUS, TLOD) — would inflate candidate count with non-tumor variants
- Tumor-only sample (no NORMAL column) — somatic calling is less reliable, ranking confidence drops
- All variants flagged non-PASS — pipeline will return zero candidates
- Unusually low variant count (< 10) — likely truncated or wrong-organism VCF
- Reference genome mismatch (e.g. ##reference points to GRCh38 for a canine case)
- Missing standard INFO/FORMAT keys (no AF, no DP, no AD)

Things NOT to flag:
- Anything you cannot infer from the provided stats
- Style or naming (e.g. "the sample name uses underscores")
- Speculation about clinical relevance — that's the report's job, not yours

OUTPUT FORMAT — strict JSON, nothing else, no prose, no markdown fences:

[
  {"severity":"warning","title":"…short headline…","detail":"…one sentence…","recommendation":"…optional one sentence…"}
]

Return [] if there are no issues worth flagging. Maximum 3 notes. severity must be one of: info, warning, critical.`

function safeParseNotes(raw: string): AdvisoryNote[] {
  // Strip markdown fences if Gemma added them despite the instruction
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim()
  try {
    const parsed = JSON.parse(cleaned)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((n): n is AdvisoryNote =>
        n && typeof n === "object" &&
        ["info", "warning", "critical"].includes(n.severity) &&
        typeof n.title === "string" && typeof n.detail === "string",
      )
      .slice(0, 3)
  } catch {
    return []
  }
}

export async function POST(req: NextRequest) {
  // Auth: any logged-in user. Match cases POST behavior.
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { stats?: VcfStats } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const stats = body.stats
  if (!stats || typeof stats.variantCount !== "number") {
    return NextResponse.json({ error: "stats required" }, { status: 400 })
  }

  // If we have nothing to inspect, no point burning a Gemma call.
  if (stats.variantCount === 0) {
    return NextResponse.json({
      notes: [{
        severity: "critical",
        title: "No variant rows found",
        detail: "The pipeline needs at least one somatic variant to find neoantigens. The uploaded file appears to have only headers, or could not be parsed as VCF.",
        recommendation: "Confirm the file is a valid VCF (#CHROM header followed by tab-separated variant rows).",
      }] as AdvisoryNote[],
    })
  }

  // Hard-coded check: pVACseq requires VEP annotation (CSQ INFO field).
  // Detect this deterministically rather than relying on Gemma to notice.
  if (!stats.infoKeys.includes("CSQ")) {
    return NextResponse.json({
      notes: [{
        severity: "critical",
        title: "VCF is not VEP-annotated",
        detail: "pVACseq requires Ensembl VEP annotation (CSQ INFO field) to identify candidate peptides. This VCF will fail at the Neoantigen Prediction stage.",
        recommendation: "Annotate with VEP before uploading: vep --format vcf --vcf --species canis_lupus_familiaris --cache_version 115 --plugin Wildtype --plugin Frameshift. The downloadable sample file is pre-annotated.",
      }] as AdvisoryNote[],
    })
  }

  const factsBlock = JSON.stringify({
    variantCount: stats.variantCount,
    formatColumns: stats.formatColumns,
    hasMatchedNormal: stats.hasMatchedNormal,
    hasSomaticFlag: stats.hasSomaticFlag,
    infoKeys: stats.infoKeys,
    chromosomes: stats.chromosomes,
    filterValues: stats.filterValues,
    fileFormat: stats.fileFormat,
    reference: stats.reference,
    fileSizeBytes: stats.fileSize,
  }, null, 2)

  try {
    const ai = new GoogleGenAI({ vertexai: true, project: GCP_PROJECT, location: GCP_REGION })
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: `Here are the structural facts from the uploaded VCF:\n\n${factsBlock}` }] }],
      config: { systemInstruction: SYSTEM_PROMPT },
    })
    const notes = safeParseNotes(response.text ?? "")
    return NextResponse.json({ notes })
  } catch (err) {
    console.error("[vcf-advisor] Gemma error:", err)
    // Degrade gracefully — never break the Submit flow on advisory failure.
    return NextResponse.json({ notes: [] })
  }
}
