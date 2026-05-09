"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { User } from "@supabase/supabase-js"

export function Navigation() {
  const path = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function handleSignOut() {
    setMenuOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const avatarLetter = user?.email?.[0]?.toUpperCase() ?? "?"

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/icon-512.png" alt="Rosie" height={40} width={40} className="h-10 w-10" priority />
          <span className="font-bold text-base tracking-tight" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
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
            <div className="ml-2 relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="h-8 w-8 rounded-full bg-hero-gradient flex items-center justify-center text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 select-none hover:opacity-90 transition-opacity"
                title={user.email}
              >
                {avatarLetter}
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-10 w-52 rounded-xl border border-border/60 bg-card shadow-xl shadow-black/10 py-1 z-50 animate-fade-up">
                  <div className="px-3 py-2.5 border-b border-border/50">
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors text-left"
                  >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                      <path
                        d="M3 1h6.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0V2H3.5v11H9v-1.5a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5v-12A.5.5 0 0 1 3 1zm8.854 4.646a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708-.708L10.293 7H6.5a.5.5 0 0 1 0-1h3.793L9.146 4.854a.5.5 0 1 1 .708-.708l2 2z"
                        fill="currentColor"
                      />
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
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
