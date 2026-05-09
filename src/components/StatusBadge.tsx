import { Badge } from "@/components/ui/badge"
import type { CaseStatus } from "@/types/case"

const config: Record<CaseStatus, { label: string; className: string }> = {
  pending:   { label: "Queued",           className: "border-border/60 text-muted-foreground bg-secondary/50" },
  running:   { label: "Predicting Neoantigens", className: "border-blue-500/30 text-blue-400 bg-blue-500/10" },
  scoring:   { label: "Ranking Candidates",     className: "border-blue-500/30 text-blue-400 bg-blue-500/10" },
  reporting: { label: "Generating Report",className: "border-yellow-500/30 text-yellow-400 bg-yellow-500/10" },
  designing: { label: "Designing Vaccine",className: "border-yellow-500/30 text-yellow-400 bg-yellow-500/10" },
  completed: { label: "Complete",         className: "border-primary/30 text-primary bg-primary/10" },
  failed:    { label: "Failed",           className: "border-destructive/30 text-destructive bg-destructive/10" },
}

export function StatusBadge({ status }: { status: CaseStatus }) {
  const { label, className } = config[status] ?? config.pending
  return (
    <Badge variant="outline" className={`${className} text-xs font-semibold px-2 py-0.5 rounded-md`}>
      {label}
    </Badge>
  )
}
