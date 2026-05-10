# Frontend Architecture — M4 Web App

*Written for engineers and product people who are not familiar with the Next.js / Supabase stack used here. Biology background not needed.*

> **Updates since this doc was first written (M4):** several stubs described below have shipped. The Report Viewer is now a **vertical pipeline timeline** (`src/components/PipelineTimeline.tsx`), not the tabbed view originally planned. The Submit form does **real GCS upload** to a resumable upload session and triggers Cloud Run Jobs (no more "filename discarded" stub). Supabase Realtime drives live status. A **Gemma Advisor layer** (M4b) was added — see the dedicated section near the bottom of this doc. The dashboard table was also redesigned (`src/components/CaseDashboardActions.tsx` for the per-row actions). The original M4 narrative below is preserved for historical context.

---

## What M4 Is

M4 is the web application that turns pipeline outputs into something a veterinary oncologist can actually use. The bioinformatics pipeline (M1–M3) produces JSON files, PNG charts, a markdown report, and a FASTA sequence. M4 is the browser interface where a clinic uploads a VCF, watches the pipeline run, reads the report, downloads the mRNA sequence, and asks Gemma 4 questions about the case.

---

## The Data Model

Everything lives in one Supabase table: `cases`.

```
cases
├── id                         UUID — primary key
├── user_id                    UUID — references auth.users (NULL for public demo cases)
├── sample_name                TEXT — e.g. "BUDDY_TUMOR_01"
├── species                    TEXT — e.g. "canis_lupus_familiaris"
├── alleles                    TEXT[] — MHC/DLA alleles used in prediction
├── status                     TEXT — pipeline stage: pending → running → scoring → reporting → designing → completed
│
│   Pipeline outputs (written by M5 when Cloud Run finishes):
├── candidates_json            JSONB — full ranked candidates list (top 20 with scores)
├── clinical_report_md         TEXT — Gemma 4 markdown report
├── mrna_fasta                 TEXT — codon-optimized mRNA construct
├── mrna_summary_md            TEXT — synthesis guidance document
├── binding_affinity_img_b64   TEXT — base64-encoded binding affinity PNG
├── mutation_landscape_img_b64 TEXT — base64-encoded mutation landscape PNG
│
│   Summary stats:
├── total_mutations            INTEGER — total mutations analyzed
├── candidates_after_filtering INTEGER — candidates that passed hard filters
└── error_message              TEXT — set if status = 'failed'
```

**Why base64 images instead of GCS URLs?** For the hackathon demo, we store PNGs directly in the database as base64 strings. This avoids needing to set up GCS signed URLs for M4. M5 will move these to Cloud Storage and replace the columns with URLs. The `<Image>` component handles both patterns with a one-line change.

**Why JSONB for candidates?** The candidates list is always read whole — we never query individual candidates. JSONB gives fast reads with no joins and lets TypeScript deserialize it directly to `CandidatesJson`.

---

## Row-Level Security

Supabase enforces row-level security (RLS) directly in PostgreSQL. Two policies:

```sql
-- Users see only their own cases
CREATE POLICY "users_own_cases" ON cases
  FOR ALL USING (auth.uid() = user_id);

-- Demo cases (user_id IS NULL) are publicly readable without auth
CREATE POLICY "demo_cases_public" ON cases
  FOR SELECT USING (user_id IS NULL);
```

This means the API routes don't need to manually filter by `user_id` — the database rejects any attempt to read another user's case. A logged-out user can read the demo case but cannot read anyone's private case.

The seed script (`scripts/seed_demo.py`) inserts the HCC1395 benchmark case with `user_id = NULL`. The `/demo` page fetches it without requiring auth.

---

## Route Structure

```
/                    Landing page — public
/demo                Demo report viewer — public (loads user_id=NULL case from Supabase)
/auth/login          Login form — public
/auth/signup         Signup form — public
/dashboard           Case list — requires auth
/submit              New case form — requires auth (3-step wizard)
/cases/[id]          Full report viewer — requires auth, verifies user_id match

/api/cases           GET: list user's cases   POST: create new case
/api/cases/[id]      GET: single case (auth-gated)
/api/cases/[id]/chat POST: Gemma 4 chat with case context (demo cases accessible without auth)
```

