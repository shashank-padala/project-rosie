"""
Wraps pvacseq run as a Python function.
Returns the path to the MHC_Class_I all_epitopes.tsv output file.
"""
import subprocess
import os
from pathlib import Path


def _vcf_sample_id(vcf_path: str) -> str:
    """Return the first sample column name from the VCF #CHROM header line."""
    with open(vcf_path) as fh:
        for line in fh:
            if line.startswith("#CHROM"):
                cols = line.strip().split("\t")
                # Columns after FORMAT (index 8) are sample IDs
                if len(cols) > 9:
                    return cols[9]
                break
    return "TUMOR"  # safe fallback


def run_pvacseq(
    vcf_path: str,
    sample_name: str,
    alleles: list[str],
    predictors: list[str],
    output_dir: str,
    epitope_lengths: str = "8,9,10,11",
) -> str:
    # pVACseq requires sample_name to match a column in the VCF #CHROM header.
    # The user-facing display name won't match, so read the actual sample ID.
    vcf_sample = _vcf_sample_id(vcf_path)
    print(f"[prediction] VCF sample ID: {vcf_sample!r} (display name: {sample_name!r})", flush=True)

    alleles_str = ",".join(alleles)
    algorithms_str = " ".join(predictors)
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    cmd = [
        "pvacseq", "run",
        str(vcf_path),
        vcf_sample,          # use VCF column name, not display name
        alleles_str,
        algorithms_str,
        str(out),
        "-e1", epitope_lengths,
        "-m", "median",
        "-b", "500",
        "-c", "1",
    ]

    print(f"[prediction] Running: {' '.join(cmd)}", flush=True)
    result = subprocess.run(cmd, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        stderr_tail = (result.stderr or "")[-2000:]
        raise RuntimeError(
            f"pVACseq exited {result.returncode}.\nSTDERR:\n{stderr_tail}"
        )

    # Output file uses the vcf_sample name as prefix
    tsv = out / "MHC_Class_I" / f"{vcf_sample}.MHC_I.all_epitopes.tsv"
    if not tsv.exists():
        raise FileNotFoundError(f"Expected pVACseq output not found: {tsv}")

    return str(tsv)
