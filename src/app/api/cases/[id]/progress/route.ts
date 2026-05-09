import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const secret = process.env.PIPELINE_CALLBACK_SECRET
  const authHeader = req.headers.get("authorization")
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const {
    status,
    total_mutations,
    candidates_after_filtering,
    candidates_json,
    clinical_report_md,
    mrna_fasta,
    mrna_summary_md,
    binding_affinity_img_b64,
    mutation_landscape_img_b64,
    error_message,
  } = body

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (status)                      update.status = status
  if (total_mutations != null)     update.total_mutations = total_mutations
  if (candidates_after_filtering != null) update.candidates_after_filtering = candidates_after_filtering
  if (candidates_json)             update.candidates_json = candidates_json
  if (clinical_report_md)         update.clinical_report_md = clinical_report_md
  if (mrna_fasta)                  update.mrna_fasta = mrna_fasta
  if (mrna_summary_md)            update.mrna_summary_md = mrna_summary_md
  if (binding_affinity_img_b64)   update.binding_affinity_img_b64 = binding_affinity_img_b64
  if (mutation_landscape_img_b64) update.mutation_landscape_img_b64 = mutation_landscape_img_b64
  if (error_message)              update.error_message = error_message

  const supabase = createAdminClient()
  const { error } = await supabase.from("cases").update(update).eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
