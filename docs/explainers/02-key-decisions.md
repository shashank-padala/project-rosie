# Key Architecture Decisions

*Every non-obvious choice made in Project Rosie, and why. Written so a future contributor — or a hackathon judge — can understand the reasoning without asking.*

---

## Decision 1 — Start at VCF, not FASTQ

**What we chose:** The pipeline ingests a VEP-annotated VCF file as its starting point, not raw sequencing reads.

**What we skipped:** Steps 1–3 of the full pipeline (sequencing, alignment, variant calling via BWA-MEM2 / GATK Mutect2).

**Why:**
- Any clinical sequencing workflow already produces a VCF. Vet oncology labs that do whole exome sequencing hand off a VCF.
- Alignment and variant calling are solved problems with mature tooling. Adding them would double the scope with zero novelty.
- The unsolved accessibility problem is from VCF → ranked candidates → clinical report. That's what we're building.
- For a 10-day hackathon, starting at VCF lets us ship something real and demonstrable.

**Trade-off:** Users must supply a pre-called VCF. For Phase 2 (clinical deployment), we will integrate FASTQ → VCF as an optional upstream step.

---

## Decision 2 — NetMHCpan over MHCflurry

**What we chose:** NetMHCpan 4.2 as the binding affinity predictor.

**Why not MHCflurry:**
- MHCflurry is Python-native and easy to install, but it is trained primarily on human HLA alleles.
- For canine data (the core use case), we need **DLA allele support** — the canine equivalent of HLA. NetMHCpan supports DLA alleles.
- MHCflurry also has a Keras 3 incompatibility with the installed TensorFlow version that caused runtime errors.

**Trade-off:** NetMHCpan calls route through the IEDB REST API by default, which is slow (~45 minutes for 955 mutations). The local binary is faster (~2 minutes) but requires the IEDB Analysis Resource toolkit to be installed as a wrapper — separate from the DTU binary. Acceptable for now; documented for Phase 2 optimization.

---

## Decision 3 — No AlphaFold in Phase 1

**What we chose:** Skip structural validation (AlphaFold2 surface exposure checks) in the initial pipeline.

**Why:**
- AlphaFold adds significant compute time and infrastructure complexity (GPU required for reasonable speed).
- The IC50 binding score + VAF composite is sufficient to produce a ranked, clinically plausible shortlist.
- For a hackathon demo and initial validation, structural confirmation is a refinement, not a blocker.

**Trade-off:** Some candidates in the top 20 may be inside the protein (not surface-exposed) and thus less accessible to T-cells. Phase 2 will add AlphaFold pLDDT confidence scores as a filter.

---

## Decision 4 — Python scripts, not Nextflow / Snakemake

**What we chose:** Plain Python modules with subprocess calls, orchestrated by a single `run_pipeline.py` CLI.

**Why not a workflow manager:**
- Nextflow and Snakemake add learning curve, YAML configuration, and infrastructure requirements (Java runtime, container orchestration).
- For a single-sample pipeline (one case at a time), the parallelism benefits of a workflow manager don't apply.
- Python scripts are readable, debuggable, and deployable anywhere without additional runtime dependencies.

**Trade-off:** If we ever need to process 50 samples in parallel, we will need to add a job queue or workflow manager. Documented for Phase 2.

---

## Decision 5 — VAF as clonality proxy, not PyClone-VI

**What we chose:** Use tumor VAF (Variant Allele Frequency) directly as a proxy for how clonal a mutation is.

**Why not PyClone-VI:**
- PyClone-VI is the proper clonality inference tool — it accounts for copy number variation and estimates the fraction of tumor cells carrying each mutation.
- It requires copy number data that is not always available in the VCF alone.
- VAF is a reasonable proxy: a mutation present in 60% of reads is more clonal than one in 5% of reads.

**Trade-off:** In tumors with significant copy number variation (common in advanced cancers), VAF can be misleading. Phase 2 will integrate PyClone-VI when copy number data is available.

---

## Decision 6 — Transparent scoring, not Gemma 4 for ranking

**What we chose:** A deterministic Python function (`scoring.py`) for hard filtering and composite ranking. Gemma 4 is never involved in which candidates survive.

**Why:**
- Clinical decisions need to be auditable. A vet oncologist or regulatory body must be able to look at exactly why candidate A ranked above candidate B.
- An LLM ranking candidates introduces non-determinism and opacity.
- Gemma 4's role is interpretation and communication — it explains the ranked list, it does not produce it.

**The scoring formula:**
```
composite_score = 0.50 × IC50_score (log-scaled, 1.0 at 1nM → 0.0 at 500nM)
               + 0.30 × immunogenicity_score (T-cell activation probability)
               + 0.20 × VAF_score (normalized clonality proxy)
```

All weights are visible in `pipeline/modules/scoring.py`. Changing them requires a code edit, not a prompt.

---

## Decision 7 — Dogs first, humans later

**What we chose:** Build for veterinary oncology (canine), not human oncology.

**Why:**
- Regulatory path for human clinical use is years long and out of scope for a hackathon.
- Canine cancer is biologically similar to human cancer — the same mutations, the same pathways, the same tumor suppressors.
- Vet oncology is under-resourced. The accessibility gap is larger and the barrier to demonstration is lower.
- Treatments validated in dogs frequently translate to human oncology trials.

**Trade-off:** HLA allele databases and training data for predictors are much richer for human alleles than canine DLA alleles. NetMHCpan's canine predictions are less validated than its human predictions.
