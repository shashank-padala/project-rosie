import Link from "next/link"
import { StatusBadge } from "@/components/StatusBadge"
import { CaseDashboardActions } from "@/components/CaseDashboardActions"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

function friendlySpecies(species: string): string {
  const map: Record<string, string> = {
    canis_lupus_familiaris: "Canine",
    homo_sapiens:           "Human",
    felis_catus:            "Feline",
    mus_musculus:           "Mouse",
    rattus_norvegicus:      "Rat",
  }
  return map[species] ?? species.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })
}

export default async function DashboardPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?next=/dashboard")

  const { data: cases } = await supabase
    .from("cases")
    .select("id, created_at, sample_name, species, status, total_mutations, candidates_after_filtering")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const count = cases?.length ?? 0

  return (
    <div className="max-w-5xl mx-auto w-full px-5 sm:px-6 pt-10 pb-12">

      {/* Page header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
            Your Cases
          </h1>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            {count} {count === 1 ? "case" : "cases"} submitted
          </p>
        </div>
        <Link
          href="/submit"
          className="h-8 px-3.5 rounded-lg bg-hero-gradient text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shadow-md shadow-primary/20 flex items-center gap-1.5"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M5.5 1.5v8M1.5 5.5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          New Case
        </Link>
      </div>

      {!cases || cases.length === 0 ? (
        <div className="rounded-2xl border border-border/40 bg-card p-16 text-center">
          <div className="h-12 w-12 rounded-2xl bg-secondary/80 flex items-center justify-center text-2xl mx-auto mb-4">
            🧬
          </div>
          <h2 className="text-lg font-bold mb-1.5" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
            No cases yet
          </h2>
          <p className="text-muted-foreground/70 text-sm mb-7 max-w-xs mx-auto leading-relaxed">
            Submit a tumor VCF to get your first personalized vaccine candidate list.
          </p>
          <Link
            href="/submit"
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-hero-gradient text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            Submit First Case
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/40 bg-card overflow-hidden shadow-sm shadow-black/5">

          {/* Column headers */}
          <div className="px-5 py-2.5 border-b border-border/20">
            <div className="grid grid-cols-12 gap-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
              <div className="col-span-4">Case</div>
              <div className="col-span-2 hidden sm:block">Species</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 hidden md:block">Submitted</div>
              <div className="col-span-2 hidden md:block" />
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border/15">
            {cases.map((c) => (
              <div
                key={c.id}
                className="group px-5 py-3.5 grid grid-cols-12 gap-4 items-center hover:bg-secondary/20 transition-colors duration-150"
              >
                {/* Case name + secondary stats */}
                <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-secondary/70 group-hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors duration-150">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="text-muted-foreground/50 group-hover:text-primary transition-colors duration-150">
                      <path d="M3 2.5C3 2.5 4.5 1 6 2.5S7.5 4 9 2.5 10.5 1 12 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      <path d="M3 7C3 7 4.5 5.5 6 7S7.5 8.5 9 7 10.5 5.5 12 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      <path d="M3 11.5C3 11.5 4.5 10 6 11.5S7.5 13 9 11.5 10.5 10 12 11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      <path d="M4.5 2.5v9M7.5 2v10M10.5 2.5v9" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeOpacity="0.35"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate leading-snug">{c.sample_name}</p>
                    {c.total_mutations != null && (
                      <p className="text-[10px] text-muted-foreground/40 mt-0.5 leading-none truncate">
                        {c.total_mutations.toLocaleString()} mutations
                        {c.candidates_after_filtering != null && ` · ${c.candidates_after_filtering} candidates`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Species */}
                <div className="col-span-2 hidden sm:block">
                  <span className="text-xs text-muted-foreground/70">{friendlySpecies(c.species)}</span>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <StatusBadge status={c.status} />
                </div>

                {/* Submitted */}
                <div className="col-span-2 hidden md:block">
                  <span className="text-xs text-muted-foreground/50">{formatDate(c.created_at)}</span>
                </div>

                {/* Actions */}
                <div className="col-span-2 relative z-10 hidden md:block">
                  <CaseDashboardActions caseId={c.id} completed={c.status === "completed"} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
