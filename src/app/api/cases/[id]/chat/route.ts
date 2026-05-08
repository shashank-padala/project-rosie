import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { GoogleGenAI } from "@google/genai"

const MODEL = process.env.GEMMA_MODEL ?? "gemma-4-26b-a4b-it-maas"
const GCP_PROJECT = process.env.GCP_PROJECT_ID ?? ""
const GCP_REGION = process.env.GCP_REGION ?? "global"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Allow unauthenticated access to demo cases (user_id IS NULL)
  const query = user
    ? supabase.from("cases").select("sample_name, candidates_json, clinical_report_md").eq("id", id)
    : supabase.from("cases").select("sample_name, candidates_json, clinical_report_md").eq("id", id).is("user_id", null)

  const { data: caseData, error } = await query.single()
  if (error || !caseData) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 })
  }

  const { message, history = [] } = await req.json()
  if (!message?.trim()) {
    return NextResponse.json({ error: "message required" }, { status: 400 })
  }

  const candidates = caseData.candidates_json?.candidates ?? []
  const topCandidates = candidates.slice(0, 5).map((c: { rank: number; peptide: string; gene: string; ic50_nm: number; composite_score: number }) =>
    `Rank ${c.rank}: ${c.peptide} (${c.gene}) IC50=${c.ic50_nm.toFixed(1)}nM score=${c.composite_score.toFixed(3)}`
  ).join("\n")

  const systemPrompt = `You are a veterinary oncology AI assistant analyzing a neoantigen vaccine case.

Case: ${caseData.sample_name}
Top candidates:
${topCandidates}

${caseData.clinical_report_md ? `Clinical report summary (first 800 chars):\n${caseData.clinical_report_md.slice(0, 800)}` : ""}

Answer questions about this case concisely and accurately. If you don't know something, say so.`

  try {
    const ai = new GoogleGenAI({ vertexai: true, project: GCP_PROJECT, location: GCP_REGION })

    const contents = [
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      })),
      { role: "user", parts: [{ text: message }] },
    ]

    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: { systemInstruction: systemPrompt },
    })

    const reply = response.text ?? "No response from model."
    return NextResponse.json({ reply })
  } catch (err) {
    console.error("Gemma chat error:", err)
    return NextResponse.json(
      { error: "Gemma 4 is unavailable. Check GCP credentials." },
      { status: 503 }
    )
  }
}
