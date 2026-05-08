import { Navigation } from "@/components/Navigation"
import { ReportViewer } from "@/components/ReportViewer"
import { ChatWidget } from "@/components/ChatWidget"
import { createServerClient } from "@/lib/supabase/server"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function DemoPage() {
  const supabase = createServerClient()
  const { data: caseData, error } = await supabase
    .from("cases")
    .select("*")
    .is("user_id", null)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 pt-20 pb-12">
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm text-primary">
            <strong>Demo:</strong> HCC1395 breast cancer benchmark case.
            Real pipeline output — no edits.
          </p>
          <Link
            href="/auth/signup"
            className="shrink-0 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Submit your own VCF →
          </Link>
        </div>

        {error || !caseData ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <p className="text-4xl mb-4">🧬</p>
            <h2 className="text-lg font-semibold mb-2">Demo not yet seeded</h2>
            <p className="text-muted-foreground text-sm">
              Run <code className="bg-secondary px-1 rounded">python3 scripts/seed_demo.py</code> to load the HCC1395 benchmark case.
            </p>
          </div>
        ) : (
          <>
            <ReportViewer caseData={caseData} />
            <ChatWidget caseId={caseData.id} />
          </>
        )}
      </main>
    </div>
  )
}
