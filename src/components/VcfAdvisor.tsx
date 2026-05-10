"use client"

import { useEffect, useState } from "react"
import { parseVcfStats } from "@/lib/vcf-stats"
import type { AdvisoryNote } from "@/app/api/vcf-advisor/route"

interface Props { file: File | null }

const SEV: Record<AdvisoryNote["severity"], { bg: string; border: string; text: string; dot: string; label: string }> = {
  info:     { bg: "bg-zinc-500/5",  border: "border-zinc-500/30",  text: "text-zinc-300",   dot: "bg-zinc-400",    label: "Info"     },
  warning:  { bg: "bg-amber-500/5", border: "border-amber-500/30", text: "text-amber-400",  dot: "bg-amber-400",   label: "Warning"  },
  critical: { bg: "bg-red-500/5",   border: "border-red-500/30",   text: "text-red-400",    dot: "bg-red-400",     label: "Critical" },
}

export function VcfAdvisor({ file }: Props) {
  const [phase, setPhase] = useState<"idle" | "parsing" | "analyzing" | "done" | "failed">("idle")
  const [notes, setNotes] = useState<AdvisoryNote[]>([])
  const [signature, setSignature] = useState<string>("")  // file.name + size — re-runs only when this changes

  useEffect(() => {
    if (!file) { setPhase("idle"); setNotes([]); setSignature(""); return }
    const sig = `${file.name}|${file.size}`
    if (sig === signature && (phase === "done" || phase === "analyzing")) return
    setSignature(sig)

    let cancelled = false
    ;(async () => {
      setPhase("parsing")
      const stats = await parseVcfStats(file)
      if (cancelled) return
      setPhase("analyzing")
      try {
        const res = await fetch("/api/vcf-advisor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stats }),
        })
        const data = await res.json().catch(() => ({ notes: [] }))
        if (cancelled) return
        setNotes(Array.isArray(data.notes) ? data.notes : [])
        setPhase("done")
      } catch {
        if (cancelled) return
        setPhase("failed")
      }
    })()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file])

  if (!file || phase === "idle") return null

  if (phase === "parsing" || phase === "analyzing") {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 flex items-center gap-2.5">
        <span className="inline-block animate-spin text-base leading-none" aria-hidden>🐾</span>
        <p className="text-xs text-foreground/80">
          <span className="font-semibold">Gemma is reviewing your VCF</span>
          <span className="text-muted-foreground/70"> · {phase === "parsing" ? "scanning the file" : "checking for issues"}…</span>
        </p>
      </div>
    )
  }

  if (phase === "failed") {
    // Quiet failure — Submit must remain usable
    return null
  }

  if (notes.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2.5 flex items-center gap-2.5">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0">
          <path d="M3 7.5l3 3 5-6" />
        </svg>
        <p className="text-xs text-emerald-400 font-medium">VCF looks clean — no issues flagged.</p>
        <span className="text-[10px] text-muted-foreground/50 ml-auto">Reviewed by Gemma 4</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          VCF Pre-flight · {notes.length} {notes.length === 1 ? "note" : "notes"}
        </p>
        <span className="text-[10px] text-muted-foreground/50">Reviewed by Gemma 4</span>
      </div>
      {notes.map((n, i) => {
        const s = SEV[n.severity] ?? SEV.info
        return (
          <div key={i} className={`rounded-xl border ${s.border} ${s.bg} px-3.5 py-2.5`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${s.text}`}>{s.label}</span>
              <p className="text-xs font-semibold text-foreground">{n.title}</p>
            </div>
            <p className="text-xs text-muted-foreground/85 leading-relaxed">{n.detail}</p>
            {n.recommendation && (
              <p className="text-[11px] text-muted-foreground/70 italic mt-1.5 leading-relaxed">
                → {n.recommendation}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
