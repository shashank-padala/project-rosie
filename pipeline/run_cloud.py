#!/usr/bin/env python3
"""
Cloud Run Job entry point for Project Rosie pipeline.
All config injected via environment variables by the Cloud Run Jobs API.
"""
import base64
import json
import os
import sys
import tempfile
import time
from pathlib import Path

import requests
from google.cloud import storage

sys.path.insert(0, str(Path(__file__).parent))

from modules.prediction import run_pvacseq
from modules.scoring import score_candidates
from modules.visualizations import generate_all
from modules.gemma import generate_clinical_report, generate_mrna_synthesis_spec
from modules.mrna_design import design_mrna

CASE_ID                  = os.environ["CASE_ID"]
GCS_VCF_PATH             = os.environ["GCS_VCF_PATH"]        # gs://bucket/path/file.vcf
GCS_BUCKET               = os.environ["GCS_BUCKET"]
SAMPLE_NAME              = os.environ["SAMPLE_NAME"]
ALLELES                  = os.environ["ALLELES"]              # comma-separated
SPECIES                  = os.environ.get("SPECIES", "homo_sapiens")
CALLBACK_URL             = os.environ["CALLBACK_URL"]         # Vercel deployment URL
PIPELINE_CALLBACK_SECRET = os.environ["PIPELINE_CALLBACK_SECRET"]
PREDICTORS               = os.environ.get("PREDICTORS", "NetMHCpan")
SKIP_PREDICTION          = os.environ.get("SKIP_PREDICTION", "").lower() == "true"
GCS_TSV_PATH             = os.environ.get("GCS_TSV_PATH", "")  # only used when SKIP_PREDICTION=true


def callback(status: str, **fields):
    url = f"{CALLBACK_URL.rstrip('/')}/api/cases/{CASE_ID}/progress"
    payload = {"status": status, **fields}
    # Retry completed/failed callbacks — if these don't land, the case stays stuck
    is_critical = status in ("completed", "failed")
    max_attempts = 4 if is_critical else 1
    for attempt in range(max_attempts):
        try:
            r = requests.post(
                url,
                json=payload,
                headers={"Authorization": f"Bearer {PIPELINE_CALLBACK_SECRET}"},
                timeout=30,
            )
            r.raise_for_status()
            print(f"[callback] {status} → {r.status_code}")
            return
        except Exception as e:
            print(f"[callback] ERROR {status} (attempt {attempt + 1}/{max_attempts}): {e}", file=sys.stderr)
            if attempt < max_attempts - 1:
                time.sleep(5 * (attempt + 1))
    if is_critical:
        # Force container to exit non-zero so Cloud Run records the failure visibly
        print(f"[callback] CRITICAL: could not deliver '{status}' after {max_attempts} attempts — exiting", file=sys.stderr)
        sys.exit(2)


def _download_gcs(gcs_path: str, dest: str) -> str:
    # gcs_path: gs://bucket/object
    parts = gcs_path[5:].split("/", 1)
    bucket_name, blob_name = parts[0], parts[1]
    client = storage.Client()
    blob = client.bucket(bucket_name).blob(blob_name)
    local_path = os.path.join(dest, Path(blob_name).name)
    blob.download_to_filename(local_path)
    print(f"[gcs] Downloaded {gcs_path} → {local_path}")
    return local_path


def download_vcf(gcs_path: str, dest: str) -> str:
    return _download_gcs(gcs_path, dest)


def download_tsv(gcs_path: str, dest: str) -> str:
    return _download_gcs(gcs_path, dest)


def png_to_b64(path: str) -> str:
    return base64.b64encode(Path(path).read_bytes()).decode()


