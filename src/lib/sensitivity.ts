// Pure client-side re-rank for the sensitivity panel. The pipeline filters by
// IC50 < 500 nM and tumor VAF >= 0.01 (see pipeline/modules/scoring.py:12-13).
// Here we let the user move those thresholds and immediately see what would
// have been kept or dropped — no server round-trip needed since the candidates
// JSON already carries the raw numbers we need.

import type { Candidate } from "@/types/case"

export interface Thresholds {
  ic50_max: number   // upper bound, nM
  vaf_min: number    // lower bound, fraction (0..1)
}

export interface SensitivityResult {
  kept: Candidate[]      // candidates passing the new filters, sorted by composite_score desc
  dropped: Candidate[]   // candidates that pass at defaults but fail at the new thresholds
  thresholds: Thresholds
  defaults: Thresholds
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  ic50_max: 500,    // matches HARD_FILTER_IC50 in pipeline/modules/scoring.py
  vaf_min: 0.01,    // matches HARD_FILTER_VAF in pipeline/modules/scoring.py
}

function passes(c: Candidate, t: Thresholds): boolean {
  return c.ic50_nm <= t.ic50_max && c.tumor_vaf >= t.vaf_min
}

export function applySensitivity(
  candidates: Candidate[],
  t: Thresholds,
): SensitivityResult {
  const kept = candidates
    .filter((c) => passes(c, t))
    .sort((a, b) => b.composite_score - a.composite_score)

  // "Dropped" = was visible in the user's results (passes defaults) but no longer passes
  const dropped = candidates.filter(
    (c) => passes(c, DEFAULT_THRESHOLDS) && !passes(c, t),
  )

  return { kept, dropped, thresholds: t, defaults: DEFAULT_THRESHOLDS }
}
