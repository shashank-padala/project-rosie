# From DNA to Vaccine Candidates — The Full Journey

*Written for readers with no biology background. If you are a software engineer, think of this as tracing a request through a distributed system — except the data is a dog's DNA and the output is a potential cancer treatment.*

---

## The Problem in One Sentence

A tumor is just normal tissue whose DNA picked up typos. Some of those typos make proteins the immune system has never seen before. A personalized cancer vaccine teaches the immune system to hunt cells carrying those proteins. The hard part is figuring out *which typos* are worth targeting — out of potentially hundreds.

---

## The Full Pipeline, Step by Step

### Step 1 — Sample Collection (the clinic)

A veterinary oncologist takes two samples:
- A **tumor biopsy** (a small piece of the cancerous tissue)
- A **blood sample** (healthy DNA from the same patient — the "normal" baseline)

Both go to a sequencing lab.

---

### Step 2 — DNA Sequencing (the lab)

The lab runs **Whole Exome Sequencing (WES)** — a process that reads the DNA letter by letter across all protein-coding regions. The output is a `.FASTQ` file: essentially billions of short DNA snippets (reads), each about 150 letters long.

Think of it as shredding the genome into confetti and reading each piece. You end up with two piles of confetti — one from the tumor, one from the blood.

> **Why both tumor and blood?** You need the blood sample as a reference. Without it, you can't tell whether a mutation is a real cancer mutation or just a natural genetic variant the dog was born with.

---

### Step 3 — Alignment (bioinformatics)

Software maps every short read back to the reference genome (for dogs: **CanFam4**, the canonical dog genome). This is like reassembling the shredded confetti back into the original document.

Tools used: **BWA-MEM2**, **Samtools**, **Picard**

Output: a `.BAM` file — the reads, now positioned on the genome.

> *This step is Phase 2 for Project Rosie. We start at Step 4.*

---

### Step 4 — Variant Calling (bioinformatics)

Software compares the tumor `.BAM` against the blood `.BAM` and flags every position where the tumor DNA differs from the normal. These differences are the somatic mutations — the cancer-specific typos.

Tools used: **GATK Mutect2**, **VarScan2**

Output: a **`.VCF` file** (Variant Call Format) — a structured list of every mutation: chromosome, position, what the normal base was, what the tumor changed it to.

> **This is where Project Rosie's pipeline begins.**

---

### Step 5 — VEP Annotation (bioinformatics)

A raw VCF just says "at position X, C changed to T." It doesn't say what that means biologically. **VEP (Variant Effect Predictor)** looks up each mutation against a gene database and annotates it:

- Which gene is affected?
- Does this change the protein the gene produces?
- What exactly does the protein change look like? (e.g., `p.Asp2581His` = amino acid at position 2581 changed from Aspartic acid to Histidine)
- Is this mutation in the coding region? In an intron? Downstream?

This step also adds two critical plugins pVACseq requires:
- **Wildtype**: the original (unmutated) protein sequence
- **Downstream**: the mutated protein sequence

Output: an **annotated VCF** — same file, now with biological context on every row.

Tool used: **Ensembl VEP** (run via Docker, using the CanFam4 cache for canine data)

---

### Step 6 — Neoantigen Prediction (our pipeline: pVACseq + NetMHCpan)

This is the core of Project Rosie. For each annotated mutation, we need to answer: *would the immune system notice this?*

**pVACseq** (from Griffith Lab, Washington University) does this in three sub-steps:

**6a — Peptide generation**
For each mutation, pVACseq takes a 21-amino-acid window around the changed position and slides across it to generate every possible peptide fragment of length 8, 9, 10, and 11. These are the candidate *neoantigens* — protein pieces the immune system could potentially recognize.

**6b — MHC binding prediction**
Every peptide is submitted to **NetMHCpan** — a deep learning model trained on millions of wet-lab binding experiments. It predicts how tightly each peptide would bind to the patient's specific **HLA alleles** (the immune system's "lock" molecules that present peptides to T-cells).