Auth protection is done server-side in each page using `supabase.auth.getUser()`. If not authenticated, pages redirect to `/auth/login?next=<path>`.

---

## The Report Viewer

`ReportViewer` is the central component. It receives a full `Case` row and renders four tabs:

| Tab | Content | What it shows |
|---|---|---|
| Clinical Report | Markdown → HTML | Gemma 4's plain-language analysis: candidate reasoning, clinical context, recommended next steps |
| Candidates | Sortable table | Rank, peptide sequence, gene, peptide length, allele, IC50 (color-coded), VAF, composite score |
| mRNA Design | FASTA viewer + design summary | The codon-optimized mRNA construct with copy and download buttons; synthesis parameters below |
| Charts | Two PNG images | Binding affinity bar chart (top 20 IC50 values) and mutation landscape pie chart |

If the case status is not `completed`, the viewer shows a pipeline progress timeline instead of tabs. Each stage is listed with the current one highlighted — this will animate in real-time once M5 wires up Supabase Realtime.

**IC50 color coding in the candidates table:**
- Green (< 50 nM): strong binders — clinically interesting
- Yellow (50–150 nM): moderate binders — worth considering
- Gray (> 150 nM): weak binders — included in top 20 but deprioritized

---

## Gemma 4 Chat Widget

The floating "Ask Gemma 4" button appears on any completed case (demo or private). When opened:

1. The user types a question and presses Enter
2. `POST /api/cases/[id]/chat` is called with the message and conversation history
3. The API route loads the case from Supabase, builds a system prompt with:
   - The top 5 candidate summaries (peptide, gene, IC50, score)
   - The first 800 characters of the clinical report
4. The message + history is sent to `gemma-4-26b-a4b-it-maas` on Vertex AI global endpoint
5. The response streams back and appears in the chat panel

The chat is stateless on the server — the full history is sent with each request. This is fine for hackathon scale (conversations are short) and avoids needing a separate conversation storage layer.

**Why load only 800 chars of the clinical report?** The full report can be 3,000–5,000 characters. Including all of it in every chat turn would consume most of the context budget on repeated turns. The 800-char truncation covers the executive summary and key findings, which answer most questions. For deep questions about specific sections, the user can scroll to the relevant tab and ask more specifically.

---

## The Submit Form

Three steps, each on one screen:

1. **Patient info** — sample name (required), species dropdown (dog/human/cat)
2. **Alleles** — text input with preset buttons for common allele sets (Human MHC-I common; Canine DLA common). Comma-separated.
3. **VCF upload + review** — drag-and-drop zone, shows a summary card before submitting

On submit, `POST /api/cases` is called. The API creates the row in Supabase with `status: pending` and returns the `id`. The page redirects to `/cases/[id]` which shows the pipeline progress view.

**Note**: VCF upload to GCS is wired in M5. For M4, the VCF filename is accepted and discarded. The case registers as `pending` and stays there until M5 adds Cloud Run triggering.

---

## Design System

The app is always dark — no light mode toggle. Tailwind v4 with custom OKLCH tokens:

| Token | Value | Usage |
|---|---|---|
| `--background` | `oklch(0.10 0.01 240)` | Page backgrounds — deep navy-black |
| `--card` | `oklch(0.14 0.01 240)` | Cards and panels — slightly lighter than background |
| `--primary` | `oklch(0.75 0.15 175)` | Teal accent — links, CTAs, IC50 highlights, status indicators |
| `--muted-foreground` | `oklch(0.60 0.01 220)` | Secondary text — descriptions, metadata |
| `--border` | `oklch(1 0 0 / 8%)` | Subtle borders — 8% white opacity |

The teal accent (`--primary`) is approximately #00c9a7 in sRGB. It was chosen to feel clean and clinical without the sterile harshness of pure white-on-black.

---

## What M5 Adds to This

M5 will wire up the pieces M4 left as stubs:

