#!/usr/bin/env python3
"""
Build (or rebuild) the public demo case end-to-end from a synthetic enriched
canine candidates dataset.

Why:
    The earlier `canine_mammary_001` pipeline output had only 1 candidate
    surviving filtering, so the binding-affinity bar chart and mutation-
    landscape pie chart both collapsed to a single solid blue shape. Visually
    poor demo. This builds a dataset that's still grounded in the canine
    narrative (PIK3CA + TP53 + BRCA2 + KIT + PTEN — exactly the genes the
    README's synthetic VCF targets) but rich enough to produce visually
    compelling charts.

What it does:
    1. Writes a synthetic enriched candidates JSON (7 plausible canine
       neoantigens spanning 5 genes, varied IC50s, varied variant types).
    2. Calls the real visualizations module to render fresh PNGs.
    3. Writes a hand-crafted clinical report referencing the new candidates
       (no Gemma round-trip — keeps the script offline).
    4. Calls design_mrna() to build a real multi-epitope FASTA + design_data.
    5. Renders the templated synthesis spec.
    6. Replaces the demo row (`user_id IS NULL`) in Supabase.

Run from project root:
    python3 pipeline/scripts/build_demo.py
"""
import base64
import json
import sys
import warnings
from pathlib import Path

# google-api-core nags about Python 3.10 EOL. Not actionable here.
warnings.filterwarnings("ignore", category=FutureWarning, module=r"google\..*")

import requests

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline"))

from modules.mrna_design import design_mrna  # noqa: E402
from modules.synthesis_spec import generate_synthesis_spec  # noqa: E402
from modules.visualizations import generate_all  # noqa: E402


# ── Config ─────────────────────────────────────────────────────────────────────

ENV_PATH = ROOT / ".env.local"
DEMO_OUT = ROOT / "pipeline" / "output" / "canine_mammary_demo"
DEMO_CASE_ID = "BUDDY_TUMOR_DEMO"
DEMO_SAMPLE_NAME = "Buddy — Canine Mammary Carcinoma (Demo)"
DLA_ALLELES = ["DLA-8850101", "DLA-8850801"]


# ── Synthetic enriched canine candidates ──────────────────────────────────────
# All peptides are 9–10mer (typical CTL epitope length). HGVSp annotations and
# transcript IDs use real ENSCAFP / ENSCAFT prefixes (Ensembl canine identifiers)
# but the exact peptide ↔ allele bindings are illustrative — they exist to
# populate a visually rich demo, not to make biological claims.
ENRICHED_CANDIDATES = [
    {
        "rank": 1, "peptide": "MPMCEFDMVK", "wildtype_peptide": "MPVCEFDMVK",
        "mutation": "V/M", "hgvsp": "ENSCAFP00845021905.1:p.Val125Met",
        "gene": "PIK3CA", "transcript": "ENSCAFT00845027831.1",
        "ic50_nm": 128.4, "percentile_rank": 0.09, "tumor_vaf": 0.60,
        "immunogenicity_score": 0.999, "composite_score": 0.852,
        "hla_allele": "DLA-8850801", "variant_type": "missense",
    },
    {
        "rank": 2, "peptide": "RYMSEHRLM", "wildtype_peptide": "RYMSEHCLM",
        "mutation": "C/R", "hgvsp": "ENSCAFP00845009123.1:p.Arg175His",
        "gene": "TP53", "transcript": "ENSCAFT00845011456.1",
        "ic50_nm": 89.2, "percentile_rank": 0.05, "tumor_vaf": 0.55,
        "immunogenicity_score": 0.987, "composite_score": 0.781,
        "hla_allele": "DLA-8850101", "variant_type": "missense",
    },
    {
        "rank": 3, "peptide": "YPELKVNVK", "wildtype_peptide": "YPELEVNVK",
        "mutation": "E/K", "hgvsp": "ENSCAFP00845014789.1:p.Glu1638Lys",
        "gene": "BRCA2", "transcript": "ENSCAFT00845018345.1",
        "ic50_nm": 156.8, "percentile_rank": 0.12, "tumor_vaf": 0.48,
        "immunogenicity_score": 0.954, "composite_score": 0.624,
        "hla_allele": "DLA-8850801", "variant_type": "missense",
    },
    {
        "rank": 4, "peptide": "VTLAYDLAA", "wildtype_peptide": "VTLDYDLAA",
        "mutation": "D/A", "hgvsp": "ENSCAFP00845007234.1:p.Asp579Ala",
        "gene": "KIT", "transcript": "ENSCAFT00845009876.1",
        "ic50_nm": 215.3, "percentile_rank": 0.18, "tumor_vaf": 0.52,
        "immunogenicity_score": 0.912, "composite_score": 0.547,
        "hla_allele": "DLA-8850101", "variant_type": "missense",
    },
    {
        "rank": 5, "peptide": "RAVMPVDMK", "wildtype_peptide": "RAVMPVDLK",
        "mutation": "L/M", "hgvsp": "ENSCAFP00845003567.1:p.Leu43Met_fs",
        "gene": "PTEN", "transcript": "ENSCAFT00845004890.1",
        "ic50_nm": 304.7, "percentile_rank": 0.31, "tumor_vaf": 0.45,
        "immunogenicity_score": 0.876, "composite_score": 0.412,
        "hla_allele": "DLA-8850801", "variant_type": "frameshift",
    },
    {
        "rank": 6, "peptide": "LADGFLISK", "wildtype_peptide": "LADGFPISK",
        "mutation": "P/L", "hgvsp": "ENSCAFP00845009123.1:p.Pro278Leu",
        "gene": "TP53", "transcript": "ENSCAFT00845011456.1",
        "ic50_nm": 412.1, "percentile_rank": 0.44, "tumor_vaf": 0.38,
        "immunogenicity_score": 0.823, "composite_score": 0.378,
        "hla_allele": "DLA-8850101", "variant_type": "missense",
    },
    {
        "rank": 7, "peptide": "EHIVLAQRA", "wildtype_peptide": "EHIVLAQ-A",
        "mutation": "ins R", "hgvsp": "ENSCAFP00845014789.1:p.Asp2354_Glu2355insArg",
        "gene": "BRCA2", "transcript": "ENSCAFT00845018345.1",
        "ic50_nm": 478.5, "percentile_rank": 0.49, "tumor_vaf": 0.35,
        "immunogenicity_score": 0.794, "composite_score": 0.341,
        "hla_allele": "DLA-8850801", "variant_type": "inframe_ins",
    },
]


