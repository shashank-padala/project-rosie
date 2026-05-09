import { createServerClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/AppShell"
import { Navigation } from "@/components/Navigation"

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    return <AppShell userEmail={user.email ?? ""}>{children}</AppShell>
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-1 pt-16">{children}</main>
    </div>
  )
}
