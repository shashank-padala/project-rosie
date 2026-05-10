"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { VcfAdvisor } from "@/components/VcfAdvisor"
import { createClient } from "@/lib/supabase/client"

const PRESET_ALLELES: Record<string, string> = {
  "Human MHC-I (common)": "HLA-A*02:01,HLA-A*01:01,HLA-B*07:02",
  "Canine DLA (common)":   "DLA-8850101,DLA-8850801",
}

const SPECIES_DEFAULT_ALLELES: Record<string, string> = {
  canis_lupus_familiaris: "DLA-8850101,DLA-8850801",
  homo_sapiens:           "HLA-A*02:01,HLA-A*01:01,HLA-B*07:02",
}

const STEPS = ["Patient info", "Alleles", "Upload & Submit"]

export default function SubmitPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [sampleName, setSampleName] = useState("")
  const [species, setSpecies] = useState("canis_lupus_familiaris")
  const [alleles, setAlleles] = useState(SPECIES_DEFAULT_ALLELES["canis_lupus_familiaris"])
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploadPhase, setUploadPhase] = useState<"idle" | "uploading" | "submitting">("idle")

  useEffect(() => {
    setAlleles(SPECIES_DEFAULT_ALLELES[species] ?? "")
  }, [species])

  async function safeJson(res: Response) {
    const text = await res.text()
    if (!text) throw new Error(`Server error ${res.status} (empty response)`)
    try {
      return JSON.parse(text)
    } catch {
      throw new Error(`Server error ${res.status}: ${text.slice(0, 200)}`)
    }
  }

  async function handleSubmit() {
    if (!file) { setError("Please select a VCF file first"); return }
    setError("")
    setLoading(true)
    try {
      setUploadPhase("uploading")
      const formData = new FormData()
      formData.append("file", file!)
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
      const uploadData = await safeJson(uploadRes)
      if (!uploadRes.ok) throw new Error(uploadData.error ?? "Upload failed")

      setUploadPhase("submitting")
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sample_name: sampleName,
          species,
          alleles: alleles.split(",").map((a) => a.trim()).filter(Boolean),
          gcs_vcf_path: uploadData.gcsPath,
        }),
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.error ?? "Submission failed")
      router.push(`/cases/${data.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
      setLoading(false)
      setUploadPhase("idle")
    }
  }

  return (
    <div className="max-w-xl mx-auto w-full px-5 sm:px-6 pt-10 pb-12">
      {/* Header */}
      <div className="mb-7">
        <h1
          className="text-2xl font-bold mt-3 mb-1"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          New Case
        </h1>
        <p className="text-muted-foreground text-sm">Submit a tumor VCF to start the pipeline</p>
      </div>

      {/* How VCFs are produced — educational context */}
      <details className="mb-7 group rounded-2xl border border-border/40 bg-card overflow-hidden">
        <summary className="flex items-center justify-between gap-3 px-5 py-3.5 cursor-pointer list-none hover:bg-secondary/30 transition-colors">
          <div className="flex items-center gap-2.5">
            <span className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7" cy="7" r="5.5" />
                <path d="M7 4.5v3M7 9.5v.01" />
              </svg>
            </span>
            <span className="text-sm font-semibold">Where does a VCF come from?</span>
          </div>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/60 transition-transform group-open:rotate-180">
            <path d="M3 4.5l3 3 3-3" />
          </svg>
        </summary>
        <div className="px-5 pb-5 pt-1 text-xs text-muted-foreground leading-relaxed space-y-3.5">
          <p className="text-foreground/80">
            A VCF (Variant Call Format) file lists somatic mutations found in a tumor by comparing it against matched healthy DNA from the same patient. To produce one:
          </p>
          <ol className="space-y-2.5 ml-0.5">
            <li className="flex gap-2.5">
              <span className="h-4 w-4 shrink-0 mt-px rounded-full bg-secondary text-foreground text-[10px] font-bold flex items-center justify-center">1</span>
              <span><span className="font-semibold text-foreground">Collect samples.</span> Take a tumor biopsy and a matched normal sample (whole blood or buccal swab) from the same patient.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="h-4 w-4 shrink-0 mt-px rounded-full bg-secondary text-foreground text-[10px] font-bold flex items-center justify-center">2</span>
              <span><span className="font-semibold text-foreground">Send to a sequencing lab.</span> Whole-exome (WES) or whole-genome (WGS) sequencing on Illumina/PacBio. You receive raw reads as <code className="font-mono text-[10.5px] bg-secondary/70 px-1 py-px rounded">.fastq.gz</code> files.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="h-4 w-4 shrink-0 mt-px rounded-full bg-secondary text-foreground text-[10px] font-bold flex items-center justify-center">3</span>
              <span><span className="font-semibold text-foreground">Align reads.</span> Map FASTQ reads to a reference genome (BWA-MEM, minimap2) → <code className="font-mono text-[10.5px] bg-secondary/70 px-1 py-px rounded">.bam</code> files for tumor and normal.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="h-4 w-4 shrink-0 mt-px rounded-full bg-secondary text-foreground text-[10px] font-bold flex items-center justify-center">4</span>
              <span><span className="font-semibold text-foreground">Call somatic variants.</span> Run Mutect2, Strelka2, or VarScan2 (tumor vs. normal) → produces the <code className="font-mono text-[10.5px] bg-secondary/70 px-1 py-px rounded">.vcf</code> you upload here.</span>
            </li>
          </ol>
          <p className="pt-1 text-[11px] text-muted-foreground/70">
            Project Rosie picks up from the VCF and handles annotation, neoantigen prediction, ranking, clinical reporting, and mRNA design.
          </p>
        </div>
      </details>

      {/* Step progress */}
      <div className="mb-7 flex items-center gap-2">
        {STEPS.map((label, i) => {
          const s = i + 1
          const active = s === step
          const done = s < step
          return (
            <div key={label} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  done ? "bg-primary text-primary-foreground" :
                  active ? "bg-primary/20 text-primary border border-primary/40" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {done ? "✓" : s}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${active ? "text-foreground" : "text-muted-foreground"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-8 transition-colors ${done ? "bg-primary/40" : "bg-border"}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div className="rounded-2xl border border-border/60 bg-card p-7 shadow-xl shadow-black/10 animate-fade-up">
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold mb-1" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
                Patient information
              </h2>
              <p className="text-muted-foreground text-sm">Basic details about the sample</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sample" className="text-sm font-medium">Sample name</Label>
              <Input
                id="sample"
                placeholder="e.g. BUDDY_TUMOR_01"
                value={sampleName}
                onChange={(e) => setSampleName(e.target.value)}
                className="h-10 rounded-lg bg-secondary/50 border-border/60"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="species" className="text-sm font-medium">Species</Label>
              <select
                id="species"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="w-full h-10 rounded-lg border border-border/60 bg-secondary/50 px-3 text-sm text-foreground focus:outline-none focus:border-primary"
              >
                <option value="canis_lupus_familiaris">Dog (Canis lupus familiaris)</option>
                <option value="homo_sapiens">Human (Homo sapiens)</option>
                <option value="felis_catus" disabled>Cat (Felis catus) — coming soon</option>
              </select>
            </div>
            <Button
              onClick={() => setStep(2)}
              disabled={!sampleName.trim()}
              className="w-full h-10 rounded-lg bg-hero-gradient text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 border-0"
            >
              Continue →
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold mb-1" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
                MHC / DLA alleles
              </h2>
              <p className="text-muted-foreground text-sm">Enter alleles or pick a preset</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PRESET_ALLELES).map(([label, value]) => (
                <button
                  key={label}
                  onClick={() => setAlleles(value)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    alleles === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="alleles" className="text-sm font-medium">Alleles</Label>
              <Textarea
                id="alleles"
                placeholder="HLA-A*02:01, HLA-B*07:02, …"
                value={alleles}
                onChange={(e) => setAlleles(e.target.value)}
                rows={3}
                className="rounded-lg bg-secondary/50 border-border/60 resize-none text-sm"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-10 rounded-lg border-border/60">
                ← Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!alleles.trim()}
                className="flex-1 h-10 rounded-lg bg-hero-gradient text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 border-0"
              >
                Continue →
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold mb-1" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
                Upload VCF & submit
              </h2>
              <p className="text-muted-foreground text-sm">Drop your tumor variant call file</p>
            </div>

            <div
              className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                file ? "border-primary/40 bg-primary/5" : "border-border/50 hover:border-primary/30 hover:bg-secondary/30"
              }`}
              onClick={() => document.getElementById("vcf-input")?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const f = e.dataTransfer.files[0]
                if (f) setFile(f)
              }}
            >
              <input
                id="vcf-input"
                type="file"
                accept=".vcf,.vcf.gz,.gz"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-xl mx-auto mb-3">
                🧬
              </div>
              {file ? (
                <p className="text-primary font-semibold text-sm">{file.name}</p>
              ) : (
                <>
                  <p className="text-muted-foreground text-sm font-medium">Drag & drop or click to browse</p>
                  <p className="text-muted-foreground/60 text-xs mt-1">.vcf or .vcf.gz accepted</p>
                </>
              )}
            </div>

            {/* VCF Pre-flight — Gemma reviews the file before the pipeline runs */}
            <VcfAdvisor file={file} />

            {/* Review */}
            <div className="rounded-xl border border-border/40 bg-secondary/30 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sample</span>
                <span className="font-medium">{sampleName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Species</span>
                <span className="font-medium capitalize">{species.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground shrink-0">Alleles</span>
                <span className="font-mono text-xs text-right break-all">{alleles}</span>
              </div>
            </div>

            {error && (
              <p className="text-destructive text-sm bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-10 rounded-lg border-border/60">
                ← Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !file}
                className="flex-1 h-10 rounded-lg bg-hero-gradient text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 border-0"
              >
                {uploadPhase === "uploading" ? "Uploading VCF…" : uploadPhase === "submitting" ? "Submitting…" : "Submit Case"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              VCF uploads directly to secure cloud storage. Pipeline starts immediately on submission.
            </p>
          </div>
        )}
      </div>

      {/* Resources */}
      <div className="mt-7">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-3 px-1">
          Don&apos;t have a VCF yet?
        </p>
        <div className="rounded-2xl border border-border/40 bg-card divide-y divide-border/20 overflow-hidden">
          <a
            href="/samples/canine_mammary_tumor_sample.vcf"
            download
            className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors group"
          >
            <span className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2.5" y="1.5" width="9" height="11" rx="1.2" />
                <path d="M5 5h4M5 7.5h4M5 10h2.5" />
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">Sample VCF — Canine mammary tumor</p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5 leading-tight">10 somatic SNVs · ready to upload above</p>
            </div>
            <span className="text-muted-foreground/40 group-hover:text-foreground shrink-0 transition-colors">
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 1.5v6M3.5 5.5L6 8l2.5-2.5" />
                <path d="M2 10h8" />
              </svg>
            </span>
          </a>

          <Link
            href="/demo"
            className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors group"
          >
            <span className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.5 7c1.5-2.7 3.5-4 4.5-4s3 1.3 4.5 4c-1.5 2.7-3.5 4-4.5 4S4 9.7 2.5 7z" />
                <circle cx="7" cy="7" r="1.5" />
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">View a demo report</p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5 leading-tight">See full pipeline output before you submit your own case</p>
            </div>
            <span className="text-muted-foreground/40 group-hover:text-foreground shrink-0 transition-colors">
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 2.5l3.5 3.5L4 9.5" />
              </svg>
            </span>
          </Link>

          <a
            href="https://caninecommons.cancer.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors group"
          >
            <span className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="7" cy="7" rx="5.5" ry="2.5" />
                <ellipse cx="7" cy="7" rx="2.5" ry="5.5" />
                <circle cx="7" cy="7" r="5.5" />
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">Integrated Canine Data Commons</p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5 leading-tight">NCI public canine cancer dataset · download more samples</p>
            </div>
            <span className="text-muted-foreground/40 group-hover:text-foreground shrink-0 transition-colors">
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 2.5h4.5V7M9.5 2.5L5 7M4 4.5H3.5a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V9" />
              </svg>
            </span>
          </a>
        </div>
        <p className="text-[10.5px] text-muted-foreground/60 mt-3 px-1 leading-relaxed">
          For human samples, browse <a href="https://www.cbioportal.org/" target="_blank" rel="noopener noreferrer" className="underline decoration-muted-foreground/30 underline-offset-2 hover:text-foreground hover:decoration-foreground/40 transition-colors">cBioPortal (TCGA, ICGC)</a>.
        </p>
      </div>
    </div>
  )
}