The output is an **IC50 score** in nanomolars (nM):
- < 50 nM = strong binder → worth considering
- 50–500 nM = moderate binder → borderline
- > 500 nM = weak binder → immune system probably ignores it

**6c — Output**
A giant TSV file with one row per peptide-allele combination. On the HCC1395 benchmark dataset: 955 mutations → **191,645 rows**.

---

### Step 7 — Scoring and Ranking (our pipeline: scoring.py)

pVACseq's output is enormous and unranked. Our `scoring.py` applies:

**Hard filters** (anything failing either is removed):
- IC50 > 500 nM → too weak, discard
- Tumor VAF < 1% → mutation barely present in the tumor, likely noise

**Composite score** for survivors (higher = better vaccine candidate):
```
score = 0.50 × binding strength (IC50, log-scaled)
      + 0.30 × immunogenicity (probability of T-cell activation)
      + 0.20 × VAF (how clonal the mutation is — present in more tumor cells = better target)
```

Output: a **JSON file** with the top 20 ranked candidates, all metadata, and paths to the visualization charts.

---

### Step 8 — Gemma 4 (M2, not yet built)

The JSON + two PNG charts go to Gemma 4, which:
- Interprets the binding affinity chart visually
- Reasons across all candidates in one 256K context window
- Writes a plain-language clinical report for the vet oncologist
- Generates the mRNA synthesis specification

---

### Step 9 — mRNA Design (M3, not yet built)

The top candidates are assembled into a multi-epitope mRNA vaccine sequence, codon-optimized for canine biology using Biopython and a canine codon usage table.

---

## Why We Start at the VCF

We made a deliberate decision to **start the pipeline at Step 4 (the VCF file)** rather than at raw sequencing reads. Here's why:

1. **The sequencing lab already produces a VCF.** Any clinical sequencing workflow outputs one. We don't need to redo that work.
2. **Steps 1–3 are solved problems.** BWA-MEM2, GATK, and Picard are mature, well-documented tools. Rebuilding them would add months of work with no novelty.
3. **The hard, unsolved problem is Steps 5–8.** Getting from a VCF to a clinically actionable ranked list — that's where the gap is for vet oncology. That's what Project Rosie addresses.
4. **Scope.** For the Gemma4Good hackathon, we have 10 days. Starting at VCF lets us ship something real instead of spending the entire time on plumbing.

Steps 1–3 will be integrated in Phase 2 when we move to full clinical deployment.

---

## Validation Dataset

All current testing uses **HCC1395** — a widely used human breast cancer benchmark dataset from the bioinformatics community. It contains matched tumor/normal whole exome sequencing from a real breast cancer patient, pre-annotated with VEP. The 955 mutations and 191,645 epitopes you see in our results come from this specific dataset.

Real patient samples will produce different numbers. The pipeline handles any valid annotated VCF.

---

## Glossary

| Term | Plain English |
|---|---|
| VCF | Spreadsheet of mutations found in the tumor |
| Peptide / Epitope | Short protein fragment (8–11 amino acids) that the immune system can recognize |
| HLA allele | The specific "lock" shape of a patient's immune recognition molecules — unique to each individual |
| IC50 (nM) | How tight the peptide-HLA fit is. Lower = tighter = better vaccine candidate |
| VAF (Variant Allele Frequency) | What fraction of the tumor cells carry this mutation. Higher = more tumor cells to attack |
| NetMHCpan | Deep learning model that predicts peptide-HLA binding strength |
| pVACseq | Tool that orchestrates the peptide generation + NetMHCpan calls |
| Neoantigen | A protein fragment that exists in the tumor but not in healthy cells — the immune system's target |
| mRNA vaccine | A vaccine that delivers instructions to the patient's own cells to produce the neoantigen, triggering immune response |
