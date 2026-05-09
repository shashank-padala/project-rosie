"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ReportViewer } from "@/components/ReportViewer"
import { ChatWidget } from "@/components/ChatWidget"
import { createClient } from "@/lib/supabase/client"
import type { Case } from "@/types/case"

export default function CasePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace(`/auth/login?next=/cases/${id}`); return }

      const { data } = await supabase
        .from("cases")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()

      if (!data) { setNotFound(true); return }
      setCaseData(data as Case)
    }

    load()

    const channel = supabase
      .channel(`case-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "cases", filter: `id=eq.${id}` },
        async () => {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return
          const { data } = await supabase
            .from("cases")
            .select("*")
            .eq("id", id)
            .eq("user_id", user.id)
            .single()
          if (data) setCaseData(data as Case)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id, router])

  if (notFound) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Case not found.</p>
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-4 pt-10 pb-12">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All Cases
        </Link>
        <span className="text-border/60">·</span>
        <h1 className="text-xl font-semibold truncate">{caseData.sample_name}</h1>
      </div>
      <ReportViewer caseData={caseData} />
      {caseData.status === "completed" && <ChatWidget caseId={id} />}
    </div>
  )
}
