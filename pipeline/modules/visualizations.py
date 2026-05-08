"""
Generates two PNG charts from the candidates JSON.
These images are fed to Gemma 4 vision in M2.
"""
import json
import math
from pathlib import Path

import matplotlib
matplotlib.use("Agg")  # headless — no display needed
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import pandas as pd


BRAND_BLUE  = "#1a3a5c"
BRAND_GREEN = "#2d7a4f"
THRESHOLD   = 500  # IC50 nM hard filter line


def generate_binding_affinity_chart(candidates: list[dict], output_path: str) -> None:
    if not candidates:
        return

    peptides = [f"{c['peptide']}\n({c['gene']})" for c in candidates]
    ic50s    = [c["ic50_nm"] for c in candidates]
    scores   = [c["composite_score"] for c in candidates]

    colors = [BRAND_BLUE if s >= 0.5 else "#6a9fd4" for s in scores]

    fig, ax = plt.subplots(figsize=(14, 6))
    bars = ax.bar(range(len(peptides)), ic50s, color=colors, edgecolor="white", linewidth=0.5)

    ax.axhline(THRESHOLD, color="red", linestyle="--", linewidth=1.2, label=f"IC50 threshold ({THRESHOLD} nM)")
    ax.set_xticks(range(len(peptides)))
    ax.set_xticklabels(peptides, rotation=45, ha="right", fontsize=8)
    ax.set_ylabel("IC50 Binding Affinity (nM)", fontsize=11)
    ax.set_title("Neoantigen Binding Affinity — Top Candidates", fontsize=13, fontweight="bold", color=BRAND_BLUE)
    ax.set_ylim(0, min(THRESHOLD * 1.2, max(ic50s) * 1.2))

    strong = mpatches.Patch(color=BRAND_BLUE, label="Composite score ≥ 0.5 (priority)")
    weak   = mpatches.Patch(color="#6a9fd4", label="Composite score < 0.5")
    ax.legend(handles=[strong, weak, ax.get_lines()[0]], fontsize=9)

    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    fig.tight_layout()
    fig.savefig(output_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"[visualizations] Binding affinity chart → {output_path}")


def generate_mutation_landscape(tsv_path: str | None, candidates: list[dict], output_path: str) -> None:
    if tsv_path and Path(tsv_path).exists():
        df = pd.read_csv(tsv_path, sep="\t", low_memory=False)
        if "Variant Type" in df.columns:
            counts = df["Variant Type"].value_counts()
        else:
            counts = pd.Series({c["variant_type"]: 1 for c in candidates if c.get("variant_type")})
    else:
        counts = pd.Series({c["variant_type"]: 1 for c in candidates if c.get("variant_type")})

    if counts.empty:
        return

    palette = [BRAND_BLUE, BRAND_GREEN, "#e67e22", "#8e44ad", "#c0392b", "#16a085"]
    colors  = [palette[i % len(palette)] for i in range(len(counts))]

    fig, ax = plt.subplots(figsize=(7, 7))
    wedges, texts, autotexts = ax.pie(
        counts.values,
        labels=counts.index,
        colors=colors,
        autopct="%1.1f%%",
        startangle=140,
        pctdistance=0.82,
        textprops={"fontsize": 10},
    )
    for at in autotexts:
        at.set_color("white")
        at.set_fontweight("bold")

    ax.set_title("Somatic Mutation Landscape", fontsize=13, fontweight="bold", color=BRAND_BLUE, pad=20)
    fig.tight_layout()
    fig.savefig(output_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"[visualizations] Mutation landscape chart → {output_path}")


def generate_all(candidates_json_path: str, tsv_path: str | None = None) -> None:
    with open(candidates_json_path) as f:
        data = json.load(f)

    sample = data["case_id"]
    candidates = data["top_candidates"]
    out_dir = Path(candidates_json_path).parent

    generate_binding_affinity_chart(
        candidates,
        str(out_dir / f"{sample}_binding_affinity.png"),
    )
    generate_mutation_landscape(
        tsv_path,
        candidates,
        str(out_dir / f"{sample}_mutation_landscape.png"),
    )
