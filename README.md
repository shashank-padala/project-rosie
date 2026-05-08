# Project Rosie

**An open-source AI pipeline for personalized cancer vaccine design — starting with veterinary oncology.**

> Paul Conyngham is a 17-year machine learning veteran. He still needed three months and a university research lab to design one personalized cancer vaccine for his dog Rosie by hand. If that is what it takes for someone with his background, the question of accessibility for a veterinary oncologist with no ML training is not a question — it is a wall. Project Rosie exists to remove that wall.

---

## What It Does

Takes two DNA sequencing files (tumor biopsy + healthy tissue) and produces:

1. A ranked list of personalized neoantigen targets
2. A synthesis-ready mRNA vaccine sequence
3. A plain-language clinical report for the veterinary oncologist
4. A formal mRNA synthesis specification for the RNA manufacturing partner

The entire design process — previously requiring months of expert manual work — runs in under 24 hours, costing approximately $15 in compute.

---

## Architecture

| Component | Technology | Purpose |
|---|---|---|
| Frontend + API | Next.js (App Router) | Clinic dashboard, case submission, status tracker, report viewer, chat widget |
| Auth + Database | Supabase (PostgreSQL + RLS + Realtime) | Case metadata, scores, user auth, real-time pipeline status updates |
| File Storage | Google Cloud Storage | FASTQ, VCF, reports, mRNA sequences. 7-day lifecycle on pipeline work files |
| Pipeline Bridge | Python (FastAPI) on Cloud Run | Two endpoints: trigger pipeline, receive stage completion callbacks |
| Alignment | BWA-MEM2 + Samtools + Picard | Maps reads to CanFam4 reference. Phase 2 only (see decisions below) |
| Mutation Calling | GATK Mutect2 + VarScan2 | Somatic mutation detection. Phase 2 only |
| Neoantigen Prediction | pVACtools + NetMHCpan + DeepImmuno | Peptide candidates, MHC binding affinity, T-cell activation probability |
| Clonality | VAF as proxy (PyClone-VI in Phase 2) | Clonal fraction estimate per mutation |
| Structural Validation | AlphaFold2 | Surface exposure + pLDDT confidence. Phase 2 only |
| mRNA Design | Python + Biopython + canine codon table | Codon-optimized mRNA with 5'UTR, 3'UTR, poly-A tail |
| Scoring | Python threshold pipeline | Hard filters + weighted ranking. Transparent, 50 lines, auditable |
| Gemma 4 | Gemma 4 27B IT via Vertex AI | Five roles: orchestration, multimodal visualization interpretation, clinical report, mRNA spec, conversational assistant |

### Gemma 4 — Five Distinct Roles

**Role 1 — Agentic Pipeline Orchestrator**: Uses native function calling to decide which bioinformatics tools to invoke and in what sequence. bioinformatics tools are registered as callable functions. Gemma 4 routes the pipeline based on VCF characteristics, cancer type, and breed.

**Role 2 — Multimodal Visualization Interpreter**: Binding affinity distribution plots, mutation landscape heatmaps, and (in Phase 2) AlphaFold 3D structure renders are fed as images into Gemma 4's vision input. Extracts signal that parsed JSON cannot provide: spatial protein structure, visual affinity clusters, confidence gradients.

**Role 3 — Clinical Report Generator**: Reasons across all six tool outputs simultaneously using the 256K context window. Produces a plain-language clinical report for the veterinary oncologist.

**Role 4 — mRNA Synthesis Specification**: Generates the formal synthesis spec document for the RNA manufacturing partner. LNP formulation ratios, dosing, cold chain requirements, QC thresholds.

**Role 5 — Conversational Case Assistant**: Chat interface in the report view. Full case context loaded. Vet asks questions in plain language, Gemma 4 answers in seconds.

---

## Key Technical Decisions

These are locked-in for the hackathon build. Document here so we don't re-litigate them mid-build.

| Decision | Choice | Reason |
|---|---|---|
| Input format | Start from VCF, not FASTQ | Cuts setup complexity by ~60%. Alignment (BWA-MEM2, GATK BQSR) is Phase 2. |
| AlphaFold | Excluded from Phase 1 | Needs GPU instance, hours to set up, hours to run. Mention as Phase 2 in writeup. |
| Pipeline orchestration | Python scripts on Cloud Run | Nextflow is the production story. Python is the demo story. Add Nextflow in Phase 2. |
| mRNA design | Python + Biopython + canine codon table | LinearDesign has complex setup and licensing. Codon optimization is straightforward Python. |
| Clonality | VAF as proxy | PyClone-VI adds complexity. Variant allele frequency is a reasonable proxy for hackathon. |
| HLA alleles | DLA-88*508:01, DLA-88*509:01 | Most common documented DLA alleles in canine research literature. Hardcode for demo. |
| Demo dataset | Canine mammary tumor VCF from Figshare | Nature Scientific Data paper, 185 matched tumor/normal pairs. Biologically analogous to human breast cancer. |
| Fallback dataset | pVACtools sample data | `pvacseq download_example_data .` — working annotated VCF in under 5 minutes. Use to validate pipeline logic before touching canine data. |

