"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"

interface Props {
  caseId: string
  completed: boolean
}

const DOWNLOADS = [
  { label: "Download Clinical Report", ext: ".pdf",   type: "report-pdf",    blank: true  },
  { label: "Download mRNA Sequence",   ext: ".fasta", type: "fasta",         blank: false },
  { label: "Download mRNA Specs",      ext: ".pdf",   type: "synthesis-pdf", blank: true  },
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
    <div className="flex items-center justify-end gap-3">
      {completed && (
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            title="Downloads"
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-secondary border border-border/30 hover:border-border/60 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <circle cx="7" cy="2.5"  r="1.2" />
              <circle cx="7" cy="7"    r="1.2" />
              <circle cx="7" cy="11.5" r="1.2" />
            </svg>
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1.5 z-50 w-56 rounded-xl border border-border/50 bg-card shadow-lg shadow-black/15 overflow-hidden">
              {DOWNLOADS.map(({ label, ext, type, blank }) => (
                <a
                  key={type}
                  href={`/api/cases/${caseId}/download?type=${type}`}
                  target={blank ? "_blank" : undefined}
                  rel={blank ? "noopener noreferrer" : undefined}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 text-xs hover:bg-secondary/60 transition-colors group"
                >
                  <span className="text-foreground font-medium">{label}</span>
                  <span className="font-mono text-[10px] text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors">{ext}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      <Link
        href={`/cases/${caseId}`}
        className="h-7 px-2.5 rounded-md flex items-center text-[11px] font-semibold bg-hero-gradient text-primary-foreground hover:opacity-90 transition-opacity shadow-sm shadow-primary/20"
      >
        View Case Details
      </Link>
    </div>
  )
}
