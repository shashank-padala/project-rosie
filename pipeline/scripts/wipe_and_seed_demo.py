#!/usr/bin/env python3
"""
One-shot DB cleanup + demo seed.

Wipes ALL rows from the `cases` table (including the public demo) and removes
their GCS VCF objects, then seeds a fresh public demo case populated from the
local canine_mammary_001 pipeline outputs — including the new templated
synthesis spec (the whole reason for the wipe).

Run from project root:
    python3 pipeline/scripts/wipe_and_seed_demo.py

Requires .env.local with SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL,
and GCS_BUCKET. Will prompt for confirmation before deleting.
"""
import base64
import json
import sys
import warnings
from pathlib import Path

# google-api-core nags about Python 3.10 reaching EOL (2026-10-04). Not actionable
# for a one-off ops script — silence it before importing the SDK.
warnings.filterwarnings("ignore", category=FutureWarning, module=r"google\..*")

import requests
from google.cloud import storage

# Allow imports from pipeline/modules
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline"))

from modules.mrna_design import design_mrna  # noqa: E402
from modules.synthesis_spec import generate_synthesis_spec  # noqa: E402


# ── Config ─────────────────────────────────────────────────────────────────────

ENV_PATH = ROOT / ".env.local"
PIPELINE_OUT = ROOT / "pipeline" / "output" / "canine_mammary_001"
DEMO_SAMPLE_NAME = "Buddy — Canine Mammary Carcinoma (Demo)"


def load_env(path: Path) -> dict[str, str]:
    if not path.exists():
        sys.exit(f"❌ {path} not found")
    env = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        v = v.strip().strip('"').strip("'")
        env[k.strip()] = v
    return env


# ── Supabase REST API helpers ──────────────────────────────────────────────────

def sb_headers(service_role_key: str) -> dict[str, str]:
    return {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
    }


def sb_select_all_cases(base_url: str, key: str) -> list[dict]:
    r = requests.get(
        f"{base_url}/rest/v1/cases?select=id,sample_name,user_id,status",
        headers=sb_headers(key),
        timeout=30,
    )
    r.raise_for_status()
    return r.json()