def main():
    alleles    = [a.strip() for a in ALLELES.split(",")]
    predictors = [p.strip() for p in PREDICTORS.replace(",", " ").split()]

    print(f"[cloud] Case {CASE_ID} | Sample {SAMPLE_NAME} | {len(alleles)} alleles")

    callback("running")

    with tempfile.TemporaryDirectory() as tmpdir:
        # Download VCF
        vcf_path = download_vcf(GCS_VCF_PATH, tmpdir)
        out_dir  = os.path.join(tmpdir, "output")
        Path(out_dir).mkdir()

        # Step 1: pVACseq prediction (or load pre-computed TSV)
        if SKIP_PREDICTION:
            if not GCS_TSV_PATH:
                callback("failed", error_message="SKIP_PREDICTION=true but GCS_TSV_PATH not set")
                sys.exit(1)
            print(f"[pipeline] Step 1/5: Skipping pVACseq — loading TSV from {GCS_TSV_PATH}")
            try:
                tsv_path = download_tsv(GCS_TSV_PATH, out_dir)
            except Exception as e:
                callback("failed", error_message=f"TSV download failed: {e}")
                sys.exit(1)
        else:
            print("[pipeline] Step 1/5: pVACseq prediction...")
            try:
                tsv_path = run_pvacseq(
                    vcf_path=vcf_path,
                    sample_name=SAMPLE_NAME,
                    alleles=alleles,
                    predictors=predictors,
                    output_dir=out_dir,
                )
            except Exception as e:
                callback("failed", error_message=f"Prediction failed: {e}")
                sys.exit(1)

        # Step 2: Score and rank
        print("[pipeline] Step 2/5: Scoring candidates...")
        callback("scoring")
        try:
            json_path = score_candidates(
                tsv_path=tsv_path,
                sample_name=SAMPLE_NAME,
                alleles=alleles,
                species=SPECIES,
                output_dir=out_dir,
            )
            candidates = json.loads(Path(json_path).read_text())
            callback(
                "scoring",
                total_mutations=candidates.get("total_mutations"),
                candidates_after_filtering=candidates.get("candidates_after_filtering"),
            )
        except Exception as e:
            callback("failed", error_message=f"Scoring failed: {e}")
            sys.exit(1)

        # Step 3: Visualizations
        print("[pipeline] Step 3/5: Generating visualizations...")
        callback("reporting")
        try:
            png_paths = generate_all(candidates_json_path=json_path, tsv_path=tsv_path)
        except Exception as e:
            callback("failed", error_message=f"Visualizations failed: {e}")
            sys.exit(1)

        # Step 4: Gemma 4 clinical report
        print("[pipeline] Step 4/5: Generating clinical report...")
        try:
            report_md = generate_clinical_report(
                candidates_json_path=json_path,
                binding_affinity_png=png_paths["binding_affinity"],
                mutation_landscape_png=png_paths["mutation_landscape"],
            )
        except Exception as e:
            callback("failed", error_message=f"Report generation failed: {e}")
            sys.exit(1)

        # Step 5: mRNA design
        print("[pipeline] Step 5/5: Designing mRNA construct...")
        callback("designing")
        try:
            fasta_path = design_mrna(
                candidates_json_path=json_path,
                output_dir=out_dir,
                species=SPECIES,
            )
            summary_path = fasta_path.replace("_vaccine_mrna.fasta", "_mrna_design_summary.md")
            design_summary = Path(summary_path).read_text() if Path(summary_path).exists() else ""
        except Exception as e:
            callback("failed", error_message=f"mRNA design failed: {e}")
            sys.exit(1)

        # Step 5b: Gemma 4 synthesis specification
        print("[pipeline] Step 5b: Generating mRNA synthesis specification...")
        try:
            mrna_summary = generate_mrna_synthesis_spec(
                design_summary=design_summary,
                candidates_json_path=json_path,
            )
        except Exception as e:
            print(f"[pipeline] Synthesis spec failed (non-fatal): {e}")
            mrna_summary = design_summary  # fall back to Python-generated summary

        # Final callback with all results
        callback(
            "completed",
            candidates_json=candidates,
            clinical_report_md=report_md,
            mrna_fasta=Path(fasta_path).read_text(),
            mrna_summary_md=mrna_summary,
            binding_affinity_img_b64=png_to_b64(png_paths["binding_affinity"]),
            mutation_landscape_img_b64=png_to_b64(png_paths["mutation_landscape"]),
        )

    print(f"[cloud] Case {CASE_ID} completed successfully.")


if __name__ == "__main__":
    main()
