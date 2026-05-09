"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleGoogleSignIn() {
    setError("")
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // On success the browser is redirected — no further client action needed
  }

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
            Welcome
          </h1>
          <p className="text-muted-foreground text-sm">Sign in to access your cases</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-7 shadow-xl shadow-black/20">
          {error && (
            <p className="text-destructive text-sm bg-destructive/10 rounded-lg px-3 py-2 mb-4">
              {error}
            </p>
          )}
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-11 rounded-lg bg-card border border-border/60 text-foreground font-semibold hover:bg-secondary/60 transition-colors shadow-sm flex items-center justify-center gap-3"
            variant="outline"
          >
            {loading ? (
              <span className="text-sm text-muted-foreground">Redirecting…</span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path
                    d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                    fill="#4285F4"
                  />
                  <path
                    d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                    fill="#34A853"
                  />
                  <path
                    d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-sm">Continue with Google</span>
              </>
            )}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5 leading-relaxed">
          By signing in you agree to our{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
