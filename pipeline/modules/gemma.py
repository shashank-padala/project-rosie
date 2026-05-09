"""
Gemma 4 integration via Vertex AI.
Generates clinical reports, interprets visualizations, and produces mRNA synthesis specifications.
"""
import os
import json
import base64
from pathlib import Path
from google import genai
from google.genai import types

GCP_PROJECT = os.getenv("GCP_PROJECT_ID", "project-1ea30ea7-dc79-4a14-84b")
GCP_REGION  = os.getenv("GCP_REGION", "global")
MODEL       = os.getenv("GEMMA_MODEL", "gemma-4-26b-a4b-it-maas")

_SYSTEM_PROMPT_TEMPLATE = """You are an AI assistant helping {audience} understand personalized cancer vaccine candidates for their patients.

You will receive:
1. A JSON file with ranked neoantigen candidates identified from a tumor DNA sample
2. Two charts: a binding affinity bar chart and a mutation landscape pie chart

Your job is to write a clear, honest clinical report that {audience_short} can act on.

Report structure:
- Case Summary (2-3 sentences: species, cancer type if known, total mutations analyzed, candidates identified)
- Top Vaccine Candidates (explain the top 3-5 in plain language: what gene is affected, why this peptide was ranked highly, what the IC50 score means in practical terms)
- Visual Findings (interpret what the charts show — binding affinity distribution, mutation type breakdown)
- Recommended Next Steps (what the oncologist should do with this information — consult with RNA synthesis lab, consider immunotherapy combination, etc.)
- Limitations and Uncertainties (be honest: what the pipeline cannot tell them, what validation is still needed)

{species_notes}

Tone: clinical but accessible. No jargon without explanation. Write for {audience_tone}.
Length: 400-600 words."""

_SPECIES_CONFIG = {
    "canis_lupus_familiaris": {
        "audience":      "veterinary oncologists",
        "audience_short": "a veterinary oncologist",
        "audience_tone": "a vet who is expert in oncology but not in computational biology",
        "species_notes": (
            "The alleles are DLA (Dog Leukocyte Antigen) alleles, not human HLA. "
            "Name them explicitly — e.g. \"DLA-88*50101\" — when discussing which alleles each peptide binds. "
            "IC50 thresholds: < 50 nM = strong binder, 50–500 nM = weak binder."
        ),
    },
    "homo_sapiens": {
        "audience":      "oncologists",
        "audience_short": "an oncologist",
        "audience_tone": "a clinician who is expert in oncology but not in computational biology",
        "species_notes": (
            "The alleles are HLA (Human Leukocyte Antigen) alleles. "
            "Use HLA allele names as given (e.g. \"HLA-A*02:01\"). "
            "IC50 thresholds: < 50 nM = strong binder, 50–500 nM = weak binder."
        ),
    },
    "felis_catus": {
        "audience":      "veterinary oncologists",
        "audience_short": "a veterinary oncologist",
        "audience_tone": "a vet who is expert in oncology but not in computational biology",
        "species_notes": (
            "This is a feline case. The MHC alleles are feline leukocyte antigen (FLA) alleles. "
            "IC50 thresholds: < 50 nM = strong binder, 50–500 nM = weak binder."
        ),
    },
}

_DEFAULT_SPECIES_CONFIG = {
    "audience":      "oncologists",
    "audience_short": "an oncologist",
    "audience_tone": "a clinician who is expert in oncology but not in computational biology",
    "species_notes": "Use allele names as given. IC50 thresholds: < 50 nM = strong binder, 50–500 nM = weak binder.",
}


def _build_system_prompt(species: str) -> str:
    cfg = _SPECIES_CONFIG.get(species, _DEFAULT_SPECIES_CONFIG)
    return _SYSTEM_PROMPT_TEMPLATE.format(**cfg)


def _encode_image(path: str) -> tuple[str, str]:
    data = Path(path).read_bytes()
    return base64.b64encode(data).decode(), "image/png"


