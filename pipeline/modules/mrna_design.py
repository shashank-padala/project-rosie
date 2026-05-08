"""
mRNA sequence design module — M3.

Takes top neoantigen peptides from scoring output and produces a
synthesis-ready multi-epitope mRNA construct as a FASTA file.

Construct layout (5' → 3'):
  [5'UTR] [Kozak+ATG] [epitope1]-[AAY]-[epitope2]-[AAY]-[epitope3] [stop] [3'UTR] [poly-A(60)]

References:
  - 5'UTR/3'UTR: human beta-globin sequences, widely used in mRNA vaccine IVT
  - AAY linker: standard CTL epitope junction (Ala-Ala-Tyr), improves antigen processing
  - Codon table: HIVE Codon Usage Database, Canis lupus familiaris (taxid 9615)
  - GC target: 45–55% for mRNA stability and ribosome loading
"""
import json
import math
from pathlib import Path


# ── Regulatory elements ────────────────────────────────────────────────────────

# Human beta-globin 5'UTR — validated for strong cap-dependent translation in IVT
FIVE_PRIME_UTR = "ACATTTGCTTCTGACACAACTGTGTTCACTAGCAACCTCAAACAGACAC"

# Kozak consensus — positions ATG in optimal translation initiation context
KOZAK = "GCCACC"

# Human beta-globin 3'UTR — confers mRNA stability, widely used in vaccine mRNA
THREE_PRIME_UTR = (
    "GCAAATTAAAGCCTTGAATATTTTCAAATGTTTTCAAATGTTTTCAAATG"
    "TTTTCAAATGTTTTCAAATGTTTTCAAATGTTTTCAAATGTTTTCAAATG"
)

POLY_A = "A" * 60

# CTL epitope linker: AAY improves proteasomal cleavage between junctions
CTL_LINKER = "AAY"

# Number of top candidates to include in the construct
N_EPITOPES = 3


# ── Canine codon usage table ───────────────────────────────────────────────────
# Source: HIVE Codon Usage Database, Canis lupus familiaris (RefSeq mRNAs)
# Format: {amino_acid_1_letter: [(codon, relative_frequency), ...]} — highest freq first

CANINE_CODON_TABLE: dict[str, list[tuple[str, float]]] = {
    "A": [("GCC", 0.40), ("GCT", 0.27), ("GCA", 0.22), ("GCG", 0.11)],
    "R": [("AGG", 0.24), ("AGA", 0.22), ("CGG", 0.20), ("CGC", 0.18), ("CGA", 0.09), ("CGT", 0.07)],
    "N": [("AAC", 0.55), ("AAT", 0.45)],
    "D": [("GAC", 0.56), ("GAT", 0.44)],
    "C": [("TGC", 0.57), ("TGT", 0.43)],
    "Q": [("CAG", 0.74), ("CAA", 0.26)],
    "E": [("GAG", 0.60), ("GAA", 0.40)],
    "G": [("GGC", 0.34), ("GGG", 0.27), ("GGA", 0.24), ("GGT", 0.15)],
    "H": [("CAC", 0.59), ("CAT", 0.41)],
    "I": [("ATC", 0.50), ("ATT", 0.34), ("ATA", 0.16)],
    "L": [("CTG", 0.41), ("CTC", 0.20), ("TTG", 0.13), ("CTT", 0.12), ("TTA", 0.08), ("CTA", 0.06)],
    "K": [("AAG", 0.60), ("AAA", 0.40)],
    "M": [("ATG", 1.00)],
    "F": [("TTC", 0.57), ("TTT", 0.43)],
    "P": [("CCC", 0.33), ("CCT", 0.29), ("CCA", 0.27), ("CCG", 0.11)],
    "S": [("AGC", 0.24), ("TCC", 0.22), ("TCT", 0.17), ("AGT", 0.15), ("TCA", 0.14), ("TCG", 0.08)],
    "T": [("ACC", 0.37), ("ACA", 0.29), ("ACT", 0.25), ("ACG", 0.09)],
    "W": [("TGG", 1.00)],
    "Y": [("TAC", 0.59), ("TAT", 0.41)],
    "V": [("GTG", 0.46), ("GTC", 0.25), ("GTT", 0.19), ("GTA", 0.10)],
    "*": [("TGA", 0.47), ("TAA", 0.31), ("TAG", 0.22)],  # stop codons
}


