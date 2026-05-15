"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/* ─── types ─────────────────────────────────────────────────────── */
type StageState = "pending" | "running" | "done"
type SimPhase = "idle" | "running" | "done"

/* ─── static data ────────────────────────────────────────────────── */
const STAGES = [
  {
    statusKey: "running",
    label: "Neoantigen Prediction",
    detail: "VEP v115 · CanFam4 ROS_Cfam_1.0 · pVACseq + NetMHCpan + IEDB API · DLA-8850101 + DLA-8850801 · 8–11mer peptides",
    est: "10–15 min",
    gemmaRole: false,
  },
  {
    statusKey: "scoring",
    label: "Candidate Ranking",
    detail: "IC50 < 500 nM filter · VAF-weighted composite score · Top 20 candidates → JSON · auditable ~50-line script",
    est: "1–3 min",
    gemmaRole: false,
  },
  {
    statusKey: "reporting",
    label: "Report Generation",
    detail: "Binding affinity + mutation landscape charts → GCS · Gemma 4 reads JSON + 2 PNGs multimodally → 400–600 word species-aware clinical report",
    est: "2–5 min",
    gemmaRole: true,
  },
  {
    statusKey: "designing",
    label: "mRNA Vaccine Design",
    detail: "Biopython · canine codon table · 5′UTR + Kozak + AAY linkers + poly-A(60) · Synthesis spec via Jinja template (not LLM-generated)",
    est: "1–2 min",
    gemmaRole: false,
  },
] as const

const ROLES = [
  {
    badge: "Role 1 · Pre-flight · Proactive",
    title: "VCF Advisor",
    desc: "Browser sends VCF structural facts → 0–3 issues (info/warning/critical) as strict JSON · zod safe-parse · never blocks submit",
    quote: '"This VCF has no SOMATIC flag and no NORMAL column — it looks like germline + somatic mixed. That will inflate your candidate count. Recommend re-running with a matched-normal caller."',
    activeOnStage: -1,
  },
  {
    badge: "Role 2 · Post-pipeline · Vision",
    title: "Multimodal Report Writer",
    desc: "Reads candidates JSON + binding-affinity bar chart + mutation-landscape pie (both PNGs as images, not OCR) · species-aware prompt (DLA/HLA/FLA)",
    quote: '"Only role a text-only model cannot perform — it must see the chart distributions to contextualize the IC50 spread and call out the dominant mutation pathway."',
    activeOnStage: 2,
  },
  {
    badge: "Role 3 · Interactive · On demand",
    title: "Sensitivity Narrator",
    desc: "IC50 + VAF sliders re-rank client-side instantly (no Gemma cost per tick) · on explicit click, Gemma narrates the kept/dropped tradeoff in plain English",
    quote: '"Increasing binding stringency filters out your TP53 candidate, leaving only the PIK3CA peptide. This narrows your pool and results in loss of essential TP53 coverage."',
    activeOnStage: -1,
  },
  {
    badge: "Role 4 · Reactive · Conversational",
    title: "Case Assistant",
    desc: "Floating chat widget · full case context in system prompt every message · plain-language Q&A for veterinary oncologists",
    quote: '"What does IC50 mean for Rosie\'s vaccine?" answered in seconds with the actual candidate data in context.',
    activeOnStage: -1,
  },
] as const

const OUTPUTS = [
  {
    label: "Ranked Candidates",
    title: "Neoantigen List",
    detail: "Top 20 · JSON · IC50 + VAF composite score",
    example: "MPMCEFDMVK · IC50 128 nM · DLA-8850801 · PIK3CA V125M",
    color: "blue",
  },
  {
    label: "Gemma Output",
    title: "Clinical Report",
    detail: "400–600 words · plain language · species-aware · multimodal input (true vision, not OCR)",
    example: null,
    color: "amber",
  },
  {
    label: "Sequence File",
    title: "mRNA Vaccine",
    detail: "FASTA · ~251 nt · 54.8% GC (CDS) · canine codon table",
    example: "5′UTR + Kozak + CDS + AAY linkers + 3′UTR + poly-A(60)",
    color: "purple",
  },
  {
    label: "Deterministic",
    title: "Synthesis Spec",
    detail: "PDF · Jinja2 template — not LLM-generated · CleanCap® AG cap1 · 100% m1Ψ · SM-102 LNP · RIN ≥ 8.0",
    example: '"AI for interpretation, deterministic code for compliance."',
    color: "green",
  },
] as const

