"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 bg-background">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-2xl">🐾</span>
            <span
              className="text-xl font-bold text-foreground"
              style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
            >
              Project Rosie
            </span>
          </Link>
          <h1
            className="text-2xl font-bold text-foreground mb-1"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            Get started
          </h1>
          <p className="text-muted-foreground text-sm">Sign in with Google to get started</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-7 shadow-xl shadow-black/20 text-center space-y-4">
          <p className="text-muted-foreground text-sm leading-relaxed">
            No separate account creation needed. Google sign-in handles both new and returning users.
          </p>
          <Button
            onClick={() => router.push("/auth/login")}
            className="w-full h-10 rounded-lg bg-hero-gradient text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 border-0"
          >
            Sign in with Google →
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Already signed in?{" "}
          <Link href="/dashboard" className="text-primary hover:underline font-medium">
            Go to dashboard
          </Link>
        </p>
      </div>
    </div>
  )
}
