#!/usr/bin/env python3
"""Seed the Supabase cases table with the canine mammary tumor demo case."""

import base64
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

ROOT = Path(__file__).parent.parent
OUTPUT = ROOT / "pipeline" / "output" / "canine_mammary_001"
ENV = ROOT / ".env.local"

load_dotenv(ENV)

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

SAMPLE = "TUMOR"
DISPLAY_NAME = "Canine Mammary Tumor — PIK3CA V125M"


def b64(path: Path) -> str | None:
    if not path.exists():
        print(f"  WARNING: {path.name} not found, skipping")
        return None
    return base64.b64encode(path.read_bytes()).decode()


def read_text(path: Path) -> str | None:
    if not path.exists():
        print(f"  WARNING: {path.name} not found, skipping")
        return None
    return path.read_text()


def main():
    print("Loading pipeline outputs…")

    candidates_json = json.loads((OUTPUT / f"{SAMPLE}_candidates.json").read_text())
    clinical_report = read_text(OUTPUT / "clinical_report.md")
    mrna_fasta = read_text(OUTPUT / f"{SAMPLE}_vaccine_mrna.fasta")
    mrna_summary = read_text(OUTPUT / f"{SAMPLE}_mrna_design_summary.md")
    ba_b64 = b64(OUTPUT / f"{SAMPLE}_binding_affinity.png")
    ml_b64 = b64(OUTPUT / f"{SAMPLE}_mutation_landscape.png")

    row = {
        "user_id": None,
        "sample_name": DISPLAY_NAME,
        "species": candidates_json.get("species", "homo_sapiens"),
        "alleles": candidates_json.get("alleles", []),
        "predictors": ["NetMHCpan"],
        "status": "completed",
        "candidates_json": candidates_json,
        "clinical_report_md": clinical_report,
        "mrna_fasta": mrna_fasta,
        "mrna_summary_md": mrna_summary,
        "binding_affinity_img_b64": ba_b64,
        "mutation_landscape_img_b64": ml_b64,
        "total_mutations": candidates_json.get("total_mutations_analyzed"),
        "candidates_after_filtering": candidates_json.get("candidates_after_filtering"),
    }

    print("Connecting to Supabase…")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Remove existing demo case
    supabase.table("cases").delete().is_("user_id", "null").execute()
    print("Cleared old demo case.")

    result = supabase.table("cases").insert(row).execute()
    case_id = result.data[0]["id"]
    print(f"✓ Demo case seeded: {case_id}")
    print(f"  Sample: {DISPLAY_NAME}")
    top = candidates_json['top_candidates'][0] if candidates_json.get('top_candidates') else {}
    print(f"  Top candidate: {top.get('peptide','?')} ({top.get('gene','?')}, IC50={top.get('ic50_nm','?')} nM)")
    print(f"\nVisit /demo to see it live.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(0)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
