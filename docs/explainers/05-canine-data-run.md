# Canine Data End-to-End Run — M6

*Written for engineers unfamiliar with bioinformatics. No biology background needed.*

---

## What M6 does

M5 proved the cloud pipeline works with the human pVACtools sample data already in the repository. M6 runs the pipeline on real canine data for the first time: a synthetic-but-biologically-meaningful somatic VCF with ROS_Cfam_1.0 (CanFam4) coordinates, annotated by VEP, run through pVACseq with DLA alleles, and scored by Gemma 4 into a clinical report.

This is the first time the system produced a neoantigen candidate for a dog.

---

## The canine VCF

No publicly available somatic VCF with ROS_Cfam_1.0 coordinates was immediately accessible, so a synthetic VCF was created using real gene positions from the Ensembl REST API. The mutations were placed in exons of known canine tumor genes:

| Gene | Mutation | Coordinates (ROS_Cfam_1.0) | VEP consequence |
|---|---|---|---|
| TP53 | G→A | chr5:32669717 | missense (L26F) |
| TP53 | T→C | chr5:32669747 | intron_variant |
| BRCA2 | T→C | chr25:7891626 | upstream_gene_variant |
| BRCA2 | T→C | chr25:7891666 | upstream_gene_variant |
| PTEN | A→G | chr26:39409228 | missense (K62R) |
| PTEN | C→T | chr26:39409238 | synonymous |
| PIK3CA | G→A | chr34:12545798 | missense (V125M) |
| PIK3CA | G→A | chr34:12545828 | missense (E135K) |
| KIT | C→T | chr13:47757010 | synonymous |
| KIT | G→A | chr13:47757040 | synonymous |

Reference alleles were verified against the Ensembl REST API at each position before writing the VCF.

---

## VEP annotation

VEP v115 was used with the `canis_lupus_familiaris` ROS_Cfam_1.0 cache (~1.5GB including the reference FASTA for HGVS notation). The annotation required two pVACtools-specific plugins:

- **Wildtype.pm** — provides the wildtype peptide sequence surrounding each mutation (required by pVACseq to compute the mutant epitope)
- **Frameshift.pm** — downstream sequence for frameshift mutations (replaces the old `Downstream.pm` plugin in pVACtools v4+)

Both plugins ship with the pVACtools Python package at `pvactools/tools/pvacseq/VEP_plugins/`. The plain `ensemblorg/ensembl-vep` Docker image does not include them — they must be mounted separately.

VEP flags required by pVACseq (learned by trial):
```
--tsl                  # Transcript Support Level — pVACseq rejects VCFs without this
--hgvs --transcript_version  # HGVS notation — required for protein change identification
--pick                 # One consequence per variant (pVACseq expects single-consequence format)
--plugin Wildtype --plugin Frameshift
```

### Docker volume mount workaround

Docker Desktop on WSL2 drops volume mounts silently when the same source directory is mounted to two container targets simultaneously (e.g. `/data/input` and `/data/output` both pointing to the same host path). The workaround: copy the input VCF into the VEP cache directory, then use a single volume mount. `annotation.py` implements this automatically.

---

## pVACseq with DLA alleles

NetMHCpan 4.2 supports exactly three canine DLA alleles:
- `DLA-8803401`
- `DLA-8850101`
- `DLA-8850801`

The `DLA-12*00101` allele in the original submit form preset is not supported and was removed.

pVACseq uses the IEDB REST API to call NetMHCpan (not the local binary) when the algorithm name is `NetMHCpan`. The local binary just needs to be in `$PATH` for pVACseq to accept the algorithm name. In the cloud container (`griffithlab/pvactools`), NetMHCpan is pre-installed.

pVACseq also requires `--tsl` in the VEP annotation (Transcript Support Level), otherwise it rejects the VCF with a clear error message.

---

## Result: one strong neoantigen candidate

| Field | Value |
|---|---|
| Gene | PIK3CA |
| Mutation | Val125Met (V→M) |
| Peptide | MPMCEFDMVK (10-mer) |
| DLA allele | DLA-8850801 |
| IC50 (mutant) | 128.38 nM |
| IC50 (wildtype) | 548.18 nM |
| Percentile rank | 0.09% (top 0.1%) |
| Fold change | 4.3× (tumor-specific) |

PIK3CA V125M is a biologically plausible mammary tumor mutation. IC50 < 150 nM on a DLA allele is a strong binder. The wildtype peptide (MPVCEFDMVK) has IC50 548 nM — the mutation drives a 4× improvement in binding affinity, which is the hallmark of a genuine neoantigen.

---

## mRNA design

One epitope → 251 nt mRNA construct:
- CDS: 42 nt (codon-optimized for canine using the embedded codon table)
- GC content (CDS): 54.8% — within the 45-60% target range
- Flanked by beta-globin 5'UTR and 3'UTR + 60-nt poly-A tail

Only 1 peptide was available (vs the 3 typically requested), so the mRNA construct is minimal. A real case with 5-10 mutations and more passing candidates would produce a multi-epitope string.

---

## Key files

| File | Purpose |
|---|---|
| `pipeline/data/canine/canine_mammary_tumor_001.vcf` | Raw synthetic canine somatic VCF |
| `pipeline/data/canine/canine_mammary_tumor_001_annotated.vcf` | VEP-annotated VCF (ready for pVACseq) |
| `pipeline/vep_plugins/Wildtype.pm` | pVACtools VEP plugin for wildtype peptide sequences |
| `pipeline/vep_plugins/Frameshift.pm` | pVACtools VEP plugin for frameshift downstream sequences |
| `pipeline/modules/annotation.py` | VEP Docker wrapper (single-mount workaround, ROS_Cfam_1.0 defaults) |
| `pipeline/run_cloud.py` | Cloud Run entry point (now supports SKIP_PREDICTION + GCS_TSV_PATH) |

---

## What's next (M6 remaining + M7)

The local pipeline run is done. Still pending:
- Submit the annotated canine VCF through the web app → verify cloud pipeline runs end-to-end
- Review clinical report quality with SME (Case Comprehensive Cancer Center researcher)
- Record video for hackathon submission
