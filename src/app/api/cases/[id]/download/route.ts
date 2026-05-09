import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

function fileSlug(name: string) {
  return name.replace(/[^a-z0-9]+/gi, "_").toLowerCase()
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const { id } = await params
  const type = req.nextUrl.searchParams.get("type")

  const { data: c } = await supabase
    .from("cases")
    .select("user_id, sample_name, clinical_report_md, mrna_fasta, mrna_summary_md")
    .eq("id", id)
    .single()

  if (!c || c.user_id !== user.id) return new NextResponse("Not found", { status: 404 })

  const slug = fileSlug(c.sample_name)

  if (type === "report" && c.clinical_report_md) {
    return new NextResponse(c.clinical_report_md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug}_clinical_report.md"`,
      },
    })
  }
  if (type === "fasta" && c.mrna_fasta) {
    return new NextResponse(c.mrna_fasta, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug}_vaccine_mrna.fasta"`,
      },
    })
  }
  if (type === "synthesis" && c.mrna_summary_md) {
    return new NextResponse(c.mrna_summary_md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug}_synthesis_spec.md"`,
      },
    })
  }

  return new NextResponse("Not found", { status: 404 })
}