def generate_clinical_report(
    candidates_json_path: str,
    binding_affinity_png: str,
    mutation_landscape_png: str,
) -> str:
    client = genai.Client(vertexai=True, project=GCP_PROJECT, location=GCP_REGION)

    with open(candidates_json_path) as f:
        candidates = json.load(f)

    species = candidates.get("species", "homo_sapiens")
    system_prompt = _build_system_prompt(species)

    summary = {
        "case_id":                    candidates["case_id"],
        "species":                    species,
        "alleles":                    candidates["alleles"],
        "total_mutations_analyzed":   candidates["total_mutations_analyzed"],
        "candidates_after_filtering": candidates["candidates_after_filtering"],
        "top_candidates":             candidates["top_candidates"][:5],
    }

    ba_data, ba_mime   = _encode_image(binding_affinity_png)
    ml_data, ml_mime   = _encode_image(mutation_landscape_png)

    contents = [
        types.Content(role="user", parts=[
            types.Part(text=system_prompt),
            types.Part(text=f"Here are the ranked neoantigen candidates:\n\n```json\n{json.dumps(summary, indent=2)}\n```"),
            types.Part(text="Binding affinity chart (top 20 candidates by IC50):"),
            types.Part(inline_data=types.Blob(mime_type=ba_mime, data=ba_data)),
            types.Part(text="Somatic mutation landscape:"),
            types.Part(inline_data=types.Blob(mime_type=ml_mime, data=ml_data)),
            types.Part(text="Please write the clinical report now."),
        ])
    ]

    response = client.models.generate_content(
        model=MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            max_output_tokens=1024,
            temperature=0.3,
        ),
    )

    return _embed_images(
        report=response.text,
        binding_affinity_png=binding_affinity_png,
        mutation_landscape_png=mutation_landscape_png,
    )


_SYNTHESIS_SPEC_PROMPT = """You are an mRNA therapeutics formulation expert preparing a formal synthesis order for an RNA contract manufacturing organization (CMO). A veterinary oncology team is ordering a personalized neoantigen mRNA vaccine construct.

You will receive:
1. The mRNA construct specification (sequence architecture, GC content, codon optimization, epitope details)
2. The top neoantigen candidates encoded in the construct

Write a formal synthesis specification document suitable for submission to a CMO (e.g., TriLink Biotechnologies, Aldevron, Genscript). This document becomes part of the batch record. Be technically precise — it goes to a formulation scientist, not a clinician.

Structure the document with these sections:

1. **Synthesis Request Summary**
   One paragraph: construct purpose, patient species, number of epitopes encoded, intended use (research-grade investigational vaccine).

2. **IVT Template Specification**
   - Template format: linearized plasmid or PCR product with T7 promoter upstream of construct
   - Promoter: T7 RNA polymerase
   - Template length: [derive from construct data]
   - Note any sequence verification requirement (Sanger or NGS) before IVT

3. **Sequence Specifications**
   Markdown table with columns: Element | Sequence/Parameter | Length (nt) | Notes
   Rows: 5'UTR, Kozak, CDS, 3'UTR, Poly-A tail, Total construct

4. **Capping and Chemical Modifications**
   - 5' cap: CleanCap® AG (cap1 analog, co-transcriptional) — specify TriLink Cat# N-7413 or equivalent cap1 analog; reason: cap1 avoids innate immune recognition (IFIT1/IFIT3), superior to ARCA
   - Modified nucleotides: 100% N1-methylpseudouridine (m1Ψ) substitution for all uridines; reason: abolishes TLR7/TLR8 activation, increases translational yield 10–100×
   - Purification: **HPLC purification required** to remove immunostimulatory dsRNA byproducts; note this is non-negotiable for therapeutic-grade material

5. **LNP Formulation Request**
   - Lipid system: SM-102 (ionizable) + DSPC + cholesterol + PEG2000-DMG
   - Molar ratios: 50:10:38.5:1.5
   - N/P ratio: 6
   - Target particle size: 80–120 nm (PDI < 0.2)
   - Encapsulation efficiency: > 85% (Ribogreen assay)
   - Buffer: PBS pH 7.4 or 25 mM sodium acetate pH 4.0 (pre-dilution)

6. **Quality Control Requirements**
   Markdown table with columns: Test | Method | Acceptance Criterion
   Rows: RNA integrity (RIN > 8.0, Bioanalyzer or Fragment Analyzer), dsRNA content (J2 dsRNA ELISA, < 0.1% w/w), Endotoxin (LAL, < 0.1 EU/µg RNA), Residual DNA (qPCR, < 10 ng/mg), Identity (sequence confirmed by RT-PCR), Concentration (UV A260), Encapsulation efficiency (Ribogreen, > 85%)

7. **Scale and Storage**
   - Requested scale: 100–200 µg RNA (research/investigational grade)
   - Naked mRNA storage: −80 °C, single-use aliquots, avoid freeze-thaw
   - LNP formulation storage: −20 °C, protected from light, 6-month stability target
   - Shipping: dry ice, overnight courier

8. **Dosing Guidance**
   Species-appropriate starting dose range (µg/kg body weight) based on canine neoantigen vaccine literature; state that final dose and schedule require veterinary oncologist sign-off prior to administration.

Tone: formal, technical, direct. No hedging. Use markdown tables for sections 3 and 6.
Length: 650–800 words."""


