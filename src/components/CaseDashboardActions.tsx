"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"

interface Props {
  caseId: string
  completed: boolean
}

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
    <div ref={ref} className="relative flex justify-end">
      <button
        onClick={() => setOpen((o) => !o)}
        className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-secondary border border-transparent hover:border-border/50 transition-all"
        aria-label="Case actions"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <circle cx="7" cy="2.5" r="1.2" />
          <circle cx="7" cy="7"   r="1.2" />
          <circle cx="7" cy="11.5" r="1.2" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-border/60 bg-card shadow-xl shadow-black/20 py-1 overflow-hidden">
          {/* Open */}
          <Link
            href={`/cases/${caseId}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/60 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6h8M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Open Case
          </Link>

          {completed && (
            <>
              <div className="my-1 border-t border-border/40" />
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
                Downloads
              </p>
              {[
                { label: "Clinical Report",  ext: ".pdf",   type: "report-pdf",  blank: true },
                { label: "mRNA Sequence",    ext: ".fasta", type: "fasta",         blank: false },
                { label: "Synthesis Spec",   ext: ".pdf",   type: "synthesis-pdf", blank: true },
              ].map(({ label, ext, type, blank }) => (
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
            </>
          )}
        </div>
      )}
    </div>
  )
}
