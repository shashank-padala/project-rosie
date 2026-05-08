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
    <div className="space-y-1 text-sm">
      {lines.map((line, i) => {
        if (line.startsWith("## "))
          return (
            <h2
              key={i}
              className="text-base font-bold mt-7 mb-2 text-foreground pt-5 border-t border-border/40 first:border-0 first:pt-0"
              style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
            >
              {line.slice(3)}
            </h2>
          )
        if (line.startsWith("### "))
          return (
            <h3
              key={i}
              className="text-sm font-semibold mt-4 mb-1.5 text-foreground"
              style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
            >
              {line.slice(4)}
            </h3>
          )
        if (line.startsWith("# "))
          return (
            <h1
              key={i}
              className="text-lg font-bold mt-2 mb-3 text-foreground"
              style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
            >
              {line.slice(2)}
            </h1>
          )
        if (line.startsWith("- "))
          return (
            <li key={i} className="ml-5 text-muted-foreground leading-relaxed list-disc">
              {line.slice(2)}
            </li>
          )
        if (line.trim() === "") return <div key={i} className="h-2" />
        return (
          <p key={i} className="text-muted-foreground leading-relaxed">
            {line}
          </p>
        )
      })}
    </div>
  )
}

const PIPELINE_STAGES = ["pending", "running", "scoring", "reporting", "designing", "completed"] as const

export function ReportViewer({ caseData }: { caseData: Case }) {
  const candidates = caseData.candidates_json?.top_candidates ?? []

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar */}
      <aside className="lg:w-52 shrink-0">
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-5 sticky top-20 shadow-xl shadow-black/10">
          <div>
            <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wide">Sample</p>
            <p className="font-semibold text-sm break-all leading-snug">{caseData.sample_name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wide">Species</p>
            <p className="text-sm capitalize text-muted-foreground">{caseData.species.replace(/_/g, " ")}</p>
          </div>
          {caseData.alleles.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wide">Alleles</p>
              <div className="space-y-1">
                {caseData.alleles.map((a) => (
                  <p key={a} className="text-xs font-mono text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">
                    {a}
                  </p>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5 font-semibold uppercase tracking-wide">Status</p>
            <StatusBadge status={caseData.status} />
          </div>
          {caseData.total_mutations != null && (
            <div>
              <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wide">Mutations</p>
              <p className="text-sm font-semibold">{caseData.total_mutations.toLocaleString()}</p>
            </div>
          )}
          {caseData.candidates_after_filtering != null && (
            <div>
              <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wide">After filter</p>
              <p className="text-sm font-semibold">{caseData.candidates_after_filtering.toLocaleString()}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wide">Submitted</p>
            <p className="text-xs text-muted-foreground">
              {new Date(caseData.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {caseData.status !== "completed" ? (
          <div className="rounded-2xl border border-border/60 bg-card p-12 text-center shadow-xl shadow-black/10">
            <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center text-3xl mx-auto mb-5">
              ⏳
            </div>
            <h2
              className="text-xl font-bold mb-2"
              style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
            >
              Pipeline running
            </h2>
            <p className="text-muted-foreground text-sm mb-8">
              Results will appear here when complete.
            </p>
            <div className="space-y-2.5 max-w-xs mx-auto text-left">
              {PIPELINE_STAGES.map((s) => {
                const currentIdx = PIPELINE_STAGES.indexOf(caseData.status as typeof PIPELINE_STAGES[number])
                const stageIdx = PIPELINE_STAGES.indexOf(s)
                const isDone = stageIdx < currentIdx
                const isCurrent = s === caseData.status
                return (
                  <div key={s} className="flex items-center gap-3">
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isDone ? "bg-primary text-primary-foreground" :
                      isCurrent ? "bg-primary/20 text-primary border border-primary/40" :
                      "bg-secondary text-muted-foreground/40"
                    }`}>
                      {isDone ? "✓" : "·"}
                    </div>
                    <span className={`text-sm capitalize ${isCurrent ? "text-foreground font-medium" : isDone ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
                      {s}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <Tabs defaultValue="report">
            <TabsList className="mb-5 bg-secondary/50 p-1 rounded-xl h-auto">
              <TabsTrigger value="report" className="rounded-lg text-sm px-4 py-2">
                Clinical Report
              </TabsTrigger>
              <TabsTrigger value="candidates" className="rounded-lg text-sm px-4 py-2">
                Candidates ({candidates.length})
              </TabsTrigger>
              <TabsTrigger value="mrna" className="rounded-lg text-sm px-4 py-2">
                mRNA Design
              </TabsTrigger>
              <TabsTrigger value="charts" className="rounded-lg text-sm px-4 py-2">
                Charts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="report">
              <div className="rounded-2xl border border-border/60 bg-card p-7 shadow-xl shadow-black/10">
                {caseData.clinical_report_md ? (
                  <MarkdownReport markdown={caseData.clinical_report_md} />
                ) : (
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-1/2 rounded-lg" />
                    <Skeleton className="h-4 w-full rounded-lg" />
                    <Skeleton className="h-4 w-4/5 rounded-lg" />
                    <Skeleton className="h-4 w-full rounded-lg" />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="candidates">
              {candidates.length > 0 ? (
                <CandidatesTable candidates={candidates} />
              ) : (
                <Skeleton className="h-64 w-full rounded-2xl" />
              )}
            </TabsContent>

            <TabsContent value="mrna">
              {caseData.mrna_fasta ? (
                <MRNAViewer fasta={caseData.mrna_fasta} summary={caseData.mrna_summary_md ?? ""} />
              ) : (
                <Skeleton className="h-48 w-full rounded-2xl" />
              )}
            </TabsContent>

            <TabsContent value="charts">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {caseData.binding_affinity_img_b64 ? (
                  <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xl shadow-black/10">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Binding Affinity (IC50)
                    </p>
                    <Image
                      src={`data:image/png;base64,${caseData.binding_affinity_img_b64}`}
                      alt="Binding affinity chart"
                      width={500}
                      height={400}
                      className="w-full rounded-lg"
                      unoptimized
                    />
                  </div>
                ) : (
                  <Skeleton className="h-80 rounded-2xl" />
                )}
                {caseData.mutation_landscape_img_b64 ? (
                  <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xl shadow-black/10">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Mutation Landscape
                    </p>
                    <Image
                      src={`data:image/png;base64,${caseData.mutation_landscape_img_b64}`}
                      alt="Mutation landscape chart"
                      width={500}
                      height={400}
                      className="w-full rounded-lg"
                      unoptimized
                    />
                  </div>
                ) : (
                  <Skeleton className="h-80 rounded-2xl" />
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
