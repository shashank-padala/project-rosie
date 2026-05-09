export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getGcpAccessToken } from "@/lib/gcp-auth"

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("cases")
    .select("id, created_at, sample_name, species, status, total_mutations, candidates_after_filtering")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  try {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Enforce 3-submission cap
  const { count, error: countError } = await supabase
    .from("cases")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)

  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })

  if ((count ?? 0) >= 3) {
    return NextResponse.json(
      {
        error:
          "Submission limit reached. You've used all 3 of your free submissions. Email shashank.padala@gmail.com with a short intro to request more.",
      },
      { status: 429 }
    )
  }

  const body = await req.json()
  const { sample_name, species, alleles, gcs_vcf_path } = body

  if (!sample_name?.trim()) {
    return NextResponse.json({ error: "sample_name is required" }, { status: 400 })
  }
  if (!gcs_vcf_path) {
    return NextResponse.json({ error: "gcs_vcf_path is required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("cases")
    .insert({
      user_id: user.id,
      sample_name: sample_name.trim(),
      species: species ?? "canis_lupus_familiaris",
      alleles: alleles ?? [],
      status: "running",
    })
    .select("id")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Trigger Cloud Run Job asynchronously — don't await so response is fast
  triggerPipelineJob({
    caseId: data.id,
    gcsVcfPath: gcs_vcf_path,
    sampleName: sample_name.trim(),
    alleles: (alleles ?? []).join(","),
    species: species ?? "canis_lupus_familiaris",
  }).catch((err) => console.error("[cloud-run] trigger failed:", err))

  return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function triggerPipelineJob({
  caseId,
  gcsVcfPath,
  sampleName,
  alleles,
  species,
}: {
  caseId: string
  gcsVcfPath: string
  sampleName: string
  alleles: string
  species: string
}) {
  const jobName = process.env.CLOUD_RUN_JOB_NAME
  const callbackUrl = process.env.NEXT_PUBLIC_APP_URL
  const secret = process.env.PIPELINE_CALLBACK_SECRET

  if (!jobName || !callbackUrl || !secret) {
    throw new Error(`[cloud-run] missing env vars: jobName=${!!jobName} callbackUrl=${!!callbackUrl} secret=${!!secret}`)
  }

  // Support short name (rosie-pipeline) or full resource path
  const projectId = process.env.GCP_PROJECT_ID ?? ""
  const region = process.env.GCP_REGION ?? "us-central1"
  const fullJobName = jobName.startsWith("projects/")
    ? jobName
    : `projects/${projectId}/locations/${region}/jobs/${jobName}`

  const token = await getGcpAccessToken()

  const res = await fetch(`https://run.googleapis.com/v2/${fullJobName}:run`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      overrides: {
        containerOverrides: [
          {
            env: [
              { name: "CASE_ID",                   value: caseId },
              { name: "GCS_VCF_PATH",               value: gcsVcfPath },
              { name: "SAMPLE_NAME",                value: sampleName },
              { name: "ALLELES",                    value: alleles },
              { name: "SPECIES",                    value: species },
              { name: "CALLBACK_URL",               value: callbackUrl },
              { name: "PIPELINE_CALLBACK_SECRET",   value: secret },
              { name: "GCS_BUCKET",                 value: process.env.GCS_BUCKET ?? "" },
              { name: "GCP_PROJECT_ID",             value: process.env.GCP_PROJECT_ID ?? "" },
              { name: "GEMMA_MODEL",                value: process.env.GEMMA_MODEL ?? "gemma-4-26b-a4b-it-maas" },
            ],
          },
        ],
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Cloud Run Jobs API ${res.status}: ${text}`)
  }
}
