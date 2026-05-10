"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Props {
  caseId: string
  completed: boolean
}

const DOWNLOADS = [
  {
    label: "Clinical Report",
    ext: ".pdf",
    type: "report-pdf",
    blank: true,
    icon: (
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.5" y="1.5" width="9" height="11" rx="1.2" />
        <path d="M5 5h4M5 7.5h4M5 10h2.5" />
      </svg>
    ),
  },
  {
    label: "mRNA Sequence",
    ext: ".fasta",
    type: "fasta",
    blank: false,
    icon: (
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M3 2.5C3 2.5 4.5 1 6 2.5S7.5 4 9 2.5 10.5 1 12 2.5" />
        <path d="M3 7C3 7 4.5 5.5 6 7S7.5 8.5 9 7 10.5 5.5 12 7" />
        <path d="M3 11.5C3 11.5 4.5 10 6 11.5S7.5 13 9 11.5 10.5 10 12 11.5" />
        <path d="M4.5 2.5v9M7.5 2v10M10.5 2.5v9" strokeWidth="0.9" strokeOpacity="0.4" />
      </svg>
    ),
  },
  {
    label: "mRNA Synthesis Spec",
    ext: ".pdf",
    type: "synthesis-pdf",
    blank: true,
    icon: (
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.5" y="1.5" width="9" height="11" rx="1.2" />
        <path d="M5 5h4M5 7.5h3M5 10h4" />
      </svg>
    ),
  },
] as const

const DownloadIcon = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 1.5v6M3.5 5.5L6 8l2.5-2.5" />
    <path d="M2 10h8" />
  </svg>
)

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3.5h10M5 3.5V2.2c0-.4.3-.7.7-.7h2.6c.4 0 .7.3.7.7v1.3" />
    <path d="M3.2 3.5l.6 8.3c0 .4.4.7.8.7h4.8c.4 0 .8-.3.8-.7l.6-8.3" />
    <path d="M5.8 6v4.2M8.2 6v4.2" />
  </svg>
)

export function CaseDashboardActions({ caseId, completed }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    function onScroll() { setOpen(false) }
    document.addEventListener("mousedown", onOutside)
    window.addEventListener("scroll", onScroll, true)
    return () => {
      document.removeEventListener("mousedown", onOutside)
      window.removeEventListener("scroll", onScroll, true)
    }
  }, [])

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
    }
    setOpen((o) => !o)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/cases/${caseId}`, { method: "DELETE" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        alert(`Failed to delete case: ${body?.error ?? res.statusText}`)
        setDeleting(false)
        return
      }
      setOpen(false)
      setConfirming(false)
      router.refresh()
    } catch (e) {
      alert(`Failed to delete case: ${(e as Error).message}`)
      setDeleting(false)
    }
  }

  const dropdown = (
    <div
      ref={menuRef}
      style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 9999 }}
      className="w-56 rounded-xl border border-border/50 bg-card shadow-lg shadow-black/15 overflow-hidden"
    >
      {DOWNLOADS.map(({ label, ext, type, blank, icon }) =>
        completed ? (
          <a
            key={type}
            href={`/api/cases/${caseId}/download?type=${type}`}
            target={blank ? "_blank" : undefined}
            rel={blank ? "noopener noreferrer" : undefined}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-secondary/60 transition-colors group"
          >
            <span className="text-muted-foreground/50 group-hover:text-muted-foreground shrink-0 transition-colors">{icon}</span>
            <span className="text-foreground font-medium flex-1">{label}</span>
            <span className="text-muted-foreground/30 group-hover:text-muted-foreground/60 shrink-0 transition-colors"><DownloadIcon /></span>
          </a>
        ) : (
          <div
            key={type}
            className="flex items-center gap-2.5 px-3 py-2.5 text-xs opacity-35 cursor-not-allowed"
          >
            <span className="text-muted-foreground/50 shrink-0">{icon}</span>
            <span className="text-foreground font-medium flex-1">{label}</span>
            <span className="text-muted-foreground/30 shrink-0"><DownloadIcon /></span>
          </div>
        )
      )}
      {!completed && (
        <p className="px-3 py-2 text-[10px] text-muted-foreground/50 border-t border-border/30">
          Available when case completes
        </p>
      )}

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-red-500/10 transition-colors group border-t border-border/30 text-red-500"
        >
          <span className="shrink-0"><TrashIcon /></span>
          <span className="font-medium flex-1 text-left">Delete Case</span>
        </button>
      ) : (
        <div className="border-t border-border/30 bg-red-500/5 px-3 py-2.5 space-y-2">
          <p className="text-[11px] text-foreground font-medium leading-snug">Delete this case permanently?</p>
          <p className="text-[10px] text-muted-foreground/70 leading-snug">All artifacts will be removed and cannot be recovered.</p>
          <div className="flex gap-1.5 pt-0.5">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="h-6 px-2 rounded text-[10px] font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="h-6 px-2 rounded text-[10px] font-semibold bg-secondary text-foreground hover:bg-secondary/70 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/cases/${caseId}`}
        className="h-7 px-2.5 rounded-md flex items-center text-[11px] font-semibold bg-hero-gradient text-primary-foreground hover:opacity-90 transition-opacity shadow-sm shadow-primary/20"
      >
        View Case
      </Link>

      <button
        ref={btnRef}
        onClick={handleOpen}
        title="More options"
        className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-secondary border border-border/30 hover:border-border/60 transition-all"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <circle cx="7" cy="2.5"  r="1.2" />
          <circle cx="7" cy="7"    r="1.2" />
          <circle cx="7" cy="11.5" r="1.2" />
        </svg>
      </button>

      {open && typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  )
}
