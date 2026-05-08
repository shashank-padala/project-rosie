"""
Gemma 4 integration via Vertex AI.
Generates clinical reports and interprets visualizations from scored neoantigen candidates.
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

SYSTEM_PROMPT = """You are an AI assistant helping veterinary oncologists understand personalized cancer vaccine candidates for their patients.

You will receive:
1. A JSON file with ranked neoantigen candidates identified from a tumor DNA sample
2. Two charts: a binding affinity bar chart and a mutation landscape pie chart

Your job is to write a clear, honest clinical report that a veterinary oncologist can act on.

Report structure:
- Case Summary (2-3 sentences: species, cancer type if known, total mutations analyzed, candidates identified)
- Top Vaccine Candidates (explain the top 3-5 in plain language: what gene is affected, why this peptide was ranked highly, what the IC50 score means in practical terms)
- Visual Findings (interpret what the charts show — binding affinity distribution, mutation type breakdown)
- Recommended Next Steps (what the oncologist should do with this information — consult with RNA synthesis lab, consider immunotherapy combination, etc.)
- Limitations and Uncertainties (be honest: what the pipeline cannot tell them, what validation is still needed)

Tone: clinical but accessible. No jargon without explanation. Write for a vet who is expert in oncology but not in computational biology.
Length: 400-600 words."""


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

    summary = {
        "case_id":                    candidates["case_id"],
        "species":                    candidates["species"],
        "alleles":                    candidates["alleles"],
        "total_mutations_analyzed":   candidates["total_mutations_analyzed"],
        "candidates_after_filtering": candidates["candidates_after_filtering"],
        "top_candidates":             candidates["top_candidates"][:5],
    }

    ba_data, ba_mime   = _encode_image(binding_affinity_png)
    ml_data, ml_mime   = _encode_image(mutation_landscape_png)

    contents = [
        types.Content(role="user", parts=[
            types.Part(text=SYSTEM_PROMPT),
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

    return response.text
