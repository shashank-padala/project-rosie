"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Navigation } from "@/components/Navigation"
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

    // Realtime: re-fetch full row on any change so we get new columns atomically
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
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Case not found.</p>
        </main>
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Loading…</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 pt-20 pb-12">
        <h1 className="text-xl font-semibold mb-6">{caseData.sample_name}</h1>
        <ReportViewer caseData={caseData} />
        {caseData.status === "completed" && <ChatWidget caseId={id} />}
      </main>
    </div>
  )
}
