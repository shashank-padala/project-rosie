"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { CandidatesTable } from "@/components/CandidatesTable"
import type { Case, CaseStatus } from "@/types/case"

const PIPELINE_STAGES: CaseStatus[] = [
  "pending", "running", "scoring", "reporting", "designing", "completed",
]

interface StepDef {
  status: CaseStatus
  tag: string
  title: string
  desc: string
  gemma4?: true
}

const STEPS: StepDef[] = [
  {
    status: "pending",
    tag: "Job Initialization",
    title: "Case Queued",
    desc: "Your VCF file has been received and queued on our compute cluster. The job will start momentarily.",
  },
  {
    status: "running",
    tag: "pVACseq · MHC Binding Prediction",
    title: "Neoantigen Prediction",
    desc: "pVACseq is scanning every tumor mutation against your MHC alleles to identify peptides that could train the immune system to recognize and attack cancer cells.",
  },
  {
    status: "scoring",
    tag: "Composite Scoring & Filtering",
    title: "Candidate Ranking",
    desc: "Candidates are filtered by binding affinity (IC50 < 500 nM) and tumor allele frequency, then ranked by a composite immunogenicity score.",
  },
  {
    status: "reporting",
    tag: "Charts · AI Clinical Report",
    title: "Report Generation",
    desc: "Binding affinity and mutation-landscape charts are generated, then Gemma 4 interprets the data into a clinician-ready narrative highlighting the most actionable candidates.",
    gemma4: true,
  },
  {
    status: "designing",
    tag: "Codon-Optimized mRNA Assembly",
    title: "mRNA Vaccine Design",
    desc: "Top epitopes are back-translated using canine codon tables and assembled into a synthesis-ready construct with UTRs, Kozak sequence, and poly-A tail.",
  },
  {
    status: "completed",
    tag: "Pipeline Complete",
    title: "Results Ready",
    desc: "Your personalized vaccine design is complete. All artifacts are ready for review with your oncologist.",
  },
]

const STEP_EST: Partial<Record<CaseStatus, { label: string; maxSec: number }>> = {
  pending:   { label: "< 1 min",   maxSec: 60 },
  running:   { label: "10–15 min", maxSec: 900 },
  scoring:   { label: "1–3 min",   maxSec: 180 },
  reporting: { label: "2–5 min",   maxSec: 300 },
  designing: { label: "1–2 min",   maxSec: 120 },
}

// If no callback arrives within this long after the last update, treat as stalled
const STALE_TIMEOUT_SEC: Partial<Record<CaseStatus, number>> = {
  pending:   5 * 60,   // 5 min
  running:   30 * 60,  // 30 min — pVACseq can genuinely take 15 min
  scoring:   10 * 60,
  reporting: 15 * 60,
  designing: 10 * 60,
}

function isStale(caseData: Case, nowMs: number): boolean {
  if (caseData.status === "completed" || caseData.status === "failed") return false
  const limit = STALE_TIMEOUT_SEC[caseData.status]
  if (!limit) return false
  const sinceSec = (nowMs - new Date(caseData.updated_at).getTime()) / 1000
  return sinceSec > limit
}

