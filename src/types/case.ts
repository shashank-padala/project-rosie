export type CaseStatus =
  | "pending"
  | "running"
  | "scoring"
  | "reporting"
  | "designing"
  | "completed"
  | "failed"

export interface Candidate {
  rank: number
  peptide: string
  wildtype_peptide: string
  mutation: string
  hgvsp: string
  gene: string
  transcript: string
  ic50_nm: number
  percentile_rank: number
  tumor_vaf: number
  immunogenicity_score: number
  composite_score: number
  hla_allele: string
  variant_type: string
}

export interface CandidatesJson {
  case_id: string
  species: string
  alleles: string[]
  total_mutations_analyzed: number
  candidates_after_filtering: number
  top_candidates: Candidate[]
  visualization_paths?: {
    binding_affinity: string
    mutation_landscape: string
  }
}

export interface Case {
  id: string
  created_at: string
  updated_at: string
  user_id: string | null
  sample_name: string
  species: string
  alleles: string[]
  predictors: string[]
  status: CaseStatus
  candidates_json: CandidatesJson | null
  clinical_report_md: string | null
  mrna_fasta: string | null
  mrna_summary_md: string | null
  binding_affinity_img_b64: string | null
  mutation_landscape_img_b64: string | null
  total_mutations: number | null
  candidates_after_filtering: number | null
  error_message: string | null
}
