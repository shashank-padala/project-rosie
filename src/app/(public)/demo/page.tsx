import { ReportViewer } from "@/components/ReportViewer"
import { ChatWidget } from "@/components/ChatWidget"
import { createServerClient } from "@/lib/supabase/server"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function DemoPage() {
  const supabase = await createServerClient()
  const { data: caseData, error } = await supabase
    .from("cases")
    .select("*")
    .is("user_id", null)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="max-w-6xl mx-auto w-full px-5 sm:px-6 pt-10 pb-12">
      {/* Banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-3.5 mb-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary mb-0.5">Sample Case</p>
          <p className="text-xs text-muted-foreground">
            Canine mammary tumor · 18 somatic variants · 4 neoantigen candidates (TP53, PIK3CA) · real pipeline output, no edits.
          </p>
        </div>
        <Link
          href="/submit"
          className="shrink-0 text-xs px-4 py-2 rounded-lg bg-hero-gradient text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-md shadow-primary/20 whitespace-nowrap"
        >
          Submit your own VCF →
        </Link>
      </div>

      {error || !caseData ? (
        <div className="rounded-2xl border border-border/60 bg-card p-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center text-3xl mx-auto mb-5">
            🧬
          </div>
          <h2
            className="text-xl font-bold mb-2"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            Demo not yet seeded
          </h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
            Run{" "}
            <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono">
              python3 scripts/seed_demo.py
            </code>{" "}
            to load the canine mammary tumor demo case.
          </p>
        </div>
      ) : (
        <>
          <ReportViewer caseData={caseData} />
          <ChatWidget caseId={caseData.id} />
        </>
      )}
    </div>
  )
}