---

## Implementation Plan

**Hackathon deadline: ~May 18, 2026. Today: May 8. 10 days.**

### Milestone 1: Bioinformatics Core — VCF to Ranked Candidates
**Target: May 10 | Highest risk**

- [ ] Install pVACtools + VEP via Docker (use official pVACtools image — bundles VEP)
- [ ] Download pVACtools sample data: `pvacseq download_example_data .`
- [ ] Run `pvacseq run` against sample VCF — confirm `.tsv` of peptide candidates with IC50 scores is produced
- [ ] Download one matched tumor/normal VCF pair from Figshare canine mammary tumor dataset (smallest file size pair)
- [ ] Annotate canine VCF with VEP against Ensembl CanFam4 reference (download canine VEP cache ~10GB)
- [ ] Run pVACseq on canine VCF using DLA alleles: `DLA-88*508:01,DLA-88*509:01`
- [ ] Write Python scoring script: filter IC50 > 500nM, rank by weighted score (IC50 + VAF), output top 20 candidates as JSON
- [ ] **Done**: canine VCF in → ranked candidates JSON out, locally, end to end

> **Fallback if VEP canine annotation takes more than half a day**: skip VEP, pre-process the canine VCF to match pVACtools annotated format using a Python script. Unblocks everything else.

---

### Milestone 2: Gemma 4 Integration — Orchestrator + Report Generator
**Target: May 12**

- [ ] GCP setup: create project, enable Vertex AI API, create service account (Vertex AI User role), download JSON key
- [ ] Confirm Gemma 4 27B IT access on Vertex AI (Model Garden → serverless endpoint)
- [ ] Define function calling schema: JSON schemas for `run_pvacseq`, `run_netmhcpan`, `score_candidates`, `generate_visualizations`
- [ ] Build orchestration agent: Gemma 4 receives VCF metadata (mutation count, cancer type, breed) and calls functions in sequence until it emits no more tool calls
- [ ] Generate matplotlib visualizations from scoring output: binding affinity distribution (bar chart, top 20), mutation burden summary (pie chart of mutation types). Save as PNG.
- [ ] Multimodal step: encode PNGs as base64 → send to Gemma 4 vision alongside candidate JSON → store interpretation
- [ ] Clinical report prompt: ~500-word system prompt with veterinary oncology context + tone instructions + 2-3 few-shot report paragraph examples. Input: ranked JSON + multimodal interpretation. Output: vet-readable report.
- [ ] mRNA synthesis spec prompt: top 5 candidates → formal spec document (LNP ratios, dosing, cold chain, QC thresholds)
- [ ] **Done**: ranked candidates JSON in → clinical report out, quality-reviewed by reading it critically

---

### Milestone 3: mRNA Sequence Design
**Target: May 12 (parallel with M2)**

- [ ] Get canine codon usage table from HIVE Codon Usage Database (Canis lupus familiaris, free, public)
- [ ] Python function: top 3 neoantigen peptides → back-translate to DNA using optimized canine codons → add 5'UTR (beta-globin UTR) + 3'UTR + 60-nt poly-A tail
- [ ] GC content check: confirm 45-55% range
- [ ] Output: FASTA file ready for RNA synthesis lab
- [ ] **Done**: top 3 neoantigens from canine mammary tumor case → synthesis-ready FASTA

---

### Milestone 4: Next.js Frontend + API
**Target: May 14**

- [ ] Supabase project: create, set up `cases` table (id, clinic_id, status, created_at, report_url, mrna_url), enable Realtime
- [ ] GCS bucket: create, set lifecycle policy (7-day delete on pipeline work files), signed URL helper in Next.js API route
- [ ] Case submission page: drag-and-drop VCF upload → GCS → Supabase insert → Cloud Run trigger → progress indicator
- [ ] Pipeline status page: Supabase Realtime subscription on case row → live status updates as stages complete (no polling)
- [ ] Report viewer page: renders clinical report in clean typography. Download buttons for report PDF and mRNA FASTA.
- [ ] Chat widget: floating button on report page → Gemma 4 with full case context loaded → streamed response
- [ ] Auth: Supabase Auth, email/password, single clinic login for demo
- [ ] **Done**: upload VCF from browser → watch status update live → read report → ask chat widget a question

---

### Milestone 5: Cloud Deployment
**Target: May 15**

