import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Candidate } from "@/types/case"

export function CandidatesTable({ candidates }: { candidates: Candidate[] }) {
  // candidates_json uses top_candidates array, but we accept it flattened
  return (
    <div className="rounded-lg border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Rank</TableHead>
            <TableHead>Peptide</TableHead>
            <TableHead>Gene</TableHead>
            <TableHead>Length</TableHead>
            <TableHead>Allele</TableHead>
            <TableHead>IC50 (nM)</TableHead>
            <TableHead>VAF</TableHead>
            <TableHead>Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((c) => (
            <TableRow key={c.rank}>
              <TableCell className="text-muted-foreground">{c.rank}</TableCell>
              <TableCell className="font-mono text-xs">{c.peptide}</TableCell>
              <TableCell className="text-primary font-medium">{c.gene}</TableCell>
              <TableCell>{c.peptide.length}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{c.hla_allele}</TableCell>
              <TableCell
                className={
                  c.ic50_nm < 50
                    ? "text-primary font-medium"
                    : c.ic50_nm < 150
                    ? "text-yellow-400"
                    : "text-muted-foreground"
                }
              >
                {c.ic50_nm.toFixed(1)}
              </TableCell>
              <TableCell>{(c.tumor_vaf * 100).toFixed(1)}%</TableCell>
              <TableCell className="font-medium">{c.composite_score.toFixed(3)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
