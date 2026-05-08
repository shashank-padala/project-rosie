"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function Navigation() {
  const path = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
          <span className="text-primary">🐾</span>
          <span>Project Rosie</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/demo"
            className={cn(
              "px-3 py-1.5 rounded-md text-sm transition-colors",
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
              "px-3 py-1.5 rounded-md text-sm transition-colors",
              path.startsWith("/dashboard")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            Dashboard
          </Link>
          <Link
            href="/auth/login"
            className="ml-2 px-4 py-1.5 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
          >
            Sign In
          </Link>
        </nav>
      </div>
    </header>
  )
}
