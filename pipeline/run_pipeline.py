#!/usr/bin/env python3
"""
Project Rosie — Pipeline CLI entry point.

Usage (Day 1, sample data with MHCflurry):
  python run_pipeline.py \\
    --vcf data/sample/pvacseq_example_data/annotated.expression.vcf.gz \\
    --sample-name HCC1395_TUMOR_DNA \\
    --alleles HLA-A*29:02,HLA-A*11:01,HLA-B*44:03,HLA-B*56:01,HLA-C*16:01 \\
    --predictors MHCflurry \\
    --output-dir output/

Usage (Day 2, canine data with NetMHCpan):
  python run_pipeline.py \\
    --vcf data/canine/tumor_annotated.vcf \\
    --sample-name canine_mammary_001 \\
    --alleles DLA-8803401,DLA-8850101 \\
    --predictors NetMHCpan \\
    --species canis_lupus_familiaris \\
    --output-dir output/
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from modules.prediction import run_pvacseq
from modules.scoring import score_candidates
from modules.visualizations import generate_all


def parse_args():
    p = argparse.ArgumentParser(description="Project Rosie — neoantigen pipeline")
    p.add_argument("--vcf",         required=True,  help="Path to VEP-annotated VCF")
    p.add_argument("--sample-name", required=True,  help="Tumor sample name (must match VCF column header)")
    p.add_argument("--alleles",     required=True,  help="Comma-separated HLA/DLA alleles")
    p.add_argument("--predictors",  required=True,  help="Space or comma-separated predictors (e.g. MHCflurry or NetMHCpan)")
    p.add_argument("--output-dir",  default="output", help="Output directory")
    p.add_argument("--species",     default="homo_sapiens", help="Species (default: homo_sapiens)")
    p.add_argument("--epitope-lengths", default="8,9,10,11")
    p.add_argument("--skip-prediction", action="store_true",
                   help="Skip pvacseq run and use existing TSV (provide --tsv)")
    p.add_argument("--tsv", help="Existing pVACseq all_epitopes.tsv (use with --skip-prediction)")
    return p.parse_args()


def main():
    args = parse_args()

    alleles    = [a.strip() for a in args.alleles.split(",")]
    predictors = [p.strip() for p in args.predictors.replace(",", " ").split()]
    out_dir    = str(Path(args.output_dir).resolve())

    print(f"\n{'='*60}")
    print(f"  Project Rosie — Neoantigen Pipeline")
    print(f"  Sample : {args.sample_name}")
    print(f"  Species: {args.species}")
    print(f"  Alleles: {', '.join(alleles)}")
    print(f"  Predictors: {', '.join(predictors)}")
    print(f"{'='*60}\n")

    # Step 1: pVACseq prediction
    if args.skip_prediction:
        if not args.tsv:
            print("ERROR: --skip-prediction requires --tsv", file=sys.stderr)
            sys.exit(1)
        tsv_path = args.tsv
        print(f"[pipeline] Skipping prediction, using existing TSV: {tsv_path}")
    else:
        print("[pipeline] Step 1/3: Running pVACseq prediction...")
        tsv_path = run_pvacseq(
            vcf_path=args.vcf,
            sample_name=args.sample_name,
            alleles=alleles,
            predictors=predictors,
            output_dir=out_dir,
            epitope_lengths=args.epitope_lengths,
        )

    # Step 2: Score and rank candidates
    print("\n[pipeline] Step 2/3: Scoring and ranking candidates...")
    json_path = score_candidates(
        tsv_path=tsv_path,
        sample_name=args.sample_name,
        alleles=alleles,
        species=args.species,
        output_dir=out_dir,
    )

    # Step 3: Generate visualizations
    print("\n[pipeline] Step 3/3: Generating visualizations...")
    generate_all(candidates_json_path=json_path, tsv_path=tsv_path)

    print(f"\n{'='*60}")
    print(f"  DONE")
    print(f"  Candidates JSON : {json_path}")
    print(f"{'='*60}\n")
    return json_path


if __name__ == "__main__":
    main()
