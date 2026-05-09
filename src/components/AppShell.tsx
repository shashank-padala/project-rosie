"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, FilePlus, BookOpen, FlaskConical, Menu, X, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const NAV = [
  { label: "Dashboard", href: "/dashboard",  icon: LayoutDashboard },
  { label: "New Case",  href: "/submit",     icon: FilePlus },
  { label: "Docs",      href: "/docs",       icon: BookOpen },
  { label: "Sample",    href: "/demo",       icon: FlaskConical },
]

interface Props {
  children: React.ReactNode
  userEmail: string
}

export function AppShell({ children, userEmail }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(true)

  const avatarLetter = userEmail[0]?.toUpperCase() ?? "?"

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background md:flex">
      {/* ── Desktop sidebar ── */}
      <aside
        className={`hidden md:flex md:flex-col md:shrink-0 transition-all duration-200 bg-sidebar border-r border-sidebar-border ${
          open ? "md:w-60" : "md:w-16"
        }`}
      >
        {/* Logo row */}
        <div
          className={`h-16 flex items-center border-b border-sidebar-border shrink-0 ${
            open ? "px-3 gap-2" : "px-0 justify-center"
          }`}
        >
          {open && (
            <Link href="/dashboard" className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xl leading-none select-none">🐾</span>
              <span
                className="font-bold text-sm text-sidebar-foreground tracking-tight truncate"
                style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
              >
                Project Rosie
              </span>
            </Link>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors shrink-0"
            aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          >
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                title={!open ? label : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  !open ? "justify-center" : ""
                } ${
                  active
                    ? "bg-sidebar-accent text-sidebar-primary font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {open && <span>{label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-sidebar-border shrink-0">
          <div className={`flex items-center gap-2.5 ${!open ? "justify-center" : "px-1"}`}>
            <div className="h-7 w-7 rounded-full bg-hero-gradient flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0 select-none">
              {avatarLetter}
            </div>
            {open && (
              <>
                <p className="text-xs text-sidebar-foreground/60 truncate flex-1 min-w-0">{userEmail}</p>
                <button
                  onClick={signOut}
                  title="Sign out"
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-sidebar-border bg-sidebar/95 backdrop-blur px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] md:hidden">
        <ul className="grid grid-cols-4 gap-1">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-all active:scale-[0.98] ${
                    active
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
