"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center animate-fade-up">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-3xl mb-5">
          📬
        </div>
        <h1
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          Check your email
        </h1>
        <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
          We sent a confirmation link to <strong className="text-foreground">{email}</strong>.
          Click it to activate your account.
        </p>
        <Link href="/" className="mt-7 text-primary text-sm font-medium hover:underline">
          ← Back to home
        </Link>
      </div>
    )
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
            Create your account
          </h1>
          <p className="text-muted-foreground text-sm">Start submitting vaccine cases</p>
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
                placeholder="min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 rounded-lg bg-secondary/50 border-border/60 focus:border-primary"
                minLength={8}
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
              {loading ? "Creating account…" : "Create Account"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
