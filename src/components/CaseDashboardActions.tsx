"use client"

interface Props {
  caseId: string
  completed: boolean
}

export function CaseDashboardActions({ caseId, completed }: Props) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      {completed && (
        <>
          <a
            href={`/api/cases/${caseId}/download?type=report-pdf`}
            target="_blank"
            rel="noopener noreferrer"
            title="Clinical Report (.pdf)"
            className="h-7 px-2 rounded-md flex items-center gap-1 text-[11px] font-medium text-muted-foreground/60 hover:text-foreground hover:bg-secondary border border-transparent hover:border-border/40 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 1.5h5.5L10 4v6.5H2V1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              <path d="M7 1.5V4.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              <path d="M4 7h4M4 8.5h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            Report
          </a>

          <a
            href={`/api/cases/${caseId}/download?type=fasta`}
            title="mRNA Sequence (.fasta)"
            className="h-7 px-2 rounded-md flex items-center gap-1 text-[11px] font-medium text-muted-foreground/60 hover:text-foreground hover:bg-secondary border border-transparent hover:border-border/40 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1.5 3.5C1.5 3.5 3 2 4.5 3.5S6 5 7.5 3.5 9 2 10.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M1.5 8.5C1.5 8.5 3 7 4.5 8.5S6 10 7.5 8.5 9 7 10.5 8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M3 3.5v5M5.25 3v6M7.5 3.5v5M9.75 3.5v5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.4"/>
            </svg>
            FASTA
          </a>

          <a
            href={`/api/cases/${caseId}/download?type=synthesis-pdf`}
            target="_blank"
            rel="noopener noreferrer"
            title="Synthesis Specification (.pdf)"
            className="h-7 px-2 rounded-md flex items-center gap-1 text-[11px] font-medium text-muted-foreground/60 hover:text-foreground hover:bg-secondary border border-transparent hover:border-border/40 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 9l2-2 2 2 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
            Synthesis
          </a>
        </>
      )}

    </div>
  )
}
