"use client"

import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/StatusBadge"
import { CandidatesTable } from "@/components/CandidatesTable"
import { MRNAViewer } from "@/components/MRNAViewer"
import type { Case } from "@/types/case"

function MarkdownReport({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n")
  return (
    <div className="prose prose-invert prose-sm max-w-none space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith("## "))
          return <h2 key={i} className="text-lg font-semibold mt-6 mb-2 text-foreground">{line.slice(3)}</h2>
        if (line.startsWith("### "))
          return <h3 key={i} className="text-base font-semibold mt-4 mb-1 text-foreground">{line.slice(4)}</h3>
        if (line.startsWith("# "))
          return <h1 key={i} className="text-xl font-bold mt-2 mb-3 text-foreground">{line.slice(2)}</h1>
        if (line.startsWith("- "))
          return <li key={i} className="ml-4 text-muted-foreground text-sm">{line.slice(2)}</li>
        if (line.startsWith("**") && line.endsWith("**"))
          return <p key={i} className="font-semibold text-foreground text-sm">{line.slice(2, -2)}</p>
        if (line.trim() === "")
          return <div key={i} className="h-2" />
        return <p key={i} className="text-muted-foreground text-sm leading-relaxed">{line}</p>
      })}
    </div>
  )
}

export function ReportViewer({ caseData }: { caseData: Case }) {
  const candidates = caseData.candidates_json?.top_candidates ?? []

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-0">
      {/* Sidebar */}
      <aside className="lg:w-56 shrink-0">
        <div className="rounded-xl border border-border bg-card p-4 space-y-4 sticky top-20">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Sample</p>
            <p className="font-medium text-sm break-all">{caseData.sample_name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Species</p>
            <p className="text-sm capitalize">{caseData.species.replace(/_/g, " ")}</p>
          </div>
          {caseData.alleles.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Alleles</p>
              <div className="space-y-1">
                {caseData.alleles.map((a) => (
                  <p key={a} className="text-xs font-mono text-muted-foreground">{a}</p>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <StatusBadge status={caseData.status} />
          </div>
          {caseData.total_mutations != null && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Mutations</p>
              <p className="text-sm">{caseData.total_mutations.toLocaleString()}</p>
            </div>
          )}
          {caseData.candidates_after_filtering != null && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">After filtering</p>
              <p className="text-sm">{caseData.candidates_after_filtering.toLocaleString()}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Submitted</p>
            <p className="text-xs text-muted-foreground">
              {new Date(caseData.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {caseData.status !== "completed" ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-4xl mb-4">⏳</p>
            <h2 className="text-lg font-semibold mb-2">Pipeline running</h2>
            <p className="text-muted-foreground text-sm">
              Status: <span className="text-primary capitalize">{caseData.status}</span>
              <br />Results will appear here when complete.
            </p>
            <div className="mt-6 space-y-2 max-w-xs mx-auto">
              {(["pending", "running", "scoring", "reporting", "designing", "completed"] as const).map(
                (s) => (
                  <div key={s} className="flex items-center gap-2 text-xs">
                    <span
                      className={
                        s === caseData.status
                          ? "text-primary"
                          : ["pending", "running", "scoring", "reporting", "designing", "completed"].indexOf(s) <
                            ["pending", "running", "scoring", "reporting", "designing", "completed"].indexOf(caseData.status)
                          ? "text-primary/50"
                          : "text-muted-foreground/40"
                      }
                    >
                      {s === caseData.status ? "→" : "·"}
                    </span>
                    <span
                      className={
                        s === caseData.status
                          ? "text-foreground capitalize"
                          : "text-muted-foreground/60 capitalize"
                      }
                    >
                      {s}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        ) : (
          <Tabs defaultValue="report">
            <TabsList className="mb-4">
              <TabsTrigger value="report">Clinical Report</TabsTrigger>
              <TabsTrigger value="candidates">Candidates ({candidates.length})</TabsTrigger>
              <TabsTrigger value="mrna">mRNA Design</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
            </TabsList>

            <TabsContent value="report">
              <div className="rounded-xl border border-border bg-card p-6">
                {caseData.clinical_report_md ? (
                  <MarkdownReport markdown={caseData.clinical_report_md} />
                ) : (
                  <Skeleton className="h-64 w-full" />
                )}
              </div>
            </TabsContent>

            <TabsContent value="candidates">
              {candidates.length > 0 ? (
                <CandidatesTable candidates={candidates} />
              ) : (
                <Skeleton className="h-64 w-full" />
              )}
            </TabsContent>

            <TabsContent value="mrna">
              {caseData.mrna_fasta ? (
                <MRNAViewer fasta={caseData.mrna_fasta} summary={caseData.mrna_summary_md ?? ""} />
              ) : (
                <Skeleton className="h-48 w-full" />
              )}
            </TabsContent>

            <TabsContent value="charts">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {caseData.binding_affinity_img_b64 ? (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground mb-3">Binding Affinity (IC50)</p>
                    <Image
                      src={`data:image/png;base64,${caseData.binding_affinity_img_b64}`}
                      alt="Binding affinity chart"
                      width={500}
                      height={400}
                      className="w-full rounded"
                      unoptimized
                    />
                  </div>
                ) : (
                  <Skeleton className="h-80 rounded-xl" />
                )}
                {caseData.mutation_landscape_img_b64 ? (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground mb-3">Mutation Landscape</p>
                    <Image
                      src={`data:image/png;base64,${caseData.mutation_landscape_img_b64}`}
                      alt="Mutation landscape chart"
                      width={500}
                      height={400}
                      className="w-full rounded"
                      unoptimized
                    />
                  </div>
                ) : (
                  <Skeleton className="h-80 rounded-xl" />
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
