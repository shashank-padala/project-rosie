"""
Wraps pvacseq run as a Python function.
Returns the path to the MHC_Class_I all_epitopes.tsv output file.
"""
import subprocess
import sys
import os
from pathlib import Path


def run_pvacseq(
    vcf_path: str,
    sample_name: str,
    alleles: list[str],
    predictors: list[str],
    output_dir: str,
    epitope_lengths: str = "8,9,10,11",
) -> str:
    alleles_str = ",".join(alleles)
    algorithms_str = " ".join(predictors)
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    cmd = [
        "pvacseq", "run",
        str(vcf_path),
        sample_name,
        alleles_str,
        algorithms_str,
        str(out),
        "-e1", epitope_lengths,
        "-m", "median",
        "-b", "500",
        "-c", "1",
    ]

    print(f"[prediction] Running: {' '.join(cmd)}", flush=True)
    result = subprocess.run(cmd, check=True)

    tsv = out / "MHC_Class_I" / f"{sample_name}.MHC_I.all_epitopes.tsv"
    if not tsv.exists():
        raise FileNotFoundError(f"Expected pVACseq output not found: {tsv}")

    return str(tsv)
