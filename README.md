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

The entire design process — previously requiring months of expert manual work — runs in <6 hours, costing approximately $15 in compute.

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

### Milestone 1: Pipeline Core — VCF to Ranked Candidates
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
**Target: May 14 | ✅ Complete**

- [x] Supabase `cases` table: schema with RLS, realtime enabled, demo policy for `user_id IS NULL` cases
- [x] Auth: Supabase Auth email/password — login, signup with email confirmation, redirect to dashboard
- [x] Landing page: hero, problem stats (3 months → 24 hours, $10K → $15), how-it-works, feature cards, footer
- [x] Demo page `/demo`: auto-loads seeded HCC1395 benchmark case, full read-only report viewer
- [x] Report viewer (tabbed): Clinical Report (markdown) | Candidates table (sortable, color-coded IC50) | mRNA Design (FASTA viewer + copy/download) | Charts (base64 PNGs from pipeline)
- [x] Case submission form `/submit`: 3-step (patient info → alleles with presets → VCF drag-and-drop → POST `/api/cases`)
- [x] Dashboard `/dashboard`: protected, lists user's cases with status badges, empty state CTA
- [x] Case report page `/cases/[id]`: protected per-user, full report viewer + Gemma 4 chat
- [x] Chat widget: floating "Ask Gemma 4" bubble → expands to chat panel → `POST /api/cases/[id]/chat` → Gemma 4 with case context
- [x] API routes: `GET/POST /api/cases`, `GET /api/cases/[id]`, `POST /api/cases/[id]/chat`
- [x] Seed script `scripts/seed_demo.py`: loads HCC1395 pipeline output → Supabase with base64 charts + mRNA FASTA
- [x] TypeScript clean, production build passing (11 routes, 0 errors)
- [x] GCS bucket + resumable upload URL helper (`/api/upload-url`)
- [x] Supabase Realtime subscription on `/cases/[id]` — live status without polling
- [x] **Done**: landing page live, demo viewer working with seeded HCC1395 data, auth flow complete, chat wired to Gemma 4

---

### Milestone 5: Cloud Deployment
**Target: May 15 | ✅ Complete**

- [x] `pipeline/run_cloud.py` — Cloud Run Job entry point: downloads VCF from GCS, runs all 5 pipeline stages, POSTs progress callbacks after each stage
- [x] `pipeline/Dockerfile` — ENTRYPOINT updated to `run_cloud.py`
- [x] Docker image built locally, pushed to Artifact Registry (`us-central1-docker.pkg.dev/project-1ea30ea7-dc79-4a14-84b/rosie-pipeline/pipeline:latest`)
- [x] Cloud Run Job created: `rosie-pipeline` (8Gi RAM, 4 CPU, 3h timeout, us-central1)
- [x] GCS bucket: `project-rosie-pipeline` with 30-day lifecycle rule
- [x] Workload Identity Federation: Vercel → GCP auth via OIDC (no service account key — org policy blocks key creation)
- [x] `/api/upload-url` — returns GCS resumable upload URI for direct browser→GCS upload
- [x] `/api/cases/[id]/progress` — callback endpoint pipeline calls after each stage (secret-authenticated)
- [x] `/api/cases` POST — triggers Cloud Run Job via REST API after case insert
- [x] Vercel env vars: `GCS_BUCKET`, `GCP_PROJECT_ID`, `CLOUD_RUN_JOB_NAME`, `PIPELINE_CALLBACK_SECRET`, `NEXT_PUBLIC_APP_URL`
- [x] **Done**: VCF upload → Cloud Run Job → stage callbacks → Supabase Realtime → report in browser

---

### Milestone 6: Demo-Ready — End to End on Real Canine Data
**Target: May 16 | ✅ Complete**

