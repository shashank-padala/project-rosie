"""
Transparent deterministic scoring module — not Gemma 4.
Hard filters then composite ranking. 50 lines of auditable logic.
Emits candidates JSON consumed by Gemma 4 in M2.
"""
import json
import math
import pandas as pd
from pathlib import Path


HARD_FILTER_IC50 = 500.0    # nM — exclude weaker binders
HARD_FILTER_VAF  = 0.01     # exclude near-zero VAF (sequencing noise)
TOP_N = 20

WEIGHT_IC50          = 0.50
WEIGHT_IMMUNOGENICITY = 0.30
WEIGHT_VAF           = 0.20


def _ic50_score(ic50_nm: float) -> float:
    # 1.0 at 1 nM, 0.0 at 500 nM — log-scaled
    ic50_nm = max(1.0, float(ic50_nm))
    return max(0.0, 1.0 - math.log10(ic50_nm) / math.log10(HARD_FILTER_IC50))


def _immunogenicity_score(row: pd.Series) -> float:
    if "BigMHC_IM MT Score" in row and pd.notna(row["BigMHC_IM MT Score"]):
        return min(1.0, max(0.0, float(row["BigMHC_IM MT Score"])))
    if "MHCflurryEL Presentation MT Percentile" in row and pd.notna(row["MHCflurryEL Presentation MT Percentile"]):
        pct = float(row["MHCflurryEL Presentation MT Percentile"])
        return max(0.0, 1.0 - pct / 100.0)
    if "NetMHCpan MT Percentile" in row and pd.notna(row["NetMHCpan MT Percentile"]):
        pct = float(row["NetMHCpan MT Percentile"])
        return max(0.0, 1.0 - pct / 100.0)
    return 0.0


def _vaf_score(vaf) -> float:
    try:
        return min(1.0, max(0.0, float(vaf)))
    except (ValueError, TypeError):
        return 0.0


def score_candidates(tsv_path: str, sample_name: str, alleles: list[str],
                     species: str, output_dir: str) -> str:
    df = pd.read_csv(tsv_path, sep="\t", low_memory=False)

    ic50_col = "Median MT IC50 Score" if "Median MT IC50 Score" in df.columns else "Best MT IC50 Score"
    vaf_col  = "Tumor DNA VAF"

    # Hard filters
    df[ic50_col] = pd.to_numeric(df[ic50_col], errors="coerce")
    df[vaf_col]  = pd.to_numeric(df[vaf_col],  errors="coerce").fillna(0)
    filtered = df[(df[ic50_col] <= HARD_FILTER_IC50) & (df[vaf_col] >= HARD_FILTER_VAF)].copy()

    # Composite score
    filtered["_score"] = (
        WEIGHT_IC50          * filtered[ic50_col].apply(_ic50_score)
        + WEIGHT_IMMUNOGENICITY * filtered.apply(_immunogenicity_score, axis=1)
        + WEIGHT_VAF           * filtered[vaf_col].apply(_vaf_score)
    )

    top = filtered.nlargest(TOP_N, "_score").reset_index(drop=True)

    candidates = []
    for i, row in top.iterrows():
        candidates.append({
            "rank": i + 1,
            "peptide": str(row.get("MT Epitope Seq", "")),
            "wildtype_peptide": str(row.get("WT Epitope Seq", "")),
            "mutation": str(row.get("Mutation", "")),
            "hgvsp": str(row.get("HGVSp", "")),
            "gene": str(row.get("Gene Name", "")),
            "transcript": str(row.get("Transcript", "")),
            "ic50_nm": round(float(row[ic50_col]), 2),
            "percentile_rank": round(float(row.get("Best MT Percentile", 0) or 0), 2),
            "tumor_vaf": round(float(row[vaf_col]), 4),
            "immunogenicity_score": round(_immunogenicity_score(row), 4),
            "composite_score": round(float(row["_score"]), 4),
            "hla_allele": str(row.get("HLA Allele", "")),
            "variant_type": str(row.get("Variant Type", "")),
        })

    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    json_path = out_dir / f"{sample_name}_candidates.json"

    output = {
        "case_id": sample_name,
        "species": species,
        "alleles": alleles,
        "total_mutations_analyzed": len(df),
        "candidates_after_filtering": len(filtered),
        "top_candidates": candidates,
        "visualization_paths": {
            "binding_affinity": str(out_dir / f"{sample_name}_binding_affinity.png"),
            "mutation_landscape": str(out_dir / f"{sample_name}_mutation_landscape.png"),
        },
    }

    with open(json_path, "w") as f:
        json.dump(output, f, indent=2)

    print(f"[scoring] {len(filtered)} candidates passed filters → top {len(candidates)} ranked → {json_path}")
    return str(json_path)
