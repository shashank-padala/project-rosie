"use client"

import { useMemo, useState } from "react"
import type { Candidate } from "@/types/case"
import {
  applySensitivity,
  DEFAULT_THRESHOLDS,
  type Thresholds,
} from "@/lib/sensitivity"

interface Props {
  candidates: Candidate[]
  caseId: string
}

// IC50 slider uses log scale (50 → 1000 nM). VAF slider linear (0.01 → 0.50).
const IC50_LOG_MIN = Math.log10(50)
const IC50_LOG_MAX = Math.log10(1000)
function ic50FromSlider(v: number): number {
  return Math.round(Math.pow(10, IC50_LOG_MIN + (v / 100) * (IC50_LOG_MAX - IC50_LOG_MIN)))
}
function sliderFromIc50(nm: number): number {
  return Math.round(((Math.log10(nm) - IC50_LOG_MIN) / (IC50_LOG_MAX - IC50_LOG_MIN)) * 100)
}

export function SensitivityPanel({ candidates, caseId }: Props) {
  const [open, setOpen] = useState(false)
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS)
  const [narrative, setNarrative] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const result = useMemo(() => applySensitivity(candidates, thresholds), [candidates, thresholds])

  const isDefault =
    thresholds.ic50_max === DEFAULT_THRESHOLDS.ic50_max &&
    thresholds.vaf_min === DEFAULT_THRESHOLDS.vaf_min

  function reset() {
    setThresholds(DEFAULT_THRESHOLDS)
    setNarrative("")
  }

  async function askGemma() {
    setLoading(true)
    setNarrative("")
    try {
      const res = await fetch(`/api/cases/${caseId}/sensitivity-narrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thresholds,
          defaults: result.defaults,
          kept: result.kept,
          dropped: result.dropped,
        }),
      })
      const data = await res.json().catch(() => ({ narrative: "" }))
      setNarrative(typeof data.narrative === "string" ? data.narrative : "")
    } catch {
      setNarrative("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border/40 bg-secondary/10 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-2.5 text-left">
          <span className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 11l3-3 2 2 5-5" />
              <path d="M9 5h3v3" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">What if you adjusted the thresholds?</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">
              Move the sliders to re-rank candidates. Ask Gemma to interpret the change.
            </p>
          </div>
        </div>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`text-muted-foreground/60 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M3 4.5l3 3 3-3" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border/30">
          {/* Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground">IC50 maximum</label>
                <span className="text-xs font-mono text-primary">
                  {thresholds.ic50_max} nM
                  {!isDefault && thresholds.ic50_max !== DEFAULT_THRESHOLDS.ic50_max && (
                    <span className="text-muted-foreground/50 ml-1">(default {DEFAULT_THRESHOLDS.ic50_max})</span>
                  )}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={sliderFromIc50(thresholds.ic50_max)}
                onChange={(e) => setThresholds({ ...thresholds, ic50_max: ic50FromSlider(Number(e.target.value)) })}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground/50 mt-0.5">
                <span>50 (strong only)</span>
                <span>1000 (lenient)</span>
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground">Tumor VAF minimum</label>
                <span className="text-xs font-mono text-primary">
                  {thresholds.vaf_min.toFixed(2)}
                  {!isDefault && thresholds.vaf_min !== DEFAULT_THRESHOLDS.vaf_min && (
                    <span className="text-muted-foreground/50 ml-1">(default {DEFAULT_THRESHOLDS.vaf_min.toFixed(2)})</span>
                  )}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                value={Math.round(thresholds.vaf_min * 100)}
                onChange={(e) => setThresholds({ ...thresholds, vaf_min: Number(e.target.value) / 100 })}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground/50 mt-0.5">
                <span>0.01 (any)</span>
                <span>0.50 (clonal only)</span>
              </div>
            </div>
          </div>

          {/* Live counters */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-400 leading-none">{result.kept.length}</span>
                <span className="text-[11px] text-muted-foreground">kept</span>
              </div>
              <p className="text-[11px] text-muted-foreground/80 mt-1.5 leading-snug truncate" title={result.kept.map((c) => c.peptide).join(", ")}>
                {result.kept.length === 0 ? "—" : result.kept.map((c) => `${c.peptide} (${c.gene})`).join(", ")}
              </p>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-400 leading-none">{result.dropped.length}</span>
                <span className="text-[11px] text-muted-foreground">dropped vs. defaults</span>
              </div>
              <p className="text-[11px] text-muted-foreground/80 mt-1.5 leading-snug truncate" title={result.dropped.map((c) => c.peptide).join(", ")}>
                {result.dropped.length === 0 ? "—" : result.dropped.map((c) => `${c.peptide} (${c.gene})`).join(", ")}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={askGemma}
              disabled={loading || isDefault}
              className="h-8 px-3 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin text-sm leading-none">🐾</span>
                  <span>Asking Gemma…</span>
                </>
              ) : (
                <>Ask Gemma to interpret</>
              )}
            </button>
            {!isDefault && (
              <button
                onClick={reset}
                className="h-8 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Reset to defaults
              </button>
            )}
            {isDefault && (
              <span className="text-[11px] text-muted-foreground/60 italic">Move a slider to enable interpretation</span>
            )}
          </div>

          {/* Narrative result */}
          {narrative && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-1.5">Gemma 4 · Sensitivity read</p>
              <p className="text-sm text-foreground/90 leading-relaxed">{narrative}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
