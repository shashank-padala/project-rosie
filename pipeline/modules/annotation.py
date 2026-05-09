"""
VEP annotation wrapper — runs VEP via Docker for canine VCF files.
For Day 2 (canine data). Not needed for pVACtools sample data which is pre-annotated.
"""
import subprocess
import shutil
from pathlib import Path


VEP_IMAGE    = "ensemblorg/ensembl-vep"
VEP_CACHE    = Path(__file__).parent.parent / "vep_cache"
VEP_PLUGINS  = Path(__file__).parent.parent / "vep_plugins"
CANINE_DATA  = Path(__file__).parent.parent / "data" / "canine"


def annotate_vcf(
    input_vcf: str,
    output_vcf: str,
    species: str = "canis_lupus_familiaris",
    assembly: str = "ROS_Cfam_1.0",
    cache_version: int = 115,
) -> str:
    input_path  = Path(input_vcf).resolve()
    output_path = Path(output_vcf).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    import shutil as _shutil
    import tempfile as _tempfile

    # Copy input into vep_cache dir — single-mount approach avoids WSL2/Docker volume conflicts
    tmp_vcf = VEP_CACHE / f"_vep_input_{input_path.name}"
    _shutil.copy2(str(input_path), str(tmp_vcf))
    tmp_vcf.chmod(0o666)

    tmp_out_vcf = VEP_CACHE / f"_vep_output_{output_path.name}"

    vep_cmd = (
        f"vep "
        f"--input_file /opt/vep/.vep/{tmp_vcf.name} "
        f"--output_file /opt/vep/.vep/{tmp_out_vcf.name} "
        f"--format vcf --vcf "
        f"--species {species} "
        f"--cache --cache_version {cache_version} --assembly {assembly} "
        f"--dir /opt/vep/.vep "
        f"--dir_plugins /vep_plugins "
        f"--plugin Wildtype --plugin Frameshift "
        f"--terms SO --pick --symbol --hgvs --transcript_version --tsl "
        f"--force_overwrite"
    )

    cmd = [
        "docker", "run", "--rm",
        "-v", f"{VEP_CACHE}:/opt/vep/.vep",
        "-v", f"{VEP_PLUGINS}:/vep_plugins",
        VEP_IMAGE,
        "bash", "-c", vep_cmd,
    ]

    try:
        print(f"[annotation] Running VEP via Docker for {input_path.name}...", flush=True)
        subprocess.run(cmd, check=True)

        if not tmp_out_vcf.exists():
            raise FileNotFoundError(f"VEP output not found: {tmp_out_vcf}")

        _shutil.copy2(str(tmp_out_vcf), str(output_path))
        print(f"[annotation] Annotated VCF → {output_path}")
    finally:
        tmp_vcf.unlink(missing_ok=True)
        tmp_out_vcf.unlink(missing_ok=True)
        for w in VEP_CACHE.glob(f"_vep_output_{output_path.name}_warnings.txt"):
            w.unlink(missing_ok=True)

    return str(output_path)


def download_vep_cache(species: str = "canis_lupus_familiaris", assembly: str = "ROS_Cfam_1.0") -> None:
    VEP_CACHE.mkdir(parents=True, exist_ok=True)
    cmd = [
        "docker", "run", "--rm",
        "-v", f"{VEP_CACHE}:/opt/vep/.vep",
        VEP_IMAGE,
        "perl", "/opt/vep/src/ensembl-vep/INSTALL.pl",
        "-a", "cf",
        "-s", species,
        "-y", assembly,
        "-c", "/opt/vep/.vep",
        "--NO_HTSLIB",
    ]
    print(f"[annotation] Downloading VEP cache for {species} {assembly} → {VEP_CACHE}")
    print("[annotation] This is a one-time download (~3 GB). Please wait...")
    subprocess.run(cmd, check=True)
    print("[annotation] VEP cache download complete.")
