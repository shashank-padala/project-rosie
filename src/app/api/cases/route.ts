import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createServerClient()
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
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { sample_name, species, alleles, vcf_filename } = body

  if (!sample_name?.trim()) {
    return NextResponse.json({ error: "sample_name is required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("cases")
    .insert({
      user_id: user.id,
      sample_name: sample_name.trim(),
      species: species ?? "canis_lupus_familiaris",
      alleles: alleles ?? [],
      status: "pending",
    })
    .select("id")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // M5 will trigger the Cloud Run job here using vcf_filename
  void vcf_filename

  return NextResponse.json({ id: data.id }, { status: 201 })
}
