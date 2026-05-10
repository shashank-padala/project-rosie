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

---

## Decision 8 — Templated mRNA synthesis spec, not LLM-generated

**What we chose:** The mRNA synthesis specification (the document a vet emails to a CMO like Trilink or Genscript) is rendered from a Jinja template. Patient/case-specific fields are populated from structured pipeline output; the manufacturing parameters (cap analog, modifications, LNP ratios, QC release criteria) are deterministic constants.

**What we initially built:** Gemma 4 generated the synthesis spec from a structured prompt. We replaced it.

**Why:**
- The spec is intended to be sent **verbatim** to a contract manufacturer. A formulation scientist who sees a hallucinated catalog number, a drifted QC threshold, or hedged language ("consult your bioinformatician") will dismiss the entire tool — and rightly so.
- All variability in this document is patient/case data. The manufacturing science is fixed: CleanCap® AG cap1 (TriLink Cat# N-7413), 100% N1-methylpseudouridine substitution, SM-102 LNP at 50:10:38.5:1.5 molar ratio, RIN ≥ 8.0 release criterion, etc.
- Templating is the correct tool for "deterministic structure, parameterized data."

**Implementation:** `pipeline/templates/synthesis_spec.md.j2` + `pipeline/modules/synthesis_spec.py`. The pipeline calls `generate_synthesis_spec(design_data, candidates_json_path)` after `mrna_design()`.

**Trade-off:** None worth noting. The previous LLM-generated version offered no value the template doesn't, and added measurable risk.

**Principle this represents:** *AI for interpretation, deterministic code for compliance.*

---

## Decision 9 — Gemma as advisor, not just report-writer

**What we chose:** Two new Gemma touchpoints around the deterministic pipeline:

1. **Pre-flight VCF advisor** — runs on the submit page *before* the pipeline kicks off. The browser parses structural facts from the uploaded VCF (variant count, INFO keys, sample columns, somatic-flag presence, chromosomes, FILTER values) and sends them to Gemma. Gemma identifies 0–3 issues that would meaningfully degrade neoantigen prediction quality (mixed germline+somatic, no matched normal, all variants non-PASS, etc.). Returns typed advisory notes (info / warning / critical). Never blocks submission.

2. **Sensitivity narrator** — runs on the report page *after* the pipeline completes. The user moves IC50 and tumor VAF threshold sliders; the kept/dropped candidates re-rank instantly client-side (no Gemma cost per slider tick). On explicit request ("Ask Gemma to interpret"), Gemma writes a one-paragraph plain-English read on the tradeoff.

**Why:** A pure "report-writer at the end of the pipeline" is what every Health & Sciences track entry will use Gemma for — table stakes. The advisor framing puts Gemma into roles a deterministic pipeline genuinely cannot perform: reasoning *before* the run (catching VCF issues that would otherwise cost the user 6 hours of compute) and reasoning *across* what-if scenarios (interactive interpretation rather than static output).

**Why this division is also defensible to a clinician/regulator:** The pipeline science remains deterministic and auditable. Gemma is purely an interpretation layer on top — it does not change which candidates survive, which thresholds apply, or which FASTA gets shipped. That separation is the framing that makes the tool acceptable in a clinical setting once it eventually moves there.

**Implementation:**
- `src/lib/vcf-stats.ts` (browser-side parser)
- `src/app/api/vcf-advisor/route.ts` (Gemma endpoint)
- `src/components/VcfAdvisor.tsx` (UI on `/submit`)
- `src/lib/sensitivity.ts` (client-side re-rank)
- `src/app/api/cases/[id]/sensitivity-narrate/route.ts` (Gemma endpoint)
- `src/components/SensitivityPanel.tsx` (UI on `/cases/[id]` and `/demo`)

**Trade-off:** Each Gemma call costs latency (~2–5 s) and quota on the Vertex AI MaaS endpoint. Pre-flight is auto-triggered on file select (one call per file); sensitivity narration requires explicit click. Both are designed to bound cost without making the feature feel transactional.