/* ─── timing constants (ms from sim start) ──────────────────────── */
const T = {
  browserFlash: 150,
  gcsFlash: 500,
  apiFlash: 780,
  pipelineGlow: 980,
  s0start: 1150, s0end: 2500, cb0: 2600,
  s1start: 2750, s1end: 3700, cb1: 3800,
  s2start: 3950, gemmaGlow: 4180, s2end: 5350, cb2: 5450,
  s3start: 5600, s3end: 6350, cb3: 6450,
  out0: 6650, out1: 6820, out2: 6990, out3: 7160,
  done: 7500,
}

/* ─── helpers ────────────────────────────────────────────────────── */
const outColorMap = {
  blue:   { card: "border-blue-200/60 bg-blue-50/60",     label: "text-blue-600" },
  amber:  { card: "border-amber-200/60 bg-amber-50/60",   label: "text-amber-600" },
  purple: { card: "border-purple-200/60 bg-purple-50/60", label: "text-purple-600" },
  green:  { card: "border-emerald-200/60 bg-emerald-50/60", label: "text-emerald-600" },
}

/* ═══════════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════════ */
export default function ArchitecturePage() {
  const [stages, setStages] = useState<StageState[]>(["pending", "pending", "pending", "pending"])
  const [simPhase, setSimPhase] = useState<SimPhase>("idle")
  const [gemmaActive, setGemmaActive] = useState(false)
  const [activeRole, setActiveRole] = useState<number | null>(null)
  const [cbVisible, setCbVisible] = useState(false)
  const [cbText, setCbText] = useState("")
  const [pipelineGlow, setPipelineGlow] = useState(false)
  const [outputsVisible, setOutputsVisible] = useState([false, false, false, false])
  const [hoveredRole, setHoveredRole] = useState<number | null>(null)

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms))
  }, [])

  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  const fireCallback = useCallback((text: string) => {
    setCbText(text)
    setCbVisible(true)
    later(900, () => setCbVisible(false))
  }, [later])

  const setStage = useCallback((idx: number, state: StageState) => {
    setStages(prev => { const next = [...prev]; next[idx] = state; return next })
  }, [])

  const runSim = useCallback(() => {
    if (simPhase === "running") return
    clearAll()

    // reset
    setStages(["pending", "pending", "pending", "pending"])
    setGemmaActive(false)
    setActiveRole(null)
    setPipelineGlow(false)
    setOutputsVisible([false, false, false, false])
    setCbVisible(false)

    setSimPhase("running")

    later(T.pipelineGlow, () => setPipelineGlow(true))

    later(T.s0start, () => setStage(0, "running"))
    later(T.s0end,   () => { setStage(0, "done"); fireCallback("→ scoring") })

    later(T.s1start, () => setStage(1, "running"))
    later(T.s1end,   () => { setStage(1, "done"); fireCallback("→ reporting") })

    later(T.s2start, () => setStage(2, "running"))
    later(T.gemmaGlow, () => { setGemmaActive(true); setActiveRole(1) })
    later(T.s2end,   () => {
      setStage(2, "done")
      fireCallback("→ designing")
      setGemmaActive(false)
      setActiveRole(null)
    })

    later(T.s3start, () => setStage(3, "running"))
    later(T.s3end,   () => {
      setStage(3, "done")
      fireCallback("→ completed")
      setPipelineGlow(false)
    })

    later(T.out0, () => setOutputsVisible(v => [true, v[1], v[2], v[3]]))
    later(T.out1, () => setOutputsVisible(v => [v[0], true, v[2], v[3]]))
    later(T.out2, () => setOutputsVisible(v => [v[0], v[1], true, v[3]]))
    later(T.out3, () => setOutputsVisible(v => [v[0], v[1], v[2], true]))

    later(T.done, () => setSimPhase("done"))
  }, [simPhase, clearAll, later, fireCallback, setStage])

  // Show outputs on first mount
  useEffect(() => {
    const t = setTimeout(() => {
      setOutputsVisible([true, true, true, true])
    }, 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {/* ── Keyframe styles ── */}
      <style>{`
        @keyframes flow-r { from { stroke-dashoffset: 18 } to { stroke-dashoffset: 0 } }
        @keyframes flow-l { from { stroke-dashoffset: 0 }  to { stroke-dashoffset: 18 } }
        @keyframes flow-arc { from { stroke-dashoffset: 50 } to { stroke-dashoffset: 0 } }
        @keyframes dot-pulse { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.9); opacity: .45 } }
        @keyframes cb-pop {
          0%   { opacity: 0; transform: translateY(4px) scale(0.9) }
          20%  { opacity: 1; transform: translateY(0) scale(1) }
          70%  { opacity: 1 }
          100% { opacity: 0; transform: translateY(-4px) }
        }
        .flow-r   { stroke-dasharray: 5 4; animation: flow-r   .55s linear infinite }
        .flow-l   { stroke-dasharray: 5 4; animation: flow-l   .55s linear infinite }
        .flow-arc { stroke-dasharray: 8 5; animation: flow-arc .90s linear infinite }
        .flow-arc-rev { stroke-dasharray: 8 5; animation: flow-arc .90s linear infinite reverse }
        .dot-running { animation: dot-pulse .65s ease-in-out infinite }
      `}</style>

      <div className="max-w-[1400px] mx-auto w-full px-5 sm:px-6 pt-10 pb-16 overflow-x-auto">

        {/* ── Page header ── */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-amber-600/80 mb-1.5">
              System Architecture · v1.0
            </p>
            <h1
              className="text-3xl font-bold mb-1.5"
              style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
            >
              Project Rosie
            </h1>
            <p className="text-sm text-muted-foreground">
              Personalized cancer vaccine pipeline · software intelligence layer
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex flex-wrap gap-1.5 justify-end">
              {["Vertex AI", "Cloud Run", "Supabase"].map(b => (
                <Badge key={b} variant="outline" className="text-[10px] font-medium tracking-wide">{b}</Badge>
              ))}
              <Badge variant="outline" className="text-[10px] font-medium text-purple-600 border-purple-300/60 bg-purple-50/60 tracking-wide">
                gemma-4-26b-a4b-it-maas
              </Badge>
              <Badge variant="outline" className="text-[10px] font-medium text-amber-600 border-amber-300/60 bg-amber-50/60 tracking-wide">
                Gemma4Good
              </Badge>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Button
                onClick={runSim}
                disabled={simPhase === "running"}
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-white border-0 font-mono text-xs tracking-wide shadow-sm"
              >
                {simPhase === "running" ? "⏳ Running…" : simPhase === "done" ? "▶ Run Again" : "▶ Simulate Pipeline Run"}
              </Button>
              <p className="text-[10px] text-muted-foreground/60">Watch a VCF flow end-to-end</p>
            </div>
          </div>
        </div>

        {/* ── 4-column grid ── */}
        <p className="text-[9px] font-semibold tracking-[.12em] uppercase text-muted-foreground/60 mb-2">
          System Layers
        </p>
        <div className="grid grid-cols-4 gap-2.5 min-w-[900px]">

          {/* ── Col 1: Browser ── */}
          <div className="rounded-xl border border-blue-200/60 bg-gradient-to-b from-blue-50/50 to-white/0 p-3.5 flex flex-col gap-2.5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-400 rounded-t-xl" />
            <p className="text-[8.5px] font-semibold tracking-[.12em] uppercase text-blue-500">Browser / Vet Clinic</p>
            <div>
              <p className="font-bold text-[13px] text-foreground" style={{ fontFamily: "var(--font-dm-sans)" }}>Next.js 16</p>
              <p className="text-[9px] text-muted-foreground">App Router · Deployed on Vercel</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {["Upload VCF", "Pipeline Timeline", "Case Dashboard", "Report Viewer", "Sensitivity Sliders", "Chat Widget"].map(t => (
                <span key={t} className="text-[9px] font-medium px-1.5 py-0.5 rounded border border-blue-200/60 text-blue-700 bg-blue-50/80">{t}</span>
              ))}
            </div>
            <div className="mt-auto flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-blue-50 border border-blue-200/60 text-[9px] text-blue-700">
              <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
                <rect x="1" y="4.5" width="9" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.1"/>
                <path d="M3.5 4.5V3.2a2 2 0 014 0v1.3" stroke="currentColor" strokeWidth="1.1"/>
              </svg>
              Supabase Auth · email/password · RLS
            </div>
          </div>

          {/* ── Col 2: Platform ── */}
          <div className="rounded-xl border border-emerald-200/60 bg-gradient-to-b from-emerald-50/50 to-white/0 p-3.5 flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-t-xl" />
            <p className="text-[8.5px] font-semibold tracking-[.12em] uppercase text-emerald-600">Platform</p>
            <div>
              <p className="font-bold text-[13px] text-foreground" style={{ fontFamily: "var(--font-dm-sans)" }}>API + Storage</p>
            </div>

            {/* Callback badge */}
            <div className="relative">
              <span className={cn(
                "absolute right-0 -top-1 text-[8px] font-semibold tracking-wide px-2 py-0.5 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700 transition-all pointer-events-none z-10",
                cbVisible ? "opacity-100" : "opacity-0"
              )}
                style={cbVisible ? { animation: "cb-pop .9s ease-out forwards" } : undefined}
              >
                {cbText}
              </span>
            </div>

            <div className="rounded-lg border border-emerald-100 bg-white/50 p-2">
              <p className="text-[10px] font-semibold text-emerald-700 mb-1.5">Next.js API Routes</p>
              <div className="flex flex-wrap gap-1">
                {["POST /api/cases", "POST /pipeline/callback", "POST /api/gemma/*"].map(r => (
                  <span key={r} className="text-[8.5px] font-medium px-1.5 py-0.5 rounded border border-emerald-200/60 text-emerald-700 bg-emerald-50/80 font-mono">{r}</span>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-white/50 p-2">
              <p className="text-[10px] font-semibold text-emerald-700 mb-1">Google Cloud Storage</p>
              <p className="text-[9px] text-muted-foreground">VCF uploads (resumable) · pipeline outputs + PNG charts · 30-day lifecycle · us-central1</p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-white/50 p-2">
              <p className="text-[10px] font-semibold text-emerald-700 mb-1">Supabase</p>
              <p className="text-[9px] text-muted-foreground">PostgreSQL · Realtime subscriptions · RLS<br/>Receives per-stage callbacks → pushes to browser</p>
            </div>
          </div>

          {/* ── Col 3: Cloud Run Pipeline ── */}
          <div className={cn(
            "rounded-xl border p-3.5 flex flex-col gap-2 relative overflow-hidden transition-all duration-500",
            pipelineGlow
              ? "border-purple-400/60 bg-gradient-to-b from-purple-50/80 to-white/0 shadow-md shadow-purple-100"
              : "border-purple-200/60 bg-gradient-to-b from-purple-50/40 to-white/0"
          )}>
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-purple-400 rounded-t-xl" />
            <p className="text-[8.5px] font-semibold tracking-[.12em] uppercase text-purple-500">Cloud Run Job</p>
            <div>
              <p className="font-bold text-[13px] text-foreground" style={{ fontFamily: "var(--font-dm-sans)" }}>Pipeline</p>
              <p className="text-[9px] text-muted-foreground">4 stages · 5 status callbacks</p>
            </div>

            {STAGES.map((stage, idx) => {
              const s = stages[idx]
              return (
                <div key={stage.statusKey} className={cn(
                  "rounded-lg border-l-2 px-2.5 py-2 transition-all duration-400",
                  s === "pending" && "border-l-purple-300/50 bg-purple-50/30",
                  s === "running" && "border-l-purple-500 bg-purple-100/60",
                  s === "done"    && "border-l-emerald-400 bg-emerald-50/50",
                )}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-300",
                      s === "pending" && "bg-muted-foreground/30",
                      s === "running" && "bg-purple-500 dot-running",
                      s === "done"    && "bg-emerald-500",
                    )} />
                    <span className={cn(
                      "text-[8px] font-semibold tracking-widest uppercase transition-colors",
                      s === "pending" && "text-muted-foreground/50",
                      s === "running" && "text-purple-600",
                      s === "done"    && "text-emerald-600",
                    )}>
                      {stage.statusKey}
                    </span>
                    <span className="ml-auto text-[8px] text-muted-foreground/50">{stage.est}</span>
                  </div>
                  <p className={cn(
                    "text-[11px] font-semibold mb-0.5 transition-colors",
                    s === "done" ? "text-emerald-700" : "text-foreground"
                  )} style={{ fontFamily: "var(--font-dm-sans)" }}>
                    {stage.label}
                    {stage.gemmaRole && (
                      <span className="ml-1.5 text-[8px] font-semibold text-amber-600/80">✦ Gemma</span>
                    )}
                  </p>
                  <p className="text-[8.5px] text-muted-foreground leading-relaxed">{stage.detail}</p>
                </div>
              )
            })}

            <div className="mt-auto rounded-lg border border-purple-200/60 bg-purple-50/60 px-2.5 py-1.5 text-[8.5px] text-purple-700 leading-relaxed">
              4 vCPU / 8 GiB / 3h timeout · us-central1 · service-account auth
            </div>
          </div>

          {/* ── Col 4: Gemma 4 ── */}
          <div className={cn(
            "rounded-xl border p-3.5 flex flex-col gap-2 relative overflow-hidden transition-all duration-500",
            gemmaActive
              ? "border-amber-400/70 bg-gradient-to-b from-amber-50/80 to-white/0 shadow-md shadow-amber-100"
              : "border-amber-200/60 bg-gradient-to-b from-amber-50/40 to-white/0"
          )}>
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-400 rounded-t-xl" />
            <p className="text-[8.5px] font-semibold tracking-[.12em] uppercase text-amber-600">Gemma 4 · Vertex AI Global Endpoint</p>
            <div>
              <p className="font-bold text-[13px] text-foreground" style={{ fontFamily: "var(--font-dm-sans)" }}>AI Roles</p>
              <p className="text-[9px] text-muted-foreground">256K context · multimodal vision · 4 functions</p>
            </div>

            {ROLES.map((role, idx) => (
              <div
                key={idx}
                className={cn(
                  "rounded-lg border px-2.5 py-2 cursor-default transition-all duration-300",
                  (activeRole === idx || hoveredRole === idx)
                    ? "border-amber-400/60 bg-amber-100/70"
                    : "border-amber-200/50 bg-amber-50/50 hover:border-amber-300/60 hover:bg-amber-50/80"
                )}
                onMouseEnter={() => setHoveredRole(idx)}
                onMouseLeave={() => setHoveredRole(null)}
              >
                <p className="text-[8px] font-semibold tracking-wider uppercase text-amber-600/70 mb-1">{role.badge}</p>
                <p className="text-[11px] font-semibold text-amber-900 mb-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>
                  {role.title}
                </p>
                <p className="text-[8.5px] text-muted-foreground leading-relaxed">{role.desc}</p>
                {hoveredRole === idx && (
                  <div className="mt-1.5 border-l-2 border-amber-300 pl-2 text-[8.5px] italic text-amber-800/70 leading-relaxed">
                    {role.quote}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Arrow band ── */}
        <div className="relative h-[72px] min-w-[900px] my-1">
          <svg
            viewBox="0 0 1000 72"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full overflow-visible"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {[
                ["ah-blue",     "#3b82f6"],
                ["ah-green",    "#10b981"],
                ["ah-purple",   "#9b73e8"],
                ["ah-amber",    "#f59e0b"],
                ["ah-green-r",  "#10b981", true],
                ["ah-amber-r",  "#f59e0b", true],
              ].map(([id, color, rev]) => (
                <marker key={id as string} id={id as string} viewBox="0 0 10 10"
                  refX={rev ? "2" : "8"} refY="5" markerWidth="5" markerHeight="5" orient="auto">
                  <path d={rev ? "M8 1L2 5L8 9" : "M2 1L8 5L2 9"} fill="none"
                    stroke={color as string} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </marker>
              ))}
            </defs>

            {/* ① Browser → Platform */}
            <line className="flow-r" x1="218" y1="14" x2="282" y2="14"
              stroke="#3b82f6" strokeWidth="1.5" markerEnd="url(#ah-blue)"/>
            <text x="250" y="9" textAnchor="middle" fontSize="8.5" fill="#3b82f6"
              fontFamily="var(--font-geist-mono),monospace">API calls</text>

            {/* ② Platform → Browser: Realtime */}
            <line className="flow-l" x1="282" y1="26" x2="220" y2="26"
              stroke="#10b981" strokeWidth="1.2" markerEnd="url(#ah-green-r)"/>
            <text x="250" y="40" textAnchor="middle" fontSize="8.5" fill="#10b981"
              fontFamily="var(--font-geist-mono),monospace">Realtime ↺</text>

            {/* ③ Platform → Cloud Run */}
            <line className="flow-r" x1="467" y1="14" x2="533" y2="14"
              stroke="#9b73e8" strokeWidth="1.5" markerEnd="url(#ah-purple)"/>
            <text x="500" y="9" textAnchor="middle" fontSize="8.5" fill="#9b73e8"
              fontFamily="var(--font-geist-mono),monospace">job trigger</text>

            {/* ④ Cloud Run → Supabase callbacks */}
            <path className="flow-arc-rev" d="M 533 30 Q 500 50 467 30"
              fill="none" stroke="#10b981" strokeWidth="1.2" markerEnd="url(#ah-green-r)"/>
            <text x="500" y="56" textAnchor="middle" fontSize="8.5" fill="#10b981"
              fontFamily="var(--font-geist-mono),monospace">stage callbacks</text>

            {/* ⑤ Cloud Run → Gemma */}
            <line className="flow-r" x1="718" y1="14" x2="782" y2="14"
              stroke="#f59e0b" strokeWidth="1.5" markerEnd="url(#ah-amber)"/>
            <text x="750" y="9" textAnchor="middle" fontSize="8.5" fill="#f59e0b"
              fontFamily="var(--font-geist-mono),monospace">JSON + PNG</text>

            {/* ⑥ Browser ↔ Gemma long arcs */}
            <path className="flow-arc" d="M 218 48 Q 500 68 782 48"
              fill="none" stroke="#f59e0b" strokeWidth="1.2" markerEnd="url(#ah-amber)"/>
            <path className="flow-arc-rev" d="M 782 56 Q 500 72 218 56"
              fill="none" stroke="#f59e0b" strokeWidth="1" markerEnd="url(#ah-amber-r)"/>
            <text x="500" y="70" textAnchor="middle" fontSize="8" fill="#f59e0b"
              fontFamily="var(--font-geist-mono),monospace">pre-flight · sensitivity · chat (bidirectional)</text>
          </svg>
        </div>

        {/* ── Outputs ── */}
        <p className="text-[9px] font-semibold tracking-[.12em] uppercase text-muted-foreground/60 mb-2">
          Pipeline Outputs
        </p>
        <div className="grid grid-cols-4 gap-2.5 min-w-[900px]">
          {OUTPUTS.map((out, idx) => {
            const colors = outColorMap[out.color]
            return (
              <div key={idx} className={cn(
                "rounded-xl border p-3 transition-all duration-500",
                colors.card,
                outputsVisible[idx] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
                style={{ transitionDelay: `${idx * 60}ms` }}
              >
                <p className={cn("text-[8px] font-semibold tracking-widest uppercase mb-1.5", colors.label)}>
                  {out.label}
                </p>
                <p className="text-[12px] font-bold text-foreground mb-1" style={{ fontFamily: "var(--font-dm-sans)" }}>
                  {out.title}
                </p>
                <p className="text-[9px] text-muted-foreground leading-relaxed">{out.detail}</p>
                {out.example && (
                  <p className="mt-2 text-[9px] font-mono px-2 py-1.5 rounded-md bg-white/60 border border-white/80 text-muted-foreground">
                    {out.example}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Footer ── */}
        <div className="mt-6 pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] text-muted-foreground">
            <span className="font-semibold text-foreground" style={{ fontFamily: "var(--font-dm-sans)" }}>rosie.kiraklabs.com</span>
            {" · "} ~1 hour end-to-end
            {" · "} ~$15/case
            {" · "} <span className="text-muted-foreground/60">191,645 epitopes → 1,648 after IC50 filter → top 20 ranked</span>
          </p>
          <div className="flex gap-1.5">
            <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300/60 bg-amber-50/60">Gemma4Good</Badge>
            <Badge variant="outline" className="text-[9px]">Veterinary oncology</Badge>
            <Badge variant="outline" className="text-[9px]">Personalized medicine</Badge>
          </div>
        </div>
      </div>
    </>
  )
}