function fmtElapsed(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}m ${s.toString().padStart(2, "0")}s` : `${s}s`
}

function fmtRemaining(elapsedSec: number, maxSec: number): string {
  const rem = maxSec - elapsedSec
  if (rem <= 0) return "finishing up…"
  const m = Math.floor(rem / 60)
  return m > 0 ? `~${m} min left` : `~${rem}s left`
}

type StepState = "done" | "active" | "upcoming" | "error"

function getProgress(caseData: Case): CaseStatus {
  if (caseData.status !== "failed") return caseData.status
  if (caseData.mrna_fasta) return "designing"
  if (caseData.clinical_report_md) return "reporting"
  if (caseData.candidates_json) return "scoring"
  return "running"
}

function getStepState(stepStatus: CaseStatus, caseData: Case, stale: boolean): StepState {
  if (caseData.status === "completed") return "done"
  const progress = getProgress(caseData)
  const stepIdx = PIPELINE_STAGES.indexOf(stepStatus)
  const currentIdx = PIPELINE_STAGES.indexOf(progress)
  if (stepIdx < currentIdx) return "done"
  if (stepIdx === currentIdx) return (caseData.status === "failed" || stale) ? "error" : "active"
  return "upcoming"
}

function stepHasArtifacts(stepStatus: CaseStatus, caseData: Case): boolean {
  if (stepStatus === "scoring") return !!caseData.candidates_json
  if (stepStatus === "reporting") return !!(caseData.clinical_report_md || caseData.binding_affinity_img_b64)
  if (stepStatus === "designing") return !!caseData.mrna_fasta
  return false
}

function Gemma4Badge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 shrink-0 whitespace-nowrap">
      ✦ Gemma 4
    </span>
  )
}

function StepIcon({ state }: { state: StepState }) {
  const base = "h-9 w-9 rounded-full flex items-center justify-center shrink-0 ring-4 ring-background"
  if (state === "done") {
    return (
      <div className={`${base} bg-emerald-500/10 border border-emerald-500/30`}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 7l3.5 3.5 5.5-6" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )
  }
  if (state === "active") {
    return (
      <div className={`${base} bg-primary/10 border border-primary/40`}>
        <span className="animate-spin text-base leading-none select-none" style={{ display: "inline-block" }}>🐾</span>
      </div>
    )
  }
  if (state === "error") {
    return (
      <div className={`${base} bg-destructive/10 border border-destructive/30`}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    )
  }
  return (
    <div className={`${base} bg-secondary/50 border border-border/40`}>
      <div className="h-2 w-2 rounded-full bg-border" />
    </div>
  )
}

/* ─── Markdown renderer ─── */

const mdComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-base font-bold mt-3 mb-2 text-foreground" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-sm font-bold mt-4 mb-1.5 text-foreground">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-xs font-semibold mt-3 mb-1 text-foreground">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm text-muted-foreground leading-relaxed mb-2">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="my-2 list-disc list-outside ml-4 space-y-1">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="my-2 list-decimal list-outside ml-4 space-y-1">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-sm text-muted-foreground">{children}</li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic text-muted-foreground/80">{children}</em>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="bg-secondary px-1 py-0.5 rounded text-xs font-mono text-primary">{children}</code>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-primary/30 pl-3 my-2 text-muted-foreground italic text-sm">{children}</blockquote>
  ),
  img: () => null,
  hr: () => <hr className="border-border/40 my-4" />,
}

/* ─── Artifact components ─── */

function CandidatesArtifact({ data }: { data: NonNullable<Case["candidates_json"]> }) {
  const [showAll, setShowAll] = useState(false)
  const top = data.top_candidates
  const shown = showAll ? top : top.slice(0, 5)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {[
          { value: data.total_mutations_analyzed.toLocaleString(), label: "mutations analyzed" },
          { value: data.candidates_after_filtering.toLocaleString(), label: "after filtering" },
          { value: top.length.toString(), label: "top candidates" },
        ].map(({ value, label }) => (
          <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
            <span className="text-sm font-bold text-primary">{value}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
      <CandidatesTable candidates={shown} />
      {top.length > 5 && (
        <button
          onClick={() => setShowAll((s) => !s)}
          className="w-full py-2 text-xs text-muted-foreground hover:text-foreground border border-border/40 rounded-xl transition-colors"
        >
          {showAll ? "Show fewer ↑" : `Show all ${top.length} candidates ↓`}
        </button>
      )}
    </div>
  )
}

function ChartsArtifact({
  bindingImg,
  mutationImg,
}: {
  bindingImg: string | null
  mutationImg: string | null
}) {
  const charts = [
    { key: "binding", label: "Binding Affinity (IC50)", img: bindingImg },
    { key: "mutation", label: "Mutation Landscape", img: mutationImg },
  ].filter((c) => c.img) as { key: string; label: string; img: string }[]

  if (charts.length === 0) return null

  return (
    <div className={`grid gap-3 ${charts.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
      {charts.map(({ key, label, img }) => (
        <div key={key} className="rounded-xl border border-border/40 bg-secondary/20 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">{label}</p>
          <Image
            src={`data:image/png;base64,${img}`}
            alt={label}
            width={400}
            height={280}
            className="w-full rounded-lg"
            unoptimized
          />
        </div>
      ))}
    </div>
  )
}

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function fileSlug(name: string) {
  return name.replace(/[^a-z0-9]+/gi, "_").toLowerCase()
}

function DownloadButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 bg-secondary/50 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 1v7M3 5.5l3 3 3-3M1.5 10h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </button>
  )
}

function ReportArtifact({ markdown, sampleName }: { markdown: string; sampleName: string }) {
  const [showFull, setShowFull] = useState(false)
  const PREVIEW = 800
  const isLong = markdown.length > PREVIEW
  const content = showFull ? markdown : markdown.slice(0, PREVIEW)

  return (
    <div className="rounded-xl border border-border/40 bg-card/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Clinical Report</p>
        <DownloadButton
          label="Download .md"
          onClick={() => downloadText(markdown, `${fileSlug(sampleName)}_clinical_report.md`)}
        />
      </div>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {content}
      </ReactMarkdown>
      {isLong && !showFull && <p className="text-muted-foreground/30 text-xs mt-1">…</p>}
      {isLong && (
        <button
          onClick={() => setShowFull((f) => !f)}
          className="mt-3 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          {showFull ? "Show less ↑" : "Read full report ↓"}
        </button>
      )}
    </div>
  )
}

function MRNAArtifact({ fasta, summary, sampleName }: { fasta: string; summary: string; sampleName: string }) {
  const [showFullFasta, setShowFullFasta] = useState(false)
  const [showFullSummary, setShowFullSummary] = useState(false)
  const [copied, setCopied] = useState(false)

  const lines = fasta.split("\n")
  const header = lines[0]
  const seqPreview = lines.slice(1, 3).join("\n")
  const isLong = lines.length > 3

  function copy() {
    navigator.clipboard.writeText(fasta)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/40 bg-secondary/20 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">mRNA Sequence (FASTA)</p>
          <div className="flex items-center gap-2">
            <DownloadButton
              label="Download .fasta"
              onClick={() => downloadText(fasta, `${fileSlug(sampleName)}_vaccine_mrna.fasta`)}
            />
            <button onClick={copy} className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
        </div>
        <pre className="text-xs font-mono text-primary leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
          {showFullFasta ? fasta : `${header}\n${seqPreview}${isLong ? "\n…" : ""}`}
        </pre>
        {isLong && (
          <button
            onClick={() => setShowFullFasta((f) => !f)}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showFullFasta ? "Show less ↑" : "Show full sequence ↓"}
          </button>
        )}
      </div>

      {summary && (
        <div className="rounded-xl border border-border/40 bg-card/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Synthesis Specification</p>
            <DownloadButton
              label="Download .md"
              onClick={() => downloadText(summary, `${fileSlug(sampleName)}_synthesis_spec.md`)}
            />
          </div>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {showFullSummary ? summary : summary.slice(0, 400)}
          </ReactMarkdown>
          {summary.length > 400 && (
            <button
              onClick={() => setShowFullSummary((f) => !f)}
              className="mt-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              {showFullSummary ? "Show less ↑" : "Read more ↓"}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function ArtifactSection({ stepStatus, caseData }: { stepStatus: CaseStatus; caseData: Case }) {
  if (stepStatus === "scoring" && caseData.candidates_json) {
    return <CandidatesArtifact data={caseData.candidates_json} />
  }
  if (stepStatus === "reporting") {
    return (
      <div className="space-y-4">
        <ChartsArtifact
          bindingImg={caseData.binding_affinity_img_b64}
          mutationImg={caseData.mutation_landscape_img_b64}
        />
        {caseData.clinical_report_md && (
          <ReportArtifact markdown={caseData.clinical_report_md} sampleName={caseData.sample_name} />
        )}
      </div>
    )
  }
  if (stepStatus === "designing" && caseData.mrna_fasta) {
    return (
      <MRNAArtifact
        fasta={caseData.mrna_fasta}
        summary={caseData.mrna_summary_md ?? ""}
        sampleName={caseData.sample_name}
      />
    )
  }
  return null
}

/* ─── Main export ─── */

export function PipelineTimeline({ caseData }: { caseData: Case }) {
  const [collapsedArtifacts, setCollapsedArtifacts] = useState<Set<string>>(new Set())
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (caseData.status === "completed" || caseData.status === "failed") return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [caseData.status])

  function toggleArtifact(key: string) {
    setCollapsedArtifacts((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const stale = isStale(caseData, now)

  return (
    <div>
      {STEPS.map((step, idx) => {
        const state = getStepState(step.status, caseData, stale)
        const isLast = idx === STEPS.length - 1
        const showArtifacts = state === "done" && stepHasArtifacts(step.status, caseData)
        const artifactKey = `artifact-${step.status}`
        const artifactsOpen = !collapsedArtifacts.has(artifactKey)

        return (
          <div key={step.status} className="flex gap-4 sm:gap-5">
            {/* Timeline track */}
            <div className="flex flex-col items-center">
              <div className="pt-4">
                <StepIcon state={state} />
              </div>
              {!isLast && (
                <div
                  className={`w-px flex-1 mt-2 min-h-8 ${
                    state === "done" ? "bg-emerald-500/25" : "bg-border/20"
                  }`}
                />
              )}
            </div>

            {/* Step card */}
            <div
              className={`flex-1 mb-4 rounded-2xl transition-all duration-300 border border-l-2 ${
                state === "done"
                  ? "border-emerald-500/15 border-l-emerald-500/50 bg-card/60"
                  : state === "active"
                  ? "border-primary/20 border-l-primary bg-card shadow-xl shadow-primary/5"
                  : state === "error"
                  ? "border-destructive/20 border-l-destructive bg-card/60"
                  : "border-border/10 border-l-transparent bg-card/20 opacity-40"
              } p-5`}
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-0.5">
                    {step.tag}
                  </p>
                  <h3
                    className="font-bold text-base text-foreground leading-snug"
                    style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
                  >
                    {step.title}
                  </h3>
                </div>
                {step.gemma4 && state !== "upcoming" && <Gemma4Badge />}
              </div>

              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>

              {/* Active: elapsed + estimated remaining */}
              {state === "active" && (() => {
                const est = STEP_EST[step.status]
                const elapsedSec = Math.max(0, Math.floor((now - new Date(caseData.updated_at).getTime()) / 1000))
                return (
                  <div className="mt-3 flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      <span className="text-xs text-primary/80 font-medium">In progress</span>
                    </div>
                    {est && (
                      <span className="text-xs text-muted-foreground/60 tabular-nums">
                        {fmtElapsed(elapsedSec)} elapsed · {fmtRemaining(elapsedSec, est.maxSec)}
                      </span>
                    )}
                  </div>
                )
              })()}

              {/* Upcoming: estimated duration */}
              {state === "upcoming" && STEP_EST[step.status] && (
                <p className="mt-2 text-xs text-muted-foreground/40">
                  est. {STEP_EST[step.status]!.label}
                </p>
              )}

              {/* Error state */}
              {state === "error" && (
                <div className="mt-3 space-y-3">
                  <div className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 leading-relaxed">
                    {stale && !caseData.error_message
                      ? "The pipeline stopped responding. This is likely a server-side failure — no action needed on your end."
                      : (caseData.error_message ?? "An unexpected error occurred during this step.")}
                  </div>
                  <Link
                    href="/submit"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    ↩ Re-submit case
                  </Link>
                </div>
              )}

              {/* Artifacts */}
              {showArtifacts && (
                <div className="mt-4 pt-4 border-t border-border/30">
                  <button
                    onClick={() => toggleArtifact(artifactKey)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3"
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      className={`transition-transform duration-200 ${artifactsOpen ? "rotate-90" : ""}`}
                    >
                      <path d="M3 1.5l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {artifactsOpen ? "Hide artifacts" : "Show artifacts"}
                  </button>
                  {artifactsOpen && <ArtifactSection stepStatus={step.status} caseData={caseData} />}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
