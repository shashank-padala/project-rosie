import { Navigation } from "@/components/Navigation"
import { ReportViewer } from "@/components/ReportViewer"
import { ChatWidget } from "@/components/ChatWidget"
import { createServerClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?next=/cases/${id}`)
  }

  const { data: caseData } = await supabase
    .from("cases")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!caseData) notFound()

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
