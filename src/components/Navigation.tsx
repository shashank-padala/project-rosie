"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { User } from "@supabase/supabase-js"

export function Navigation() {
  const path = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const avatarLetter = user?.email?.[0]?.toUpperCase() ?? "?"

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-xl leading-none">🐾</span>
          <span
            className="text-lg font-bold text-foreground"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            Project Rosie
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/docs"
            className={cn(
              "px-3.5 py-2 rounded-lg text-sm font-medium transition-colors",
              path === "/docs"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            Docs
          </Link>
          <Link
            href="/demo"
            className={cn(
              "px-3.5 py-2 rounded-lg text-sm font-medium transition-colors",
              path === "/demo"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            Sample Case
          </Link>
          <Link
            href="/dashboard"
            className={cn(
              "px-3.5 py-2 rounded-lg text-sm font-medium transition-colors",
              path.startsWith("/dashboard")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            Dashboard
          </Link>

          {user ? (
            <div className="ml-2 flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-full bg-hero-gradient flex items-center justify-center text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 select-none"
                title={user.email}
              >
                {avatarLetter}
              </div>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors font-medium"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="ml-2 px-4 py-2 rounded-lg text-sm bg-hero-gradient text-primary-foreground hover:opacity-90 transition-opacity font-semibold shadow-lg shadow-primary/20"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
