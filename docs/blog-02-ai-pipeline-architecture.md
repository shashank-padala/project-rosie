# Project Rosie: The Larger Vision

*The Phase 2+ architecture for an open-source personalized cancer vaccine platform. Where Gemma 4's native function calling, multimodal vision, and 256K context become the irreplaceable intelligence layer in a fully agentic clinical pipeline.*

> **How to read this doc.** The hackathon submission ([writeup](hackathon-writeup.md), [README](../README.md)) covers what's shipped today: a deterministic Python pipeline starting from a VCF, with Gemma 4 acting as a pre-flight advisor, multimodal report writer, sensitivity narrator, and conversational case assistant. **This document is the larger vision.** It describes where the platform grows from there: full FASTQ ingestion, agentic tool orchestration, structural validation with AlphaFold, multi-cancer support, and the path to compassionate-use veterinary deployment that becomes the playbook for human trials. Many of the components below are Phase 2+ targets, not currently running. They are written in declarative tense to communicate the architectural target clearly.

*Originally drafted: April 21, 2026 · padala.ai · Track: Health & Sciences · Gemma4Good Hackathon*

---

## The Problem

In late 2025, Paul Conyngham's rescue dog Rosie was diagnosed with terminal mast cell cancer. Working nights and weekends, he used free AI tools, a $3,000 DNA sequencing run, and researchers at the University of New South Wales to design a personalized mRNA cancer vaccine. The tumor on Rosie's leg shrank by 75% within a month. Researchers called it the first personalized cancer vaccine ever designed for a dog.

> **Conyngham is a 17-year machine learning veteran. He still needed three months and an active university research lab to do this once, for one dog. If that is what it takes for someone with his background, the question of accessibility for a veterinary oncologist with no ML training is not even a question — it is a wall. That is the problem Project Rosie exists to remove.**

What Conyngham demonstrated by hand over several months is exactly what Moderna and Merck are spending billions to industrialize for human patients. Their Phase 3 personalized melanoma vaccine showed a 49% reduction in cancer recurrence at five-year follow-up. The biology is the same. The open source tools exist. What does not exist is software that connects them into a pipeline repeatable by anyone, anywhere, without a PhD team.

> 6 million dogs are diagnosed with cancer annually in the US alone. No personalized cancer vaccine product exists in veterinary oncology today. And every dog case that runs through this pipeline is, scientifically, pre-clinical comparative oncology data that directly informs the human pathway.

The bottleneck is not the science. It is the intelligence layer that connects existing tools and interprets their outputs in a way clinicians can act on. That is the gap Project Rosie fills, and that is where Gemma 4 plays a decisive role.

---

## What Project Rosie Does

Project Rosie is an open source AI pipeline that takes two DNA sequencing files (one from a tumor biopsy, one from healthy tissue) and produces a ranked list of personalized neoantigen targets, a synthesis-ready mRNA vaccine sequence, and a plain-language clinical report. The entire design process, previously requiring months of expert manual work, runs in under 24 hours on Google Cloud infrastructure costing approximately $15 per case.

**Step 1 — Two DNA sequencing files arrive.**
One from the tumor, one from healthy tissue. FASTQ files containing millions of short DNA fragments.

**Step 2 — Software compares tumor DNA against healthy DNA.**
GATK aligns both to the reference genome and identifies every position where the tumor has a different DNA letter. These are somatic mutations — changes that happened only in the cancer cells.

**Step 3 — AI predicts which mutations produce a neoantigen.**
Neural networks like NetMHCpan predict which mutant protein fragments will be displayed on the cancer cell surface as a recognizable flag. Most mutations produce nothing useful. A few produce exactly the target you want.

**Step 4 — AlphaFold validates the structural candidates.**
For the top 20 candidates, AlphaFold predicts 3D protein structure to confirm the mutated region is surface-exposed and accessible to the immune system. A buried mutation is useless regardless of its other scores.

**Step 5 — The software designs the mRNA instruction.**
Using LinearDesign and canine codon optimization tables, it writes the mRNA sequence that will teach the immune system to recognize the selected neoantigens. Output is a text file ready for an RNA synthesis lab to manufacture.

**Step 6 — Gemma 4 has been orchestrating the pipeline throughout — and now generates the final documents.**
Using native function calling, Gemma 4 has been deciding which bioinformatics tools to invoke at each stage and interpreting their visual outputs via multimodal vision. At this final step it generates two actionable documents: a plain-language clinical report for the veterinary oncologist and a formal mRNA synthesis specification for the RNA manufacturing partner.

**Step 7 — The vaccine is manufactured, administered, and monitored. Outcomes feed back into the system.**
A partner RNA synthesis lab manufactures the physical mRNA vaccine. A veterinary oncologist administers it. Tumor response and T-cell activity are monitored over weeks. Outcome data — which neoantigens triggered an immune response, whether the tumor shrank — is captured back into the platform, calibrating scoring weights against real clinical results. The pipeline gets smarter with every dog it helps.

