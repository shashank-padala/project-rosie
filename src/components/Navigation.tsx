"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function Navigation() {
  const path = usePathname()

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
            href="/demo"
            className={cn(
              "px-3.5 py-2 rounded-lg text-sm font-medium transition-colors",
              path === "/demo"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            Demo
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
          <Link
            href="/auth/login"
            className="ml-2 px-4 py-2 rounded-lg text-sm bg-hero-gradient text-primary-foreground hover:opacity-90 transition-opacity font-semibold shadow-lg shadow-primary/20"
          >
            Sign In
          </Link>
        </nav>
      </div>
    </header>
  )
}
