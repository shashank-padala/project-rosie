import { Badge } from "@/components/ui/badge"
import type { CaseStatus } from "@/types/case"

const config: Record<CaseStatus, { label: string; className: string }> = {
  pending:   { label: "Pending",   className: "border-border text-muted-foreground" },
  running:   { label: "Running",   className: "border-blue-500/40 text-blue-400 bg-blue-500/10" },
  scoring:   { label: "Scoring",   className: "border-blue-500/40 text-blue-400 bg-blue-500/10" },
  reporting: { label: "Reporting", className: "border-yellow-500/40 text-yellow-400 bg-yellow-500/10" },
  designing: { label: "Designing", className: "border-yellow-500/40 text-yellow-400 bg-yellow-500/10" },
  completed: { label: "Complete",  className: "border-primary/40 text-primary bg-primary/10" },
  failed:    { label: "Failed",    className: "border-destructive/40 text-destructive bg-destructive/10" },
}

export function StatusBadge({ status }: { status: CaseStatus }) {
  const { label, className } = config[status] ?? config.pending
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}