> Steps 2 through 6 are entirely software. They run on cloud infrastructure and cost roughly $15 in compute. Step 7 is where the physical world takes over. Right now, no product connects all of this end to end.

---

## How Gemma 4 Is Used

Neoantigen ranking is handled by a transparent threshold scoring pipeline, not by a language model. Hard filters eliminate candidates with IC50 above 500nM, pLDDT below 70, or self-similarity above 80% to normal proteins. Remaining candidates are ranked by a weighted sum of immunogenicity score, clonality fraction, and MHC stability. This logic is 50 lines of Python, fully explainable, and published openly. It is the right tool for a deterministic filter-and-rank problem with well-defined thresholds.

Gemma 4 plays five distinct roles across the pipeline, each leveraging a specific capability that makes it architecturally irreplaceable rather than interchangeable with any other model. The three capabilities that drive this are native function calling for agentic orchestration, multimodal vision for interpreting biological visualizations, and a 256K context window for multi-source clinical reasoning.

**Agentic orchestration via native function calling.** Gemma 4 is the agent that decides which bioinformatics tools to invoke and in what order. When a VCF file arrives, Gemma 4 reads the mutation characteristics and routes the pipeline: which annotation approach to use, whether to run AlphaFold on all candidates or only the top tier, whether high tumor mutational burden warrants adjusting the clonality threshold. pVACtools, NetMHCpan, AlphaFold, PyClone, and LinearDesign are registered as callable functions. Gemma 4 is the brain that sequences them. Replacing it means renegotiating the entire orchestration contract.

**Multimodal visualization interpretation.** After each tool completes, the pipeline generates images: binding affinity distribution plots, mutation landscape heatmaps, AlphaFold 3D structure renders with pLDDT confidence coloring. These are fed directly into Gemma 4's vision input. No text-only model can do this step. Gemma 4 reads a binding affinity chart to identify which candidates cluster in the high-affinity zone versus borderline. It reads an AlphaFold render to confirm whether the mutation site is surface-exposed or buried. These visual signals inform the prioritization in ways that parsed JSON scores cannot capture. Gemma 4 was explicitly benchmarked on MedXPertQA MM — multimodal medical reasoning is what this model was built for.

At the output layer, the synthesis and reasoning roles follow. Six tools have produced outputs in six different formats: IC50 values from NetMHCpan, immunogenicity probabilities from DeepImmuno, clonal fractions from PyClone, structural confidence from AlphaFold, mRNA stability metrics from LinearDesign, and mutation annotations from VEP. Gemma 4's 256K context window ingests the full VCF alongside oncology literature simultaneously. It understands what a low clonality score means for long-term vaccine efficacy in a mast cell tumor, why a high pLDDT matters more for certain mutation types, and how to communicate uncertainty honestly to a vet making a clinical decision.

### The Five Roles

| Role | Description |
|---|---|
| **1. Agentic Pipeline Orchestrator** | Reads incoming VCF characteristics and uses native function calling to decide which bioinformatics tools to invoke and in what sequence. Adjusts thresholds and tool selection dynamically based on mutation burden, cancer type, and breed. No hardcoded tool sequence. |
| **2. Multimodal Visualization Interpreter** | Binding affinity distribution plots, mutation landscape heatmaps, and AlphaFold 3D structure renders are fed directly into Gemma 4's vision input. Identifies surface-exposed mutation sites, high-affinity candidate clusters, and structural confidence signals that raw JSON scores do not capture. |
| **3. Clinical Report Generator** | Reasons across all six tool outputs simultaneously using 256K context. Produces a plain-language clinical report explaining each selected neoantigen, what the combined scores mean in context, and what the pet owner should understand. |
| **4. mRNA Synthesis Specification** | Takes LinearDesign output and generates the formal synthesis spec for the RNA manufacturing partner: LNP formulation ratios, dosing, cold chain requirements, QC thresholds. |
| **5. Conversational Case Assistant** | Chat interface in the report view. Full case context loaded. Vet asks questions in plain language — Gemma 4 answers in seconds. No local infrastructure needed. |

---

## Architecture

