"use client"

import { StatusBadge } from "@/components/StatusBadge"
import { PipelineTimeline } from "@/components/PipelineTimeline"
import type { Case } from "@/types/case"

export function ReportViewer({ caseData }: { caseData: Case }) {
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
        <PipelineTimeline caseData={caseData} />
      </div>
    </div>
  )
}
