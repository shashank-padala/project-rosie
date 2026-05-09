# Project Rosie

**An open-source AI pipeline for personalized cancer vaccine design — starting with veterinary oncology.**

> Paul Conyngham is a 17-year machine learning veteran. He still needed three months and a university research lab to design one personalized cancer vaccine for his dog Rosie by hand. If that is what it takes for someone with his background, the question of accessibility for a veterinary oncologist with no ML training is not a question — it is a wall. Project Rosie exists to remove that wall.

**Live:** [rosie.kiraklabs.com](https://rosie.kiraklabs.com) · **Demo:** [rosie.kiraklabs.com/demo](https://rosie.kiraklabs.com/demo)

---

## What It Does

Takes a tumor VCF (somatic variant call file from sequencing) and produces:

1. A ranked list of personalized neoantigen targets
2. A synthesis-ready mRNA vaccine sequence
3. A plain-language clinical report for the veterinary oncologist
4. A formal mRNA synthesis specification for the RNA manufacturing partner

The entire design process — previously requiring months of expert manual work — runs in <6 hours, costing approximately $15 in compute.

---

## Architecture

| Component | Technology | Purpose |
|---|---|---|
| Frontend + API | Next.js 16 (App Router) | Clinic dashboard, case submission, live status timeline, report viewer, chat widget |
| Auth + Database | Supabase (PostgreSQL + RLS + Realtime) | Case metadata, scores, user auth, real-time pipeline status updates |
| File Storage | Google Cloud Storage | VCF uploads, reports, mRNA sequences. 30-day lifecycle on pipeline work files |
| Pipeline | Python on Cloud Run Jobs | Downloads VCF from GCS, runs all 5 pipeline stages, POSTs progress callbacks after each stage |
| Neoantigen Prediction | pVACtools + NetMHCpan | Peptide candidates, MHC binding affinity scoring across all DLA alleles |
| mRNA Design | Python + Biopython + canine codon table | Codon-optimized mRNA with 5'UTR, 3'UTR, poly-A(60) tail |
| Scoring | Python threshold pipeline | IC50 < 500 nM filter + weighted ranking. Transparent, auditable, ~50 lines |
| Gemma 4 | Gemma 4 27B IT via Vertex AI | Clinical report generation, multimodal chart interpretation, conversational assistant |
| Auth (GCP) | Workload Identity Federation | Vercel → GCP OIDC — no service account keys |

### Gemma 4 — Three Active Roles

**Role 1 — Multimodal Visualization Interpreter**: Binding affinity distribution plots and mutation landscape charts are encoded as base64 PNGs and sent to Gemma 4's vision input alongside the candidate JSON. Extracts signal that parsed data alone cannot provide.

**Role 2 — Clinical Report Generator**: Reasons across all pipeline outputs using the full context window. Produces a plain-language clinical report written for the veterinary oncologist, not the bioinformatician.

**Role 3 — Conversational Case Assistant**: Chat interface in the report view. Full case context loaded. Vet asks questions in plain language, Gemma 4 answers in seconds.

---

## Key Technical Decisions

| Decision | Choice | Reason |
|---|---|---|
| Input format | Start from VCF, not FASTQ | Cuts setup complexity by ~60%. Alignment (BWA-MEM2, GATK BQSR) is Phase 2. |
| AlphaFold | Excluded from Phase 1 | Needs GPU instance, hours to set up, hours to run. Mention as Phase 2 in writeup. |
| Pipeline orchestration | Python scripts on Cloud Run Jobs | Nextflow is the production story. Python is the demo story. |
| mRNA design | Python + Biopython + canine codon table | LinearDesign has complex setup and licensing. Codon optimization is straightforward Python. |
| Clonality | VAF as proxy | PyClone-VI adds complexity. Variant allele frequency is a reasonable proxy for hackathon. |
| HLA alleles | DLA-8850101, DLA-8850801 | Most common documented DLA alleles in canine research literature. |
| Demo dataset | Canine mammary tumor VCF | Synthetic somatic VCF with real ROS_Cfam_1.0 coordinates in TP53, BRCA2, PTEN, PIK3CA, KIT genes |

---

## Current Status

### ✅ Completed

**Pipeline Core (M1)**
- pVACtools + NetMHCpan running via IEDB API on DLA-8850101 + DLA-8850801 alleles
- Scoring pipeline: IC50 < 500 nM filter, VAF-weighted ranking, top 20 candidates as JSON
- Validated on HCC1395 benchmark: 191,645 epitopes → 1,648 candidates → top 20 ranked

**Gemma 4 Integration (M2)**
- Vertex AI global endpoint, multimodal input: candidate JSON + 2 PNGs → clinical report
- Clinical report mentions canine species, DLA alleles by name, correct IC50 interpretation

**mRNA Sequence Design (M3)**
- Top epitopes → codon-optimized CDS → 5'UTR, Kozak, AAY linkers, 3'UTR, poly-A(60)
- 251 nt construct, 54.8% GC in CDS (canine codon table applied)

**Frontend + API (M4)**
- Landing page, demo viewer, auth (email/password), dashboard, submit form, case report page
- Vertical pipeline timeline: 6-step live status tracker with spinning 🐾 per active stage
- Side navigation (AppShell) for logged-in users; public pages accessible without login
- Supabase Realtime subscription: case status updates without polling
- Gemma 4 chat widget: full case context in every message

**Cloud Deployment (M5)**
- Browser → GCS resumable upload → Cloud Run Job → stage callbacks → Supabase Realtime → report
- Cloud Run Job: 8Gi RAM, 4 CPU, 3h timeout, `us-central1`
- Workload Identity Federation: Vercel OIDC → GCP (no service account keys)
- Pipeline trigger awaited at submission; failures mark case `failed` immediately

**Canine Data — Local Validation (M6, partial)**
- VEP CanFam4 (ROS_Cfam_1.0, v115) cache downloaded and running
- Synthetic canine somatic VCF with real coordinates in TP53, BRCA2, PTEN, PIK3CA, KIT
- pVACseq + scoring + Gemma 4 report + mRNA design — all stages validated locally
- Strong neoantigen identified: PIK3CA V125M → MPMCEFDMVK, IC50 128 nM on DLA-8850801

---

### 🔄 In Progress

**End-to-end cloud submission on canine VCF**
- Cloud pipeline confirmed live; corrected `NEXT_PUBLIC_APP_URL` env var on Vercel
- Re-submit UI added for failed cases; pipeline error surfaced immediately on failure
- Remaining: submit annotated canine VCF through web app → confirm cloud run completes → verify report

---

### ⬜ TODO

**Validation Outreach (M7)**
- [ ] Send to 5–8 researchers across OVC Guelph / UofT Donnelly Centre / OICR
- [ ] Prepare 1-page validation guide: what to evaluate, what's missing for clinical use

**Hackathon Submission (M8)**
- [ ] Record 3-minute Loom: upload → pipeline runs → report appears → chat question answered
- [ ] Kaggle writeup: blog content + architecture diagram + validation feedback
- [ ] GitHub: clean setup instructions, architecture diagram (Excalidraw → PNG)
- [ ] Submit before deadline

---

## Milestone Tracker

| Milestone | Description | Status |
|---|---|---|
| M1 — Pipeline Core | Bioinformatics core validated on HCC1395 benchmark | ✅ Done |
| M2 — Gemma 4 | Vertex AI, multimodal input, clinical report generator | ✅ Done |
| M3 — mRNA Design | Biopython + canine codon table, synthesis-ready FASTA | ✅ Done |
| M4 — Frontend | Case submission, live status timeline, report viewer, chat | ✅ Done |
| M5 — Cloud | GCS upload, Cloud Run Job, WIF auth, Realtime callbacks | ✅ Done |
| M6 — Canine Data | VEP + DLA alleles + end-to-end cloud run on real canine VCF | 🔄 In Progress |
| M7 — Validation | Outreach to OVC Guelph / UofT / OICR | ⬜ Not started |
| M8 — Submission | Video, Kaggle writeup, GitHub cleanup | ⬜ Not started |

---

## The Narrative

> "Paul Conyngham, an AI entrepreneur from Australia, spent months in December 2025 building a personalized cancer vaccine for his dog by hand with a university research lab. We built the tool that lets any veterinary oncologist do it in under 6 hours, with an open-weights model that clinics can run locally and keep patient sequencing data on-premise."

Dogs and humans share TP53 and PIK3CA mutations. Canine trials are faster and cheaper than human trials. Every dog case that runs through this pipeline is, scientifically, pre-clinical comparative oncology data. The playbook for dogs becomes the playbook for humans.

---

## Reference

- [Blog: The Case for Personalized Canine Cancer Vaccines](docs/blog-01-cancer-vaccine-case.md)
- [Blog: Open Source AI Pipeline Architecture](docs/blog-02-ai-pipeline-architecture.md)
- [Hackathon: Gemma4Good — Health & Sciences track](https://www.kaggle.com/competitions/gemma4good)
- [pVACtools Documentation](https://pvactools.readthedocs.io)
- [Gemma 4 on Vertex AI](https://cloud.google.com/vertex-ai/generative-ai/docs/open-models/use-gemma)

---

## Documentation for Non-Biology Readers

- [From DNA to Vaccine Candidates](docs/explainers/01-from-dna-to-vaccine-candidates.md) — Every step of the pipeline explained in plain English, plus a biology glossary
- [Key Architecture Decisions](docs/explainers/02-key-decisions.md) — Why VCF not FASTQ, why NetMHCpan, why no AlphaFold in Phase 1
- [Frontend Architecture](docs/explainers/03-frontend-architecture.md) — Next.js structure, Supabase data model, report viewer, chat widget
- [Cloud Deployment Architecture](docs/explainers/04-cloud-deployment.md) — GCS, Cloud Run Jobs, WIF, callback pattern for live status

---

Built by Shashank Padala, Kirak Labs, Toronto.
Hackathon submission for [Gemma4Good](https://www.kaggle.com/competitions/gemma4good) — Health & Sciences track.