- [ ] Containerize Python pipeline: single Dockerfile with pVACtools + VEP cache + all Python dependencies. Push to Artifact Registry.
- [ ] Cloud Run Job: deploy pipeline container as a Cloud Run Job (batch workload, not a service)
- [ ] Cloud Run bridge service (FastAPI, ~150 lines): `POST /trigger` (accepts VCF GCS path + case ID, starts Cloud Run Job) + `POST /callback` (pipeline stage completion → write status to Supabase)
- [ ] Secret Manager: wire `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_APPLICATION_CREDENTIALS`, `GCS_BUCKET` into Cloud Run
- [ ] Vercel deployment: set `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLOUD_PROJECT` as env vars
- [ ] **Done**: upload VCF from deployed web app → Cloud Run job completes → report appears in browser

---

### Milestone 6: Demo-Ready — End to End on Real Canine Data
**Target: May 16**

- [ ] Run full deployed pipeline on canine mammary tumor VCF from Figshare
- [ ] Read generated clinical report critically: does the prioritization reasoning make sense? Is uncertainty communicated honestly? Is the language appropriate for a vet?
- [ ] Fix the 3 most obvious problems in the report prompt
- [ ] Record 3-minute Loom: upload → pipeline runs → report appears → chat question answered (basis for hackathon video)
- [ ] Record 5-minute version for vet/professor: slower, explains each section, asks for specific feedback
- [ ] **Done**: have a real clinical report you'd be confident showing a veterinary oncologist

---

### Milestone 7: Validation Outreach
**Target: Start May 13, runs in parallel**

Don't wait for the tool to be done. Send emails now with the blog as proof of concept.

**Contacts to reach:**
- Ontario Veterinary College (OVC), University of Guelph — Mona Campbell Centre for Animal Cancer. Best veterinary oncology program in Canada. Look for faculty in Clinical Studies.
- UofT Donnelly Centre for Cellular and Biomolecular Research — computational biology / genomics. Will understand pipeline validity.
- Ontario Institute for Cancer Research (OICR), Toronto — cancer genomics, most likely to respond quickly to a technical pitch.

**Email template (4 sentences):**
> "I built an open-source AI pipeline that automates personalized cancer vaccine design for dogs using Gemma 4. A case that took a 17-year ML veteran three months and a university lab now takes 24 hours. I'd value 30 minutes of your time to review the clinical report output and tell me what's wrong. Here's the write-up: [blog link]."

- [ ] Send to 5-8 people across those institutions
- [ ] Prepare 1-page validation guide: what you're asking them to evaluate (report quality, candidate prioritization logic, what's missing for clinical use)
- [ ] **Done**: at least one call or email exchange with feedback before May 18

---

### Milestone 8: Hackathon Submission
**Target: May 17-18**

- [ ] GitHub: clean README with setup instructions, architecture diagram (Excalidraw → PNG), link to live demo
- [ ] Kaggle writeup: blog content + architecture diagram + validation feedback if received
- [ ] Video (3 minutes): Rosie story (20s) → problem statement (20s) → demo walkthrough (90s) → Gemma 4's role (30s) → vision (20s). Face on camera.
- [ ] Submit

---

## The Narrative

> "Paul Conyngham spent months building this by hand with a university lab. We built the tool that lets any veterinary oncologist do it in 24 hours — with an open-weights model that clinics can run locally, keeping patient sequencing data on-premise."

Dogs and humans share TP53 and PIK3CA mutations. Canine trials are faster and cheaper than human trials. Every dog case that runs through this pipeline is, scientifically, pre-clinical comparative oncology data. The playbook for dogs becomes the playbook for humans.

---

## Reference

- [Blog: The Case for Personalized Canine Cancer Vaccines](docs/blog-01-cancer-vaccine-case.md) — the human story, Paul Conyngham, why this matters
- [Blog: Open Source AI Pipeline Architecture](docs/blog-02-ai-pipeline-architecture.md) — technical deep dive, Gemma 4 integration, architecture decisions
- [Hackathon: Gemma4Good — Health & Sciences track](https://www.kaggle.com/competitions/gemma4good)
- [Demo Dataset: Canine Mammary Tumor VCF (Figshare)](https://figshare.com) — Nature Scientific Data, 185 matched tumor/normal pairs
- [pVACtools Documentation](https://pvactools.readthedocs.io)
- [Gemma 4 on Vertex AI](https://cloud.google.com/vertex-ai/generative-ai/docs/open-models/use-gemma)

---

## Project Status

Built by Shashank Padala, Kirak Labs, Toronto.
Hackathon submission for Gemma4Good — Health & Sciences track.
Seeking: vet oncologist or computational biology researcher at UofT / OVC Guelph for validation partnership.
