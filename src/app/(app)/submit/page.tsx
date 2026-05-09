"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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
      <div className="mb-8">
        <h1
          className="text-2xl font-bold mt-3 mb-1"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          New Case
        </h1>
        <p className="text-muted-foreground text-sm">Submit a tumor VCF to start the pipeline</p>

        {/* Step progress */}
        <div className="mt-6 flex items-center gap-2">
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
    </div>
  )
}
