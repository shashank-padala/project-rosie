import type { CaseStatus } from "@/types/case"

interface BadgeConfig {
  label: string
  dot: string
  bg: string
  text: string
  pulse?: true
}

const config: Record<CaseStatus, BadgeConfig> = {
  pending:   { label: "Queued",      dot: "bg-zinc-400",    bg: "bg-zinc-500/10",    text: "text-zinc-400" },
  running:   { label: "Predicting",  dot: "bg-blue-400",    bg: "bg-blue-500/10",    text: "text-blue-400",    pulse: true },
  scoring:   { label: "Ranking",     dot: "bg-blue-400",    bg: "bg-blue-500/10",    text: "text-blue-400",    pulse: true },
  reporting: { label: "Generating",  dot: "bg-amber-400",   bg: "bg-amber-500/10",   text: "text-amber-500",   pulse: true },
  designing: { label: "Designing",   dot: "bg-amber-400",   bg: "bg-amber-500/10",   text: "text-amber-500",   pulse: true },
  completed: { label: "Complete",    dot: "bg-emerald-400", bg: "bg-emerald-500/10", text: "text-emerald-500" },
  failed:    { label: "Failed",      dot: "bg-red-400",     bg: "bg-red-500/10",     text: "text-red-400" },
}

export function StatusBadge({ status }: { status: CaseStatus }) {
  const { label, dot, bg, text, pulse } = config[status] ?? config.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${bg} ${text}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot} ${pulse ? "animate-pulse" : ""}`} />
      {label}
    </span>
  )
}
