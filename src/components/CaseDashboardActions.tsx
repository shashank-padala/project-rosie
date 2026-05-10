"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"

interface Props {
  caseId: string
  completed: boolean
}

const DOWNLOADS = [
  { label: "Clinical Report", ext: ".md",    type: "report",        target: "_self" },
  { label: "mRNA Sequence",   ext: ".fasta", type: "fasta",         target: "_self" },
  { label: "Synthesis Spec",  ext: ".pdf",   type: "synthesis-pdf", target: "_blank" },
] as const

export function CaseDashboardActions({ caseId, completed }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  return (
    <div className="flex items-center gap-2">
      {/* Download dropdown */}
      {completed && (
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="h-7 px-2.5 rounded-md flex items-center gap-1 text-xs font-medium border border-border/50 bg-secondary/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            Download
            <svg
              width="10" height="10" viewBox="0 0 10 10" fill="none"
              className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
            >
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border border-border/60 bg-card shadow-xl shadow-black/20 py-1 overflow-hidden">
              {DOWNLOADS.map(({ label, ext, type, target }) => (
                <a
                  key={type}
                  href={`/api/cases/${caseId}/download?type=${type}`}
                  target={target}
                  rel={target === "_blank" ? "noopener noreferrer" : undefined}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-3 py-2 text-xs hover:bg-secondary/60 transition-colors group"
                >
                  <span className="text-foreground font-medium">{label}</span>
                  <span className="text-muted-foreground/50 font-mono group-hover:text-muted-foreground transition-colors">{ext}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Open case */}
      <Link
        href={`/cases/${caseId}`}
        className="h-7 px-2.5 rounded-md flex items-center gap-1 text-xs font-medium border border-border/50 bg-secondary/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
      >
        Open
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </div>
  )
}
