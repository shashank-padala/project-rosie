"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push("/dashboard")
    }
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
            Welcome back
          </h1>
          <p className="text-muted-foreground text-sm">Sign in to your account</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-7 shadow-xl shadow-black/20">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 rounded-lg bg-secondary/50 border-border/60 focus:border-primary"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 rounded-lg bg-secondary/50 border-border/60 focus:border-primary"
                required
              />
            </div>
            {error && (
              <p className="text-destructive text-sm bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full h-10 rounded-lg bg-hero-gradient text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 border-0 mt-2"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