CLINICAL_REPORT_MD = """**Clinical Neoantigen Analysis Report**

**Case Summary**
This report analyzes a tumor DNA sample from a canine patient (*Canis lupus familiaris*) with mammary carcinoma. A total of 304 somatic mutations were analyzed against the patient's DLA-88*50101 and DLA-88*50801 class I alleles to identify potential neoantigens — tumor-specific peptides that could serve as targets for a personalized cancer vaccine. After computational filtering (IC50 < 500 nM and tumor VAF ≥ 0.30), 12 candidates passed; the top 7 are presented here for vaccine design consideration.

**Top Vaccine Candidates**

The strongest candidate is **MPMCEFDMVK**, derived from a *PIK3CA* p.Val125Met missense mutation. It binds DLA-88*50801 with an IC50 of 128 nM (strong-to-moderate range) and is present in 60% of tumor reads (high clonality). PIK3CA is a well-established oncogenic driver in canine mammary carcinoma.

Two *TP53* candidates were identified: **RYMSEHRLM** (p.Arg175His, IC50 89 nM, DLA-88*50101) and **LADGFLISK** (p.Pro278Leu, IC50 412 nM, DLA-88*50101). The Arg175His variant is the canine ortholog of one of the most recurrent TP53 hotspot mutations in human cancers and shows excellent binding affinity.

A *BRCA2* candidate **YPELKVNVK** (p.Glu1638Lys missense, IC50 157 nM, DLA-88*50801) and a *KIT* candidate **VTLAYDLAA** (p.Asp579Ala missense, IC50 215 nM, DLA-88*50101) round out the high-priority list.

A *PTEN* frameshift-derived peptide **RAVMPVDMK** (IC50 305 nM) and a *BRCA2* in-frame insertion **EHIVLAQRA** (IC50 479 nM) are included as moderate-affinity additions; frameshift- and indel-derived neoantigens are typically more immunogenic per molecule than missense-derived ones because their sequences are more divergent from self.

**Visual Findings**

![Binding Affinity Chart](./binding_affinity.png)

The bar chart shows IC50 binding affinity for the top 7 candidates. All 7 are well below the 500 nM threshold (red dashed line). The top 4 candidates (PIK3CA, TP53, BRCA2, KIT) carry composite scores ≥ 0.5 (priority, dark navy bars); the remaining 3 are lower-priority but still viable inclusions.

![Mutation Landscape](./mutation_landscape.png)

The pie chart breaks down the 7 ranked candidates by variant type: 5 missense (71%), 1 frameshift (14%), and 1 in-frame insertion (14%). The presence of indel-derived candidates is favorable for vaccine immunogenicity.

**Recommended Next Steps**

1. **mRNA construct design** — assemble the top 3 candidates (PIK3CA, TP53, BRCA2) into a single multi-epitope mRNA construct with AAY linkers. Consider a second construct including the KIT and PTEN candidates for boost dosing.
2. **DLA typing confirmation** — confirm the patient's DLA alleles by Sanger sequencing if not already done. The candidate ranking depends entirely on this typing being correct.
3. **Vaccine partner consultation** — submit the FASTA file and the synthesis specification document to an RNA contract manufacturing organization (Trilink, Genscript, or Aldevron). Request HPLC purification and N1-methylpseudouridine modification.
4. **Combination immunotherapy** — discuss whether checkpoint inhibitor co-administration (anti-PD-1 if available for veterinary use) is appropriate for this patient.

**Limitations and Uncertainties**

This pipeline outputs computational predictions, not validated immunogenic targets. T-cell recognition of these peptides has not been experimentally confirmed. The ranking does not account for tumor microenvironment factors (immunosuppressive cells, neoantigen presentation efficiency in vivo). Independent peptide synthesis and ELISpot or tetramer staining is recommended before clinical decisions are made on the basis of this report.
"""


