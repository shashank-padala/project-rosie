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
    <div className="flex items-center justify-end gap-3">
      {completed && (
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            Downloads
            <svg
              width="9" height="9" viewBox="0 0 9 9" fill="none"
              className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
            >
              <path d="M1.5 3l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1.5 z-50 w-48 rounded-xl border border-border/50 bg-card shadow-lg shadow-black/15 overflow-hidden">
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
                  <span className="font-mono text-[10px] text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors">{ext}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      <Link
        href={`/cases/${caseId}`}
        className="text-[11px] font-medium text-muted-foreground/50 hover:text-foreground transition-colors flex items-center gap-0.5"
      >
        View
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M2.5 5.5h6M5.5 3l3 2.5-3 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </div>
  )
}
