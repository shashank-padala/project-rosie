"""
Templated mRNA synthesis specification.

Replaces the LLM-generated synthesis spec with a deterministic Jinja template.
The output is a CMO-grade order document with fixed manufacturing parameters
(cap analog, modifications, LNP ratios, QC release criteria) and case-specific
fields populated from the structured pipeline output.

Why templated, not LLM-generated:
  - This document is intended to be sent verbatim to a CMO (Trilink, Genscript).
  - Hallucinated catalog numbers, drifted QC thresholds, or fabricated vendor
    specs would be flagged immediately by a formulation scientist and would
    erode trust in the entire pipeline.
  - All variability here is patient/case data — the manufacturing science is
    fixed. That makes templating the correct tool.
"""
import json
from datetime import datetime, timezone
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

PIPELINE_VERSION = "v0.1"
TEMPLATE_DIR = Path(__file__).parent.parent / "templates"

_SPECIES_LABELS = {
    "canis_lupus_familiaris": "Canine (Canis lupus familiaris)",
    "homo_sapiens":           "Human (Homo sapiens)",
    "felis_catus":            "Feline (Felis catus)",
    "mus_musculus":           "Mouse (Mus musculus)",
    "rattus_norvegicus":      "Rat (Rattus norvegicus)",
}


def _binding_category(ic50_nm: float) -> str:
    if ic50_nm < 50:
        return "Strong"
    if ic50_nm < 500:
        return "Weak"
    return "Non-binder"


def _build_epitope_table(
    top_candidates: list[dict],
    peptides_in_construct: list[str],
) -> list[dict]:
    by_pep = {c["peptide"]: c for c in top_candidates}
    rows: list[dict] = []
    for i, p in enumerate(peptides_in_construct, start=1):
        c = by_pep.get(p)
        if c is None:
            rows.append({
                "rank": i, "peptide": p, "gene": "—",
                "mutation": "—", "allele": "—", "ic50": "—", "category": "—",
            })
            continue
        rows.append({
            "rank": i,
            "peptide": p,
            "gene": c.get("gene") or "—",
            "mutation": c.get("hgvsp") or c.get("mutation") or "—",
            "allele": c.get("hla_allele") or "—",
            "ic50": f"{float(c.get('ic50_nm', 0)):.1f}",
            "category": _binding_category(float(c.get("ic50_nm", 9999))),
        })
    return rows


def generate_synthesis_spec(
    design_data: dict,
    candidates_json_path: str,
    pipeline_version: str = PIPELINE_VERSION,
) -> str:
    with open(candidates_json_path) as f:
        candidates = json.load(f)

    epitope_table = _build_epitope_table(
        top_candidates=candidates.get("top_candidates", []),
        peptides_in_construct=design_data["peptides"],
    )

    species = design_data["species"]
    species_label = _SPECIES_LABELS.get(species, species.replace("_", " ").title())

    env = Environment(
        loader=FileSystemLoader(str(TEMPLATE_DIR)),
        autoescape=False,  # markdown output, not HTML
        trim_blocks=True,
        lstrip_blocks=True,
    )
    tpl = env.get_template("synthesis_spec.md.j2")

    return tpl.render(
        order_id=f"ROSIE-{design_data['sample']}-{datetime.now(timezone.utc).strftime('%Y%m%d')}",
        sample=design_data["sample"],
        species=species,
        species_label=species_label,
        date=datetime.now(timezone.utc).strftime("%d %b %Y"),
        n_epitopes=len(design_data["peptides"]),
        peptides=design_data["peptides"],
        genes=design_data["genes"],
        total_len=design_data["total_len"],
        cds_len=design_data["cds_len"],
        gc_full=design_data["gc_full"],
        gc_cds=design_data["gc_cds"],
        linker_count=design_data["linker_count"],
        five_utr_len=design_data["five_utr_len"],
        three_utr_len=design_data["three_utr_len"],
        polya_len=design_data["polya_len"],
        kozak_seq=design_data["kozak_seq"],
        epitope_table=epitope_table,
        pipeline_version=pipeline_version,
    )
