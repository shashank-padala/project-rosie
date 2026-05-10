# Project Rosie — Personalized Cancer Vaccines for Dogs

*Gemma4Good · Health & Sciences track · Kaggle hackathon writeup*

**From tumor VCF to a synthesis-ready mRNA vaccine in hours. Gemma 4 is the on-call bioinformatics advisor a vet clinic can't otherwise hire.**

---

## The problem

In late 2025, AI entrepreneur Paul Conyngham, a 17-year machine learning veteran, spent three months in a university research lab designing a personalized neoantigen cancer vaccine for his dog Rosie, by hand. **If that's what it takes for someone with his background, the question of accessibility for a veterinary oncologist with no ML training isn't a question. It's a wall.**

Personalized neoantigen vaccines are one of the most promising emerging cancer treatments. But the design pipeline, from a sequenced tumor to a synthesizable mRNA construct, requires fluency in pVACtools, NetMHCpan, codon optimization, IVT chemistry, and a half-dozen other specialized tools. Vet clinics don't have those people. So dogs that could benefit today don't get vaccines.

**Project Rosie removes that wall.** A vet uploads a tumor variant call file (VCF), the pipeline runs in under six hours on cloud compute (~$15 per case), and four artifacts appear in the dashboard:

1. A ranked list of personalized neoantigen targets
2. A synthesis-ready multi-epitope mRNA construct (FASTA)
3. A plain-language clinical report for the veterinary oncologist
4. A formal mRNA synthesis specification ready to email a contract manufacturer

Live at **rosie.kiraklabs.com** · public demo at **rosie.kiraklabs.com/demo**.

## Architecture

| Layer | Technology |
|---|---|
| Frontend + API | Next.js 16 (App Router) on Vercel |
| Auth, DB, Realtime | Supabase (Postgres + RLS + Realtime) |
| File storage | Google Cloud Storage |
| Pipeline runtime | Python on Cloud Run Jobs (8 Gi, 4 CPU, 3 h timeout) |
| Variant annotation | Ensembl VEP (canine ROS_Cfam_1.0 cache) |
| Neoantigen prediction | pVACtools + NetMHCpan via IEDB |
| Scoring | Transparent Python composite scorer (~50 lines) |
| mRNA design | Biopython + canine codon table |
| Synthesis spec | Jinja template (deliberately *not* LLM-generated; see below) |
| LLM layer | **Gemma 4 (`gemma-4-26b-a4b-it-maas`) via Vertex AI** |

The pipeline is a deterministic Python script that emits HTTP callbacks at each stage. The Next.js frontend subscribes to the case row via Supabase Realtime. The UI's vertical timeline animates live with no polling.

## How we used Gemma 4

Every Health & Sciences entry will use an LLM as a report-writer. That's table stakes. We pushed Gemma 4 into roles that **a deterministic pipeline genuinely cannot perform**: reasoning *before* and *around* the pipeline, not just *after*.

**Role 1 · Pre-flight VCF advisor (proactive).** When the vet uploads a VCF, the browser parses structural facts (variant count, INFO keys, sample columns, somatic-flag presence, chromosomes, FILTER values) and sends them to Gemma. Gemma identifies 0–3 issues that would degrade prediction quality, *before* the user burns 6 hours of compute. Strict JSON output with safe-parse fallback. Never blocks submission.

> *"This VCF has no SOMATIC flag and no NORMAL column. It looks like germline + somatic mixed together. That will inflate your candidate count with non-tumor mutations. Recommend re-running with a matched-normal somatic caller before submitting."*

**Role 2 · Multimodal clinical report writer (reactive).** After the pipeline completes, Gemma reads the candidate JSON, the binding-affinity bar chart (PNG), and the mutation-landscape pie chart (PNG), multimodally, and writes a 400–600 word plain-language clinical report. A species-aware system prompt swaps DLA / HLA / FLA terminology and adjusts IC50 interpretation by species.

**Role 3 · Sensitivity narrator (interactive).** Below the candidates table, the user gets a "What if?" panel with two sliders: IC50 threshold and tumor VAF threshold. The kept/dropped candidates re-rank instantly client-side as they drag (no Gemma round-trip per tick). When they hit *"Ask Gemma to interpret"*, Gemma writes a one-paragraph read on the tradeoff:

> *"Increasing the stringency of binding and allele frequency thresholds filters out your TP53 candidate, leaving only the PIK3CA peptide as a viable target. This narrows your neoantigen pool and results in the loss of essential TP53 coverage for your construct."*

This turns the report from a static document into something the vet can interrogate with their own clinical judgment.