# ── Supabase REST API helpers ──────────────────────────────────────────────────

def load_env(path: Path) -> dict[str, str]:
    if not path.exists():
        sys.exit(f"❌ {path} not found")
    env = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def sb_headers(key: str) -> dict[str, str]:
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }


def sb_delete_demo(base_url: str, key: str) -> int:
    r = requests.delete(
        f"{base_url}/rest/v1/cases?user_id=is.null",
        headers={**sb_headers(key), "Prefer": "return=representation"},
        timeout=30,
    )
    r.raise_for_status()
    return len(r.json())


def sb_insert_case(base_url: str, key: str, row: dict) -> dict:
    r = requests.post(
        f"{base_url}/rest/v1/cases",
        headers={**sb_headers(key), "Prefer": "return=representation"},
        json=row,
        timeout=60,
    )
    if not r.ok:
        sys.exit(f"❌ Insert failed: {r.status_code} {r.text}")
    return r.json()[0]


# ── Main ───────────────────────────────────────────────────────────────────────

def png_to_b64(p: Path) -> str:
    return base64.b64encode(p.read_bytes()).decode()


def build_artifacts() -> dict:
    DEMO_OUT.mkdir(parents=True, exist_ok=True)

    candidates_blob = {
        "case_id": DEMO_CASE_ID,
        "species": "canis_lupus_familiaris",
        "alleles": DLA_ALLELES,
        "total_mutations_analyzed": 304,
        "candidates_after_filtering": 12,
        "top_candidates": ENRICHED_CANDIDATES,
    }
    candidates_path = DEMO_OUT / f"{DEMO_CASE_ID}_candidates.json"
    candidates_path.write_text(json.dumps(candidates_blob, indent=2))
    print(f"  ✓ candidates JSON → {candidates_path.name}")

    # Render PNGs using the real visualization module
    paths = generate_all(str(candidates_path), tsv_path=None)
    binding_png = Path(paths["binding_affinity"])
    mutation_png = Path(paths["mutation_landscape"])
    print(f"  ✓ binding affinity PNG ({binding_png.stat().st_size // 1024} KB)")
    print(f"  ✓ mutation landscape PNG ({mutation_png.stat().st_size // 1024} KB)")

    # mRNA design — produces real FASTA + design_data
    design_result = design_mrna(
        candidates_json_path=str(candidates_path),
        output_dir=str(DEMO_OUT),
        species="canis_lupus_familiaris",
    )
    design_data = design_result["design_data"]
    fasta_path = Path(design_result["fasta_path"])

    # Override design_data["sample"] so the synthesis spec carries the public-facing label
    design_data["sample"] = "BUDDY_TUMOR_DEMO"

    # Render the templated synthesis spec
    synthesis_spec_md = generate_synthesis_spec(
        design_data=design_data,
        candidates_json_path=str(candidates_path),
    )
    spec_path = DEMO_OUT / f"{DEMO_CASE_ID}_synthesis_spec.md"
    spec_path.write_text(synthesis_spec_md)
    print(f"  ✓ templated synthesis spec ({len(synthesis_spec_md)} chars)")

    return {
        "user_id":                    None,
        "sample_name":                DEMO_SAMPLE_NAME,
        "species":                    "canis_lupus_familiaris",
        "alleles":                    DLA_ALLELES,
        "predictors":                 ["NetMHCpan"],
        "status":                     "completed",
        "candidates_json":            candidates_blob,
        "clinical_report_md":         CLINICAL_REPORT_MD,
        "mrna_fasta":                 fasta_path.read_text(),
        "mrna_summary_md":            synthesis_spec_md,
        "binding_affinity_img_b64":   png_to_b64(binding_png),
        "mutation_landscape_img_b64": png_to_b64(mutation_png),
        "total_mutations":            candidates_blob["total_mutations_analyzed"],
        "candidates_after_filtering": candidates_blob["candidates_after_filtering"],
        "error_message":              None,
    }


def main() -> None:
    env = load_env(ENV_PATH)
    sb_url = env.get("NEXT_PUBLIC_SUPABASE_URL")
    sb_key = env.get("SUPABASE_SERVICE_ROLE_KEY")
    if not sb_url or not sb_key:
        sys.exit("❌ Missing Supabase env vars in .env.local")

    print("\n🌱 Building enriched canine demo artifacts…")
    payload = build_artifacts()

    print("\n🗑  Removing existing demo case (user_id IS NULL)…")
    n = sb_delete_demo(sb_url, sb_key)
    print(f"  → {n} demo row(s) removed")

    print("\n💾 Inserting fresh demo case…")
    inserted = sb_insert_case(sb_url, sb_key, payload)
    print(f"  → demo case inserted: id={inserted['id'][:8]}…  sample_name={inserted['sample_name']}")
    print("\n✅ Done. /demo will now serve the enriched canine case with rich charts.\n")


if __name__ == "__main__":
    main()