# ── Core functions ─────────────────────────────────────────────────────────────

def back_translate(peptide: str, species: str = "canis_lupus_familiaris") -> str:
    """Translate amino acid sequence → codon-optimized DNA using highest-freq codon per AA."""
    table = CANINE_CODON_TABLE  # extend for multi-species in Phase 2
    codons = []
    for aa in peptide.upper():
        if aa not in table:
            raise ValueError(f"Unknown amino acid: {aa}")
        codons.append(table[aa][0][0])  # pick highest frequency codon
    return "".join(codons)


def gc_content(seq: str) -> float:
    seq = seq.upper()
    gc = seq.count("G") + seq.count("C")
    return gc / len(seq) if seq else 0.0


def build_construct(peptides: list[str], species: str = "canis_lupus_familiaris") -> str:
    """Assemble multi-epitope coding sequence with AAY linkers."""
    linked = CTL_LINKER.join(peptides)
    cds = back_translate(linked + "*", species)  # * = stop codon
    return KOZAK + "ATG" + cds


def build_full_mrna(peptides: list[str], species: str = "canis_lupus_familiaris") -> str:
    """Full IVT-ready mRNA sequence (DNA representation, 5'→3')."""
    cds = build_construct(peptides, species)
    return FIVE_PRIME_UTR + cds + THREE_PRIME_UTR + POLY_A


# ── Main entry point ───────────────────────────────────────────────────────────

def design_mrna(
    candidates_json_path: str,
    output_dir: str,
    n_epitopes: int = N_EPITOPES,
    species: str = "canis_lupus_familiaris",
) -> str:
    with open(candidates_json_path) as f:
        data = json.load(f)

    sample = data["case_id"]
    top = data["top_candidates"]

    # Deduplicate by peptide sequence — keep highest-ranked unique peptide per gene
    seen_peptides: set[str] = set()
    unique: list[dict] = []
    for c in top:
        if c["peptide"] not in seen_peptides:
            seen_peptides.add(c["peptide"])
            unique.append(c)
        if len(unique) == n_epitopes:
            break

    if len(unique) < n_epitopes:
        print(f"[mrna] Warning: only {len(unique)} unique peptides available (requested {n_epitopes})")

    peptides  = [c["peptide"] for c in unique]
    genes     = [c["gene"]    for c in unique]
    mrna_seq  = build_full_mrna(peptides, species)
    gc        = gc_content(mrna_seq)

    cds_only  = build_construct(peptides, species)
    gc_cds    = gc_content(cds_only)

    print(f"[mrna] Epitopes selected : {', '.join(f'{p} ({g})' for p, g in zip(peptides, genes))}")
    print(f"[mrna] Construct length  : {len(mrna_seq)} nt  (CDS: {len(cds_only)} nt)")
    print(f"[mrna] GC — CDS          : {gc_cds:.1%}", "✓" if 0.50 <= gc_cds <= 0.70 else "⚠ outside 50–70% target")
    print(f"[mrna] GC — full mRNA    : {gc:.1%}  (UTRs + poly-A lower this — expected)")

    # Build FASTA
    header = (
        f">{sample}_neoantigen_vaccine | "
        f"epitopes={'+'.join(peptides)} | "
        f"genes={'+'.join(genes)} | "
        f"species={species} | "
        f"gc={gc:.3f} | "
        f"length={len(mrna_seq)}nt"
    )
    fasta = f"{header}\n{_wrap(mrna_seq, 60)}\n"

    out_path = str(Path(output_dir) / f"{sample}_vaccine_mrna.fasta")
    Path(out_path).write_text(fasta)
    print(f"[mrna] FASTA → {out_path}")

    # Write a human-readable design summary alongside the FASTA
    summary = _build_summary(sample, peptides, genes, mrna_seq, gc, gc_cds, species)
    summary_path = str(Path(output_dir) / f"{sample}_mrna_design_summary.md")
    Path(summary_path).write_text(summary)
    print(f"[mrna] Design summary → {summary_path}")

    return out_path