**Role 4 · Conversational case assistant (reactive).** Floating chat widget on the report page. Full case context (sample, top candidates, clinical report) loaded into the system prompt. Plain-language Q&A in seconds.

### What we deliberately did *not* use Gemma for

The mRNA synthesis specification is meant to go verbatim to a CMO (Trilink, Genscript, Aldevron). We initially had Gemma write it. We replaced it with a **Jinja template**. Here's why:

> A formulation scientist who sees a hallucinated catalog number, a drifted QC threshold, or hedged language ("consult your bioinformatician") dismisses the entire tool. All variability in this document is patient/case data. The manufacturing science is fixed (CleanCap® AG cap1 / TriLink Cat# N-7413, 100% m1Ψ substitution, SM-102 LNP at 50:10:38.5:1.5 molar ratio, RIN ≥ 8.0 release criterion, etc.). Templating is the correct tool.

This division (**AI for interpretation, deterministic code for compliance**) is also what makes the tool defensible to a regulator down the road. The pipeline science is reproducible and auditable; Gemma is the interpretation layer on top.

## Key technical decisions

| Decision | Choice | Why |
|---|---|---|
| Input format | VCF, not FASTQ | Cuts Phase 1 setup complexity ~60%. FASTQ ingestion documented as Phase 2 with explicit adoption-ceiling math (5% → 80% of vet clinics). |
| Synthesis spec | Jinja template, not LLM | CMO order documents must be deterministic; see above. |
| Pipeline orchestration | Python on Cloud Run Jobs | Demo story. Nextflow is the production migration path. |
| Clonality | VAF as proxy | PyClone-VI is Phase 2; VAF is a reasonable hackathon proxy. |
| AlphaFold | Excluded from Phase 1 | ~5–10% ranking precision improvement at the cost of GPU hours per case. Wrong ROI yet. |
| Sensitivity re-ranking | Client-side filter | Instant slider feedback at zero Gemma cost. Gemma narrates only on explicit user request. |

## Challenges we overcame

**Species-aware multimodal grounding.** Off-the-shelf Gemma defaults to human oncology framing. A species switch in the system prompt template swaps DLA/HLA/FLA terminology, adjusts IC50 interpretation thresholds, and grounds the report in vet rather than human idioms.

**Real-time pipeline status without polling.** Cloud Run Jobs emit a stage callback after each step (Case Queued → Neoantigen Prediction → Candidate Ranking → Report Generation → mRNA Vaccine Design → Results Ready); Supabase Realtime pushes them straight into the React tree, animating the vertical timeline live.

**Demo data quality.** Initial canine pipeline runs returned a single high-confidence candidate, producing visually trivial charts (one solid bar, one solid circle). We synthesized an enriched demo dataset across the same five oncogenic drivers the synthetic VCF targets (PIK3CA, TP53, BRCA2, KIT, PTEN) and re-rendered visualizations for a more compelling demo without compromising on the canine narrative.

## What's still missing (honest section)

- **No clinician validation yet.** Outreach to OVC Guelph, OICR, and UofT Donnelly Centre comparative oncology groups is in progress.
- **Phase 1 starts from VCF.** Most vet clinics receive FASTQ from their sequencing partner. FASTQ → VCF (BWA-MEM2 + Mutect2) is the single largest adoption lever for Phase 2: ~5% → ~80% addressable vet-clinic market, at ~16× compute cost and ~100× storage. Documented in the README.
- **Tumor-only handling.** Matched-normal calling is preferred; tumor-only flow needs an explicit confidence-discount in ranking. The pre-flight advisor already flags this; Phase 2 acts on it.

## Why this matters beyond the hackathon

Dogs and humans share TP53, PIK3CA, BRCA2, and many other oncogenic drivers. **Canine trials are faster and cheaper than human trials. Every dog case that runs through this pipeline is, scientifically, pre-clinical comparative oncology data.** The playbook for dogs becomes the playbook for humans.

An open-weights model (Gemma 4) means clinics can run the LLM layer on-premise. **Patient sequencing data never has to leave the building.** That's what makes this an open-source product, not a SaaS.

This is what Gemma4Good looks like in practice: a real medical workflow, real patients (the four-legged kind first), open code, defensible engineering, calibrated honesty about its limits. Gemma 4 is used as a thinking partner around a deterministic pipeline, not just a wordsmith at the end of one.

---

**Track:** Health & Sciences
**Code repo:** github.com/shashank-padala/project-rosie
**Live demo:** rosie.kiraklabs.com/demo
