"use client"

import { useState, useRef, useEffect } from "react"

interface Props {
  caseId: string
  completed: boolean
}

const DOWNLOADS = [
  { label: "Clinical Report", ext: ".pdf",   type: "report-pdf",    blank: true  },
  { label: "mRNA Sequence",   ext: ".fasta", type: "fasta",         blank: false },
  { label: "Synthesis Spec",  ext: ".pdf",   type: "synthesis-pdf", blank: true  },
] as const

export function CaseDashboardActions({ caseId, completed }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onOutside)
    return () => document.removeEventListener("mousedown", onOutside)
  }, [])

  if (!completed) return null

  return (
    <div ref={ref} className="relative">
      {/* Kebab — hidden until row hover */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-secondary border border-transparent hover:border-border/50 transition-all"
        aria-label="Download options"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <circle cx="7" cy="2.5"  r="1.2" />
          <circle cx="7" cy="7"    r="1.2" />
          <circle cx="7" cy="11.5" r="1.2" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border border-border/60 bg-card shadow-xl shadow-black/20 overflow-hidden">
          <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
            Download
          </p>
          {DOWNLOADS.map(({ label, ext, type, blank }) => (
            <a
              key={type}
              href={`/api/cases/${caseId}/download?type=${type}`}
              target={blank ? "_blank" : undefined}
              rel={blank ? "noopener noreferrer" : undefined}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-xs hover:bg-secondary/60 transition-colors group"
            >
              <span className="text-foreground">{label}</span>
              <span className="font-mono text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">{ext}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