- [x] VEP CanFam4 (ROS_Cfam_1.0, v115) cache downloaded locally (~1.5GB)
- [x] Synthetic canine somatic VCF created with real ROS_Cfam_1.0 coordinates in TP53, BRCA2, PTEN, PIK3CA, KIT genes (10 variants, verified reference alleles via Ensembl REST API)
- [x] VEP annotation run locally via Docker — 4 missense variants annotated with CSQ, Wildtype, Frameshift fields
- [x] pVACseq run with NetMHCpan via IEDB API on DLA-8850101 + DLA-8850801 alleles — 304 epitope predictions
- [x] 1 strong neoantigen identified: PIK3CA V125M → MPMCEFDMVK, IC50 128 nM on DLA-8850801 (top 0.09 percentile)
- [x] Scoring, visualizations, Gemma 4 clinical report, mRNA design — all stages ran end-to-end locally
- [x] Clinical report mentions canine species, DLA-8850801 allele by name, correct IC50 interpretation
- [x] mRNA FASTA produced: 251 nt construct, 54.8% GC in CDS (canine codon table applied)
- [x] `run_cloud.py` — SKIP_PREDICTION + GCS_TSV_PATH env vars added (skip pVACseq with pre-computed TSV)
- [x] `annotation.py` — fixed for VEP v115, ROS_Cfam_1.0 assembly, Wildtype+Frameshift plugins, single-mount Docker workaround for WSL2
- [x] `gemma.py` — system prompt updated with canine/DLA-specific context
- [x] Submit form DLA preset updated to `DLA-8850101,DLA-8850801` (removed DLA-12*00101, unsupported by NetMHCpan 4.2)
- [ ] End-to-end web app submission with annotated canine VCF → cloud pipeline
- [ ] Record 3-minute Loom: upload → pipeline runs → report appears → chat question answered (basis for hackathon video)
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
> "I built an open-source AI pipeline that automates personalized cancer vaccine design for dogs using Gemma 4. A case that took a 17-year ML veteran three months and a university research lab now takes under 6 hours. I'd value 30 minutes of your time to review the clinical report output and tell me what's wrong. Here's the write-up: [blog link]."

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

> "Paul Conyngham spent months building this by hand with a university lab. We built the tool that lets any veterinary oncologist do it in <6 hours — with an open-weights model that clinics can run locally, keeping patient sequencing data on-premise."

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

## Documentation for Non-Biology Readers

The pipeline makes decisions and uses concepts that are non-obvious without a biology background. These explainers are written for software engineers and ML practitioners:

- [From DNA to Vaccine Candidates — The Full Journey](docs/explainers/01-from-dna-to-vaccine-candidates.md) — What happens before a VCF file exists, every step of the pipeline explained in plain English, and a glossary of biology terms.
- [Key Architecture Decisions](docs/explainers/02-key-decisions.md) — Why we start at VCF (not FASTQ), why NetMHCpan over MHCflurry, why no AlphaFold in Phase 1, why scoring is deterministic Python not an LLM.
- [Frontend Architecture — M4 Web App](docs/explainers/03-frontend-architecture.md) — How the Next.js app is structured, the Supabase data model, the report viewer design, and how the Gemma 4 chat widget connects to case context.
- [Cloud Deployment Architecture — M5](docs/explainers/04-cloud-deployment.md) — How the pipeline runs in the cloud: GCS, Cloud Run Jobs, Workload Identity Federation, and the callback pattern for live status updates.

---

## Project Status

Built by Shashank Padala, Kirak Labs, Toronto.
Hackathon submission for Gemma4Good — Health & Sciences track.
Seeking: vet oncologist or computational biology researcher at UofT / OVC Guelph for validation partnership.

---

## Milestone Tracker

| Milestone | Description | Status | Notes |
|---|---|---|---|
| M1 — Pipeline Core | Bioinformatics core: pipeline validated on HCC1395 benchmark | ✅ Done | 191,645 epitopes → 1,648 candidates → top 20 ranked. TESK1 (IC50=3.5nM), FLNA confirmed as oncology genes. |
| M2 | Gemma 4 integration: Vertex AI, function calling, clinical report | ✅ Done | Gemma 4 on Vertex AI global endpoint. Multimodal: JSON + 2 PNGs → clinical report. Validated on HCC1395. |
| M3 | mRNA sequence design: Biopython + canine codon table | ✅ Done | Top 3 epitopes (TESK1+FLNA+MC4R) → codon-optimized CDS → FASTA + design summary. CDS GC 68.5% ✓ |
| M4 | Next.js frontend: case submission, live status, report viewer, chat | ✅ Done | 11 routes, clean build. Landing page, demo viewer (HCC1395 seeded), auth, dashboard, submit form, report tabs, Gemma 4 chat widget. GCS + Realtime deferred to M5. |
| M5 — Cloud Deployment | GCS upload, Cloud Run Job, WIF auth, Realtime status | ✅ Done | Browser→GCS resumable upload. Cloud Run Job (8Gi/4CPU/3h). WIF replaces SA keys. Stage callbacks update Supabase in real time. |
| M6 — Canine Data | VEP annotation + DLA alleles + end-to-end deployed run on real canine mammary tumor VCF | ⬜ Not started | Absorbs parked M1-Day2 canine validation work |
| M7 | Validation outreach: OVC Guelph / UofT / OICR | ⬜ Not started | — |
| M8 | Hackathon submission: video, Kaggle writeup | ⬜ Not started | Deadline: May 18, 7:59 PM EDT |