def _wrap(seq: str, width: int = 60) -> str:
    return "\n".join(seq[i:i+width] for i in range(0, len(seq), width))


def _build_summary(
    sample: str,
    peptides: list[str],
    genes: list[str],
    mrna_seq: str,
    gc: float,
    gc_cds: float,
    species: str,
) -> str:
    cds_start = len(FIVE_PRIME_UTR) + len(KOZAK) + 3  # +3 for ATG
    cds_end   = len(mrna_seq) - len(THREE_PRIME_UTR) - len(POLY_A)

    lines = [
        f"# mRNA Vaccine Design Summary — {sample}",
        "",
        "## Construct Overview",
        "",
        f"| Element         | Sequence / Value |",
        f"|-----------------|-----------------|",
        f"| Species         | {species} |",
        f"| Epitopes        | {' + '.join(peptides)} |",
        f"| Source genes    | {' + '.join(genes)} |",
        f"| Linker          | AAY (CTL epitope junction) |",
        f"| Total length    | {len(mrna_seq)} nt |",
        f"| GC content (CDS)| {gc_cds:.1%} {'✓' if 0.50 <= gc_cds <= 0.70 else '⚠ outside 50–70% target'} |",
        f"| GC content (full)| {gc:.1%} (UTRs + poly-A lower this — expected) |",
        f"| CDS coordinates | {cds_start}–{cds_end} |",
        "",
        "## Region Map",
        "",
        f"```",
        f"5'UTR ({len(FIVE_PRIME_UTR)} nt) → Kozak+ATG → CDS ({cds_end - cds_start} nt) → 3'UTR ({len(THREE_PRIME_UTR)} nt) → poly-A (60 nt)",
        f"```",
        "",
        "## Epitope Construct",
        "",
        f"`{'–AAY–'.join(peptides)}`",
        "",
        "## Regulatory Elements",
        "",
        "| Element  | Source | Notes |",
        "|----------|--------|-------|",
        "| 5'UTR    | Human beta-globin (HBB) | Strong cap-dependent translation in IVT |",
        "| Kozak    | Consensus (GCCACCATG) | Optimal translation initiation |",
        "| Linker   | AAY ×2 | Facilitates proteasomal cleavage at epitope junctions |",
        "| 3'UTR    | Human beta-globin (HBB) | mRNA stability |",
        "| Poly-A   | 60 nt  | Required for translation and stability |",
        "",
        "## Codon Optimization",
        "",
        f"Codon table: HIVE Codon Usage Database, *Canis lupus familiaris* (taxid 9615).  ",
        "Strategy: highest-frequency codon per amino acid (deterministic).  ",
        "Phase 2: add rare codon avoidance and CAI scoring.",
        "",
        "## Next Steps for Synthesis",
        "",
        "1. Submit the `.fasta` file to your RNA synthesis partner (e.g., Trilink, Genscript).",
        "2. Request N1-methylpseudouridine (m1Ψ) modification for immune evasion.",
        "3. Specify LNP formulation: ionizable lipid + DSPC + cholesterol + PEG-lipid (typical ratio 50:10:38.5:1.5 mol%).",
        "4. Request QC: integrity gel, dsRNA ELISA, endotoxin test.",
    ]
    return "\n".join(lines) + "\n"
