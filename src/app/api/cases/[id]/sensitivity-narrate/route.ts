import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { createServerClient } from "@/lib/supabase/server"
import type { Candidate } from "@/types/case"

const MODEL       = process.env.GEMMA_MODEL ?? "gemma-4-26b-a4b-it-maas"
const GCP_PROJECT = process.env.GCP_PROJECT_ID ?? ""
const GCP_REGION  = process.env.GCP_REGION ?? "global"

const SYSTEM_PROMPT = `You are a veterinary oncology AI assistant explaining a "what-if" sensitivity analysis on neoantigen ranking.

The user has adjusted IC50 and tumor VAF thresholds and you will receive:
- The new thresholds and the pipeline defaults
- The candidates that survive the new thresholds (kept)
- The candidates that pass at defaults but fail at the new thresholds (dropped)

Write a concise 1–2 sentence narrative for a veterinary oncologist explaining the practical impact. Be concrete — name specific peptides and source genes when only a few are affected. State the tradeoff plainly (e.g. "tighter binding requirement, but only one candidate survives — your construct loses TP53 coverage"). Don't hedge with "consult your bioinformatician" — just give the read.

Plain prose only. No markdown, no headers, no bullet points. Maximum two sentences.`

interface NarrateBody {
  thresholds: { ic50_max: number; vaf_min: number }
  defaults: { ic50_max: number; vaf_min: number }
  kept: Candidate[]
  dropped: Candidate[]
}

function summarizeCandidates(cs: Candidate[], max = 8): string {
  if (cs.length === 0) return "(none)"
  return cs.slice(0, max)
    .map((c) => `${c.peptide} (${c.gene}, IC50=${c.ic50_nm.toFixed(1)}nM, VAF=${c.tumor_vaf.toFixed(2)})`)
    .join("; ") + (cs.length > max ? `; +${cs.length - max} more` : "")
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Allow unauthenticated access to demo cases (user_id IS NULL) — same pattern as chat route
  const query = user
    ? supabase.from("cases").select("id").eq("id", id)
    : supabase.from("cases").select("id").eq("id", id).is("user_id", null)
  const { data: caseRow, error } = await query.single()
  if (error || !caseRow) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 })
  }

  let body: Partial<NarrateBody> = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const { thresholds, defaults, kept = [], dropped = [] } = body
  if (!thresholds || !defaults) {
    return NextResponse.json({ error: "thresholds and defaults required" }, { status: 400 })
  }

  const userPrompt = [
    `New thresholds: IC50 ≤ ${thresholds.ic50_max} nM, VAF ≥ ${thresholds.vaf_min.toFixed(2)}`,
    `Pipeline defaults: IC50 ≤ ${defaults.ic50_max} nM, VAF ≥ ${defaults.vaf_min.toFixed(2)}`,
    "",
    `Candidates surviving new thresholds (${kept.length}):`,
    summarizeCandidates(kept),
    "",
    `Candidates dropped vs. defaults (${dropped.length}):`,
    summarizeCandidates(dropped),
  ].join("\n")

  try {
    const ai = new GoogleGenAI({ vertexai: true, project: GCP_PROJECT, location: GCP_REGION })
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: { systemInstruction: SYSTEM_PROMPT },
    })
    const narrative = (response.text ?? "").trim()
    return NextResponse.json({ narrative })
  } catch (err) {
    console.error("[sensitivity-narrate] Gemma error:", err)
    return NextResponse.json({ narrative: "" }, { status: 503 })
  }
}
