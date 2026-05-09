import Link from "next/link"
import { StatusBadge } from "@/components/StatusBadge"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?next=/dashboard")

  const { data: cases } = await supabase
    .from("cases")
    .select("id, created_at, sample_name, species, status, total_mutations, candidates_after_filtering")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="max-w-5xl mx-auto w-full px-5 sm:px-6 pt-10 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            Your Cases
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {cases?.length ?? 0} {cases?.length === 1 ? "case" : "cases"} submitted
          </p>
        </div>
        <Link
          href="/submit"
          className="px-4 py-2 rounded-lg bg-hero-gradient text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
        >
          + New Case
        </Link>
      </div>

      {!cases || cases.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center text-3xl mx-auto mb-5">
            🧬
          </div>
          <h2
            className="text-xl font-bold mb-2"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            No cases yet
          </h2>
          <p className="text-muted-foreground text-sm mb-7 max-w-xs mx-auto leading-relaxed">
            Submit a tumor VCF to get your first personalized vaccine candidate list.
          </p>
          <Link
            href="/submit"
            className="inline-block px-6 py-2.5 rounded-lg bg-hero-gradient text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            Submit First Case
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xl shadow-black/10">
          <div className="px-5 py-3.5 border-b border-border/50 bg-secondary/30">
            <div className="grid grid-cols-12 gap-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <div className="col-span-4">Sample</div>
              <div className="col-span-3 hidden sm:block">Species</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 hidden md:block">Submitted</div>
              <div className="col-span-1"></div>
            </div>
          </div>
          {cases.map((c, i) => (
            <div
              key={c.id}
              className={`px-5 py-4 grid grid-cols-12 gap-4 items-center hover:bg-secondary/20 transition-colors ${
                i < cases.length - 1 ? "border-b border-border/40" : ""
              }`}
            >
              <div className="col-span-4 font-medium text-sm truncate">{c.sample_name}</div>
              <div className="col-span-3 text-muted-foreground text-sm capitalize hidden sm:block truncate">
                {c.species.replace(/_/g, " ")}
              </div>
              <div className="col-span-2">
                <StatusBadge status={c.status} />
              </div>
              <div className="col-span-2 text-muted-foreground text-sm hidden md:block">
                {new Date(c.created_at).toLocaleDateString()}
              </div>
              <div className="col-span-1 text-right">
                <Link
                  href={`/cases/${c.id}`}
                  className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                >
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
