import Link from "next/link"
import { Navigation } from "@/components/Navigation"
import { StatusBadge } from "@/components/StatusBadge"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?next=/dashboard")
  }

  const { data: cases } = await supabase
    .from("cases")
    .select("id, created_at, sample_name, species, status, total_mutations, candidates_after_filtering")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-20 pb-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Your Cases</h1>
          <Link
            href="/submit"
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            + New Case
          </Link>
        </div>

        {!cases || cases.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <p className="text-4xl mb-4">🧬</p>
            <h2 className="text-lg font-semibold mb-2">No cases yet</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Submit a tumor VCF to get your first personalized vaccine candidate list.
            </p>
            <Link
              href="/submit"
              className="inline-block px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Submit First Case
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sample</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Species</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Submitted</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{c.sample_name}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell capitalize">
                      {c.species.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/cases/${c.id}`}
                        className="text-primary hover:underline text-xs"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
