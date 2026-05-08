"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navigation } from "@/components/Navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

const PRESET_ALLELES: Record<string, string> = {
  "Human MHC-I (common)": "HLA-A*02:01,HLA-A*01:01,HLA-B*07:02",
  "Canine DLA (common)":   "DLA-88*50101,DLA-88*50801,DLA-12*00101",
}

export default function SubmitPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [sampleName, setSampleName] = useState("")
  const [species, setSpecies] = useState("canis_lupus_familiaris")
  const [alleles, setAlleles] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sample_name: sampleName,
          species,
          alleles: alleles.split(",").map((a) => a.trim()).filter(Boolean),
          vcf_filename: file?.name ?? "",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Submission failed")
      router.push(`/cases/${data.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-24 pb-12">
        <div className="mb-8">
          <Link href="/dashboard" className="text-muted-foreground text-sm hover:text-foreground">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-3">New Case</h1>
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-lg">1. Patient info</h2>
            <div className="space-y-1.5">
              <Label htmlFor="sample">Sample name</Label>
              <Input
                id="sample"
                placeholder="e.g. BUDDY_TUMOR_01"
                value={sampleName}
                onChange={(e) => setSampleName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="species">Species</Label>
              <select
                id="species"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="canis_lupus_familiaris">Dog (Canis lupus familiaris)</option>
                <option value="homo_sapiens">Human (Homo sapiens)</option>
                <option value="felis_catus">Cat (Felis catus)</option>
              </select>
            </div>
            <Button onClick={() => setStep(2)} disabled={!sampleName.trim()} className="w-full">
              Next →
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-lg">2. MHC/DLA alleles</h2>
            <p className="text-muted-foreground text-sm">
              Enter alleles as a comma-separated list, or pick a preset.
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PRESET_ALLELES).map(([label, value]) => (
                <button
                  key={label}
                  onClick={() => setAlleles(value)}
                  className="text-xs px-3 py-1.5 rounded-md border border-border hover:border-primary hover:text-primary transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="alleles">Alleles</Label>
              <Textarea
                id="alleles"
                placeholder="HLA-A*02:01, HLA-B*07:02, …"
                value={alleles}
                onChange={(e) => setAlleles(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                ← Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!alleles.trim()} className="flex-1">
                Next →
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-lg">3. Upload VCF + submit</h2>
            <div
              className="rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors p-8 text-center cursor-pointer"
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
              <p className="text-3xl mb-3">🧬</p>
              {file ? (
                <p className="text-primary font-medium text-sm">{file.name}</p>
              ) : (
                <>
                  <p className="text-muted-foreground text-sm">Drag & drop a VCF file, or click to browse</p>
                  <p className="text-muted-foreground/60 text-xs mt-1">.vcf or .vcf.gz accepted</p>
                </>
              )}
            </div>

            <div className="rounded-lg border border-border bg-card/50 p-4 text-xs text-muted-foreground space-y-1">
              <p><span className="text-foreground font-medium">Sample:</span> {sampleName}</p>
              <p><span className="text-foreground font-medium">Species:</span> {species.replace(/_/g, " ")}</p>
              <p><span className="text-foreground font-medium">Alleles:</span> {alleles}</p>
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                ← Back
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? "Submitting…" : "Submit Case"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Pipeline execution is wired in M5. Case will register as <em>pending</em>.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
