"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function MRNAViewer({ fasta, summary }: { fasta: string; summary: string }) {
  const [copied, setCopied] = useState(false)

  function downloadFasta() {
    const blob = new Blob([fasta], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "vaccine_mrna.fasta"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function copyFasta() {
    await navigator.clipboard.writeText(fasta)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lines = fasta.split("\n")
  const header = lines[0] ?? ""
  const sequence = lines.slice(1).join("")

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/30">
          <span className="text-xs font-mono text-muted-foreground">{header}</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={copyFasta} className="text-xs h-7">
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button variant="ghost" size="sm" onClick={downloadFasta} className="text-xs h-7">
              Download
            </Button>
          </div>
        </div>
        <div className="p-4 font-mono text-xs text-primary break-all leading-6 max-h-48 overflow-y-auto">
          {sequence}
        </div>
      </div>

      {summary && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold mb-3 text-sm">Design Summary</h3>
          <div className="prose prose-sm prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-sans leading-relaxed">
              {summary}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