def sb_delete_all_cases(base_url: str, key: str) -> int:
    """Delete every row by filtering on a column that is always present."""
    # PostgREST refuses unfiltered DELETE; use a filter that matches every row.
    r = requests.delete(
        f"{base_url}/rest/v1/cases?id=neq.00000000-0000-0000-0000-000000000000",
        headers={**sb_headers(key), "Prefer": "return=representation"},
        timeout=60,
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


# ── GCS helpers ────────────────────────────────────────────────────────────────

def parse_gs_uri(uri: str) -> tuple[str, str] | None:
    if not uri or not uri.startswith("gs://"):
        return None
    rest = uri[len("gs://"):]
    bucket, _, path = rest.partition("/")
    if not bucket or not path:
        return None
    return bucket, path


def gcs_delete_prefix(bucket_name: str, prefix: str) -> tuple[int, int]:
    """Delete all blobs under a prefix. Returns (deleted, failed)."""
    try:
        client = storage.Client()
    except Exception as e:
        print(f"  ⚠ Could not init GCS client (run `gcloud auth application-default login`?): {e}")
        return 0, 0
    bucket = client.bucket(bucket_name)
    blobs = list(client.list_blobs(bucket_name, prefix=prefix))
    if not blobs:
        return 0, 0
    deleted, failed = 0, 0
    for b in blobs:
        try:
            b.delete()
            deleted += 1
            print(f"  ✓ gs://{bucket_name}/{b.name}")
        except Exception as e:
            failed += 1
            print(f"  ✗ gs://{bucket_name}/{b.name} — {e}")
    return deleted, failed


# ── Demo seed builder ──────────────────────────────────────────────────────────

def png_to_b64(path: Path) -> str | None:
    if not path.exists():
        print(f"  ⚠ missing PNG: {path}")
        return None
    return base64.b64encode(path.read_bytes()).decode()


def build_demo_payload(out_dir: Path) -> dict:
    candidates_path = out_dir / "TUMOR_candidates.json"
    report_path     = out_dir / "clinical_report.md"
    fasta_path      = out_dir / "TUMOR_vaccine_mrna.fasta"
    binding_png     = out_dir / "TUMOR_binding_affinity.png"
    mutation_png    = out_dir / "TUMOR_mutation_landscape.png"

    candidates = json.loads(candidates_path.read_text())

    # Re-run mRNA design against the candidates JSON to get fresh structured
    # data (peptides, lengths, GC, etc.) that the synthesis spec template needs.
    import tempfile
    with tempfile.TemporaryDirectory() as tmp:
        design_result = design_mrna(
            candidates_json_path=str(candidates_path),
            output_dir=tmp,
            species=candidates.get("species", "canis_lupus_familiaris"),
        )
        design_data = design_result["design_data"]

    # Render the new templated synthesis spec
    synthesis_spec_md = generate_synthesis_spec(
        design_data=design_data,
        candidates_json_path=str(candidates_path),
    )

    clinical_md = report_path.read_text()

    return {
        "user_id":                    None,        # public demo
        "sample_name":                DEMO_SAMPLE_NAME,
        "species":                    candidates.get("species", "canis_lupus_familiaris"),
        "alleles":                    candidates.get("alleles", []),
        "predictors":                 ["NetMHCpan"],
        "status":                     "completed",
        "candidates_json":            candidates,
        "clinical_report_md":         clinical_md,
        "mrna_fasta":                 fasta_path.read_text(),
        "mrna_summary_md":            synthesis_spec_md,
        "binding_affinity_img_b64":   png_to_b64(binding_png),
        "mutation_landscape_img_b64": png_to_b64(mutation_png),
        "total_mutations":            candidates.get("total_mutations_analyzed"),
        "candidates_after_filtering": candidates.get("candidates_after_filtering"),
        "error_message":              None,
    }


# ── Main ───────────────────────────────────────────────────────────────────────

def confirm(prompt: str) -> bool:
    try:
        return input(f"{prompt} [yes/N]: ").strip().lower() == "yes"
    except EOFError:
        return False


def main() -> None:
    env = load_env(ENV_PATH)
    sb_url  = env.get("NEXT_PUBLIC_SUPABASE_URL")
    sb_key  = env.get("SUPABASE_SERVICE_ROLE_KEY")
    bucket  = env.get("GCS_BUCKET")
    if not sb_url or not sb_key:
        sys.exit("❌ Missing SUPABASE env vars in .env.local")

    print(f"\n🔍 Connecting to {sb_url}\n")

    # 1. Inventory
    cases = sb_select_all_cases(sb_url, sb_key)
    print(f"Found {len(cases)} case(s) in DB:")
    for c in cases:
        marker = "[demo]" if c.get("user_id") is None else "[user]"
        print(f"  {marker} {c['id'][:8]}…  {c['sample_name']:<40s}  status={c.get('status')}")
    print()

    # 2. Confirm
    if not confirm("⚠️  Wipe ALL cases (including demo) + delete all VCFs under gs://" + (bucket or "?") + "/vcf/?"):
        sys.exit("Aborted.")

    # 3. Delete GCS objects (path is not stored in DB — wipe the entire vcf/ prefix)
    print("\n🗑  Deleting all VCFs under vcf/ prefix in GCS…")
    if bucket:
        ok, bad = gcs_delete_prefix(bucket, "vcf/")
        print(f"  → {ok} deleted, {bad} failed")
    else:
        print("  ⚠ GCS_BUCKET not set in .env.local — skipping GCS cleanup")

    # 4. Wipe DB
    print("\n🗑  Deleting all rows from cases…")
    n = sb_delete_all_cases(sb_url, sb_key)
    print(f"  → {n} rows deleted")

    # 5. Seed demo
    print("\n🌱 Seeding new public demo case from local pipeline outputs…")
    if not PIPELINE_OUT.exists():
        sys.exit(f"❌ Pipeline outputs not found at {PIPELINE_OUT}")
    payload = build_demo_payload(PIPELINE_OUT)
    inserted = sb_insert_case(sb_url, sb_key, payload)
    print(f"  → demo case inserted: id={inserted['id'][:8]}…  sample_name={inserted['sample_name']}")
    print(f"\n✅ Done. /demo will now serve the new case.\n")


if __name__ == "__main__":
    main()
