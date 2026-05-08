"""
VEP annotation wrapper — runs VEP via Docker for canine VCF files.
For Day 2 (canine data). Not needed for pVACtools sample data which is pre-annotated.
"""
import subprocess
import shutil
from pathlib import Path


VEP_IMAGE    = "ensemblorg/ensembl-vep"
VEP_CACHE    = Path(__file__).parent.parent / "vep_cache"
CANINE_DATA  = Path(__file__).parent.parent / "data" / "canine"


def annotate_vcf(
    input_vcf: str,
    output_vcf: str,
    species: str = "canis_lupus_familiaris",
    assembly: str = "CanFam4",
    cache_version: int = 111,
) -> str:
    input_path  = Path(input_vcf).resolve()
    output_path = Path(output_vcf).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    vep_cmd = (
        f"vep "
        f"--input_file /data/input/{input_path.name} "
        f"--output_file /data/output/{output_path.name} "
        f"--format vcf --vcf "
        f"--species {species} "
        f"--cache --cache_version {cache_version} --assembly {assembly} "
        f"--plugin Downstream --plugin Wildtype "
        f"--terms SO --pick --symbol --hgvs --transcript_version "
        f"--force_overwrite"
    )

    cmd = [
        "docker", "run", "--rm",
        "-v", f"{input_path.parent}:/data/input",
        "-v", f"{output_path.parent}:/data/output",
        "-v", f"{VEP_CACHE}:/root/.vep",
        VEP_IMAGE,
        "bash", "-c", vep_cmd,
    ]

    print(f"[annotation] Running VEP via Docker for {input_path.name}...", flush=True)
    subprocess.run(cmd, check=True)

    if not output_path.exists():
        raise FileNotFoundError(f"VEP output not found: {output_path}")

    print(f"[annotation] Annotated VCF → {output_path}")
    return str(output_path)


def download_vep_cache(species: str = "canis_lupus_familiaris", assembly: str = "CanFam4") -> None:
    VEP_CACHE.mkdir(parents=True, exist_ok=True)
    cmd = [
        "docker", "run", "--rm",
        "-v", f"{VEP_CACHE}:/root/.vep",
        VEP_IMAGE,
        "perl", "/opt/vep/src/ensembl-vep/INSTALL.pl",
        "-a", "cf",
        "-s", species,
        "-y", assembly,
        "-c", "/root/.vep",
        "--NO_HTSLIB",
    ]
    print(f"[annotation] Downloading VEP cache for {species} {assembly} → {VEP_CACHE}")
    print("[annotation] This is a one-time download (~3 GB). Please wait...")
    subprocess.run(cmd, check=True)
    print("[annotation] VEP cache download complete.")
