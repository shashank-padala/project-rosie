"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"

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

  return (
    <div className="flex items-center justify-end gap-1.5">
      {/* Download icon — completed cases only */}
      {completed && (
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            title="Download files"
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/40 hover:border-border transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1.5v7M3.5 6l3 3 3-3M1.5 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
      )}

      {/* View button — always visible */}
      <Link
        href={`/cases/${caseId}`}
        className="h-7 px-2.5 rounded-md flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/40 hover:border-border transition-all"
      >
        View
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M2 5.5h7M5.5 2.5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </div>
  )
}