- **VCF → GCS upload**: replace the filename-only stub in `/submit` with real file upload to Cloud Storage, returning a GCS URI
- **Cloud Run trigger**: after inserting the case row, `POST /trigger` on the FastAPI bridge service to start the pipeline job
- **Realtime status**: subscribe to the Supabase `cases` channel on the `/cases/[id]` page — status updates from Cloud Run callbacks appear live without page refresh
- **GCS URL images**: replace base64 PNG columns with signed GCS URLs, update `ReportViewer` to use `src={caseData.binding_affinity_url}` instead of the base64 data URI

---

## Gemma Advisor Components (M4b — shipped)

Two Gemma-powered components were added on top of the M4 base — they are the project's primary differentiator beyond "LLM as report-writer at the end of a pipeline." See `docs/explainers/02-key-decisions.md` Decision 9 for the rationale; this section covers the frontend wiring.

### `<VcfAdvisor>` — pre-flight VCF check

Mounted on the submit page (`src/app/(app)/submit/page.tsx`) inside step 3, between the dropzone and the review summary card.

| File | Purpose |
|---|---|
| `src/lib/vcf-stats.ts` | Pure browser-side VCF parser. Reads up to the first 5 MB of the file, extracts variant count, INFO keys, sample columns (TUMOR/NORMAL detection), somatic-flag presence, chromosomes seen, FILTER values, fileformat header, reference header. Never throws. |
| `src/components/VcfAdvisor.tsx` | UI. Watches the `file` prop; on change, parses stats client-side, then POSTs to `/api/vcf-advisor`. Renders loading pill ("Gemma is reviewing your VCF…"), then 0–3 typed advisory notes (info / warning / critical), or a "✓ VCF looks clean" check. |
| `src/app/api/vcf-advisor/route.ts` | Server endpoint. Auth-gated (logged-in user). Sends structural facts to `gemma-4-26b-a4b-it-maas` with a strict-JSON prompt; safe-parses the response; returns `{ notes: AdvisoryNote[] }`. Degrades to `{ notes: [] }` on Gemma failure — never blocks Submit. |

**UX shape:** auto-runs on file select (one Gemma call per file). Loading state inline, never modal. Submit always usable regardless of advisor outcome.

### `<SensitivityPanel>` — what-if threshold explorer

Mounted in `src/components/PipelineTimeline.tsx` immediately after `<CandidatesArtifact>` for cases with `candidates_json` populated. Visible on both `/cases/[id]` (logged-in user cases) and `/demo` (public demo case).

| File | Purpose |
|---|---|
| `src/lib/sensitivity.ts` | Pure client-side re-rank. `applySensitivity(candidates, thresholds)` returns `{ kept, dropped }` based on IC50 and VAF cutoffs. Defaults mirror `pipeline/modules/scoring.py:12-13` (`HARD_FILTER_IC50=500`, `HARD_FILTER_VAF=0.01`). |
| `src/components/SensitivityPanel.tsx` | UI. Collapsible card with two range inputs (IC50 log-scale 50→1000 nM, VAF linear 0.01→0.50). Live counter row updates instantly on slider drag — no Gemma call until the user clicks "Ask Gemma to interpret". |
| `src/app/api/cases/[id]/sensitivity-narrate/route.ts` | Server endpoint. Auth-gated with the same dual-mode pattern as the chat route (logged-in user OR `user_id IS NULL` for the demo). Sends thresholds + kept/dropped lists to Gemma; returns `{ narrative: string }`. |

**UX shape:** instant slider feedback at zero LLM cost. Narrative generated only on explicit user request — keeps Vertex AI quota use bounded.

### Pattern to copy when adding more advisor features

Both components follow the same shape:
1. **Pure lib** (`src/lib/*.ts`) — does the structured work (parsing or filtering) with zero side effects.
2. **API route** (`src/app/api/.../route.ts`) — auth gate + Gemma call + safe-parse fallback.
3. **Component** (`src/components/*.tsx`) — wires the lib to the route to the UI; degrades gracefully when Gemma fails.

This separation keeps Gemma's role clearly bounded (interpretation only) and makes the underlying logic auditable without an LLM in the loop.