def generate_mrna_synthesis_spec(
    design_summary: str,
    candidates_json_path: str,
) -> str:
    client = genai.Client(vertexai=True, project=GCP_PROJECT, location=GCP_REGION)

    with open(candidates_json_path) as f:
        candidates = json.load(f)

    top = candidates.get("top_candidates", [])[:5]
    species = candidates.get("species", "canis_lupus_familiaris")

    candidates_block = json.dumps({
        "species": species,
        "alleles": candidates.get("alleles", []),
        "top_candidates": top,
    }, indent=2)

    contents = [
        types.Content(role="user", parts=[
            types.Part(text=_SYNTHESIS_SPEC_PROMPT),
            types.Part(text=f"mRNA construct specification:\n\n{design_summary}"),
            types.Part(text=f"Top neoantigen candidates encoded in this construct:\n\n```json\n{candidates_block}\n```"),
            types.Part(text="Please write the synthesis specification document now."),
        ])
    ]

    response = client.models.generate_content(
        model=MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            max_output_tokens=2048,
            temperature=0.2,
        ),
    )

    return response.text


def _embed_images(report: str, binding_affinity_png: str, mutation_landscape_png: str) -> str:
    ba_name = Path(binding_affinity_png).name
    ml_name = Path(mutation_landscape_png).name

    ba_block = f"\n![Binding Affinity Chart](./{ba_name})\n"
    ml_block = f"\n![Mutation Landscape](./{ml_name})\n"

    # Inject after the Visual Findings header if present, otherwise append at end
    visual_headers = ["**Visual Findings**", "## Visual Findings", "### Visual Findings"]
    next_section_markers = ["**Recommended", "## Recommended", "### Recommended",
                            "**Limitations", "## Limitations", "### Limitations"]

    lines = report.splitlines(keepends=True)
    result = []
    i = 0
    inserted_ba = False
    inserted_ml = False

    while i < len(lines):
        line = lines[i]
        result.append(line)

        # After the Visual Findings header, inject binding affinity chart first
        if not inserted_ba and any(h in line for h in visual_headers):
            result.append(ba_block)
            inserted_ba = True

        # Before the next major section after Visual Findings, inject mutation landscape
        if inserted_ba and not inserted_ml and any(m in line for m in next_section_markers):
            result.insert(-1, ml_block)  # insert before this line
            inserted_ml = True

        i += 1

    # Fallback: append both at the end if headers not found
    if not inserted_ba:
        result.append(f"\n---\n{ba_block}{ml_block}")
    elif not inserted_ml:
        result.append(ml_block)

    return "".join(result)