| Component | Technology | Purpose | Hosting |
|---|---|---|---|
| Frontend + API routes | Next.js (App Router) | Vet clinic dashboard, case submission, status tracker, report viewer, chat widget | Vercel |
| Auth + database + realtime | Supabase (PostgreSQL + RLS + Realtime) | Case metadata, neoantigen scores, outcome data, user auth, real-time status updates | Supabase cloud |
| File storage | Google Cloud Storage | FASTQ, BAM, VCF, reports, mRNA sequence files. 7-day lifecycle on pipeline work files. | GCS multi-region |
| GCP pipeline bridge | Python (~150 lines) on Cloud Run | `POST /trigger-pipeline` + `POST /pipeline-callback` | Cloud Run |
| Pipeline orchestration | Nextflow DSL2 | Coordinates bioinformatics tools with parallel execution, error recovery, retry | Google Cloud Life Sciences |
| Compute | Google Cloud Batch + preemptible VMs | Elastic compute per pipeline module. Preemptible reduces cost ~70%. | GCP us-central1 |
| Alignment | BWA-MEM2 + Samtools + Picard | Maps reads to CanFam4 reference. Deduplication. Base quality recalibration. | Cloud Batch (Docker) |
| Mutation calling | GATK Mutect2 + VarScan2 ensemble | Somatic mutations from tumor vs normal. Ensemble reduces false positives. | Cloud Batch (Docker) |
| Neoantigen prediction | pVACtools + NetMHCpan + DeepImmuno + PyClone-VI | Peptide candidates, MHC binding affinity, T-cell activation probability, clonal fraction | Cloud Batch (Docker) |
| Structural validation | AlphaFold2 | Surface exposure + pLDDT confidence at mutation site. Top 20 candidates only. | Cloud Batch + L4 GPU VM |
| mRNA design | LinearDesign + canine codon optimizer | Stability-optimized, canine codon-adapted mRNA with 5'UTR, 3'UTR, poly-A tail | Cloud Batch (Docker) |
| Neoantigen scoring | Python threshold pipeline | Hard filters on IC50, pLDDT, self-similarity. Weighted ranking. 50 lines. Published logic. | Cloud Batch |
| Gemma 4 | Gemma 4 27B IT via Vertex AI | Five roles: agentic orchestration, multimodal visualization interpretation, clinical report, mRNA synthesis spec, conversational case assistant | Vertex AI |

---

## Gemma 4 Integration Approach

The five-role architecture was designed to answer one question that every hackathon judge will ask: is Gemma 4 architecturally irreplaceable, or could any LLM slot in at the final step? The scoring and ranking remain deliberately in a transparent Python pipeline — hard filters and a weighted formula that any clinician or regulator can audit. That is the right tool for a deterministic task with published thresholds.

Gemma 4 becomes irreplaceable at three architectural levels. First, native function calling makes it the orchestrating agent — it decides which tools run, in what order, and with what parameters. Switching models means renegotiating the entire tool-calling interface. Second, multimodal vision gives it access to information that text parsing cannot extract: spatial protein structure, visual binding affinity clusters, pLDDT confidence gradients in AlphaFold renders. No text-only model can do this step. Third, 256K context allows simultaneous ingestion of the full VCF file and oncology literature, enabling clinical reasoning that connects mutation burden, cancer type, breed, and published outcomes in a single inference pass.

The result is a pipeline where Gemma 4 is not the last step — it is the intelligence layer that runs throughout. Six computational biology tools produce outputs in six different formats. Gemma 4 orchestrates their execution, interprets their visual outputs, and reasons across all of them in clinical context to produce something a vet can act on. That is not a formatting task. It is the layer no static pipeline can replicate.

---

## Why the Veterinary Market Is the Right Place to Start

Cancer is the leading cause of death in dogs over age 10. Roughly 6 million dogs are diagnosed annually in the US alone. Pet owners are already spending $10,000 to $30,000 on conventional cancer treatment. No personalized cancer vaccine exists anywhere in the veterinary market today.

More importantly, the regulatory environment for experimental veterinary treatments is dramatically lighter than for human medicine. In Canada, the path for veterinary compassionate use cases is navigable.

Dogs also get the same cancers humans do. Mast cell tumors, lymphoma, osteosarcoma, melanoma. The comparative oncology literature already shows that canine clinical trials predict human responses better than mouse models. Every dog case that runs through this pipeline is, in a meaningful scientific sense, pre-clinical human data collected in a real patient with a real cancer. The playbook for dogs becomes the playbook for humans.

---

## Open Source Commitment

The full pipeline is published on GitHub under MIT license: all Nextflow modules, Docker containers for every bioinformatics tool, the Next.js frontend, the Cloud Run bridge, Gemma 4 prompt templates, and a complete technical playbook. Anyone can clone this repository and run a personalized cancer vaccine design pipeline today. The only proprietary layer is the outcome database that accumulates with real clinical cases — the foundation of the commercial entity built on top of this open infrastructure.

Project Rosie is not just a hackathon submission. It is the beginning of distributed personalized medicine infrastructure: any clinic, any cancer, any patient, a vaccine design in 24 hours.

---

*Word count: ~2,050 | Track: Health & Sciences | Project Rosie by Kirak Labs*
