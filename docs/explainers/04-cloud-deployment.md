# Cloud Deployment Architecture — M5

*Written for engineers unfamiliar with GCP. Biology background not needed.*

---

## The problem M5 solves

After M4, the submit form created a case record in Supabase but nothing happened. The VCF file was never uploaded. No pipeline ran. Cases sat in "pending" forever. M5 wires the complete path: browser → cloud storage → compute → database → browser.

---

## What happens when a vet submits a VCF

```
1. Browser calls GET /api/upload-url
   → Next.js API calls GCS to generate a resumable upload URI
   → Returns the URI to the browser

2. Browser PUTs the VCF file directly to GCS using the URI
   → No Next.js in the middle (avoids size limits, faster)
   → VCF lands at gs://project-rosie-pipeline/vcf/{user}/{timestamp}/{file}

3. Browser calls POST /api/cases with the GCS path
   → Next.js inserts a case row (status: "running")
   → Next.js calls the Cloud Run Jobs API to start a pipeline job
   → Returns the case ID, browser navigates to /cases/{id}

4. Cloud Run Job starts (asynchronously)
   → Downloads VCF from GCS to /tmp
   → Runs 5-step pipeline
   → After each stage, POSTs to /api/cases/{id}/progress

5. /api/cases/{id}/progress (callback endpoint)
   → Verifies the shared secret
   → Updates the case row in Supabase (status, partial results)

6. Browser /cases/{id}
   → Supabase Realtime subscription detects the row update
   → UI re-renders with new status — no polling, no refresh
   → When status = "completed", full report appears
```

---

## Infrastructure components

### GCS bucket — `project-rosie-pipeline`

Cloud Storage bucket in `us-central1`. Used for one thing: storing VCF files uploaded by users. Results (clinical report, mRNA, charts) go directly into Supabase as text/base64 — they're small enough. VCFs can be hundreds of MB, so GCS is the right place.

30-day lifecycle rule auto-deletes files. Pipeline work files don't need to persist.

### Cloud Run Job — `rosie-pipeline`

Cloud Run Jobs are batch workloads — they run to completion and shut down. Not a long-running server. When the Next.js API calls the Cloud Run Jobs REST API, GCP spins up a container from the pipeline image, runs `run_cloud.py`, and terminates when done.

Configured with:
- 8Gi RAM — pVACseq is memory-hungry during epitope scoring
- 4 CPU — prediction is CPU-bound
- 3h timeout — enough for large canine VCFs with many mutations
- 0 max retries — pipeline failures should surface, not silently retry

### Docker image

The pipeline container lives in Artifact Registry at `us-central1-docker.pkg.dev/project-1ea30ea7-dc79-4a14-84b/rosie-pipeline/pipeline:latest`.

Built from `griffithlab/pvactools:latest` (includes pVACtools + VEP + NetMHCpan pre-installed). On top of that: `requirements.txt` deps (google-cloud-storage, google-genai, matplotlib, biopython) + the pipeline modules + `run_cloud.py` as the entrypoint.

### `pipeline/run_cloud.py`

The Cloud Run entrypoint. All configuration comes in via environment variables injected by the Cloud Run Jobs API at execution time (case ID, GCS path, alleles, callback URL, etc.).

What it does:
1. Downloads VCF from GCS to `/tmp`
2. Calls `/api/cases/{id}/progress` with `status: "running"`
3. Runs each pipeline stage, calling progress after each
4. Final callback sends `status: "completed"` with all results (base64 PNGs, markdown report, mRNA FASTA, candidates JSON)

Stage → status mapping:
| Stage | Status sent |
|---|---|
| Job started | `running` |
| Scoring done | `scoring` |
| Visualizations done | `reporting` |
| mRNA design done | `designing` |
| All complete | `completed` |

### Workload Identity Federation (WIF)

> **Status note:** WIF is wired and the code path below is correct, but **production currently uses the static-key fallback** in `src/lib/gcp-auth.ts` (the `GOOGLE_APPLICATION_CREDENTIALS_JSON` env var is set on Vercel and short-circuits the WIF path). The WIF path was hitting reliability issues during the hackathon timeline so the deployment fell back to a service-account key. The text below describes the WIF design as implemented in code; treat it as the intended production posture, not the active one.

The Next.js API on Vercel needs to call GCP APIs (Cloud Run Jobs, GCS). Normally you'd use a service account JSON key. But the GCP project has an org policy blocking key creation (`constraints/iam.disableServiceAccountKeyCreation`).

WIF solves this without keys:
1. Vercel generates a short-lived OIDC token for each request (`VERCEL_OIDC_TOKEN`)
2. The Next.js code exchanges it with GCP's Security Token Service (STS) for a federated token
3. That federated token impersonates the `rosie-pipeline-sa` service account
4. The resulting access token is used for all GCP API calls

The trust relationship: Vercel's OIDC issuer (`https://oidc.vercel.com`) is registered as a trusted provider in a Workload Identity Pool. GCP only issues tokens to Vercel OIDC tokens that match the configured attribute conditions.

Service account `rosie-pipeline-sa` has:
- `roles/storage.objectAdmin` — read/write VCFs in GCS
- `roles/run.developer` — execute Cloud Run Jobs
- `roles/aiplatform.user` — call Gemma 4 on Vertex AI
- `roles/iam.workloadIdentityUser` — be impersonated via WIF

### Callback authentication

The pipeline (running in Cloud Run) calls back to the Next.js API to update case status. Anyone on the internet could call that endpoint. To prevent fake callbacks, both sides share `PIPELINE_CALLBACK_SECRET`. Cloud Run sends it as `Authorization: Bearer {secret}`. The Next.js route rejects anything that doesn't match.

### Supabase Realtime

The `/cases/[id]` page subscribes to Postgres changes on the `cases` table filtered to the current case ID. When the pipeline callback updates the row, Supabase pushes the change to all subscribers over a WebSocket. The browser re-fetches the full row and re-renders — no polling interval, no page refresh.

---

## Environment variables

| Variable | Set on | Purpose |
|---|---|---|
| `GCS_BUCKET` | Vercel | Bucket name for VCF uploads |
| `GCP_PROJECT_ID` | Vercel + Cloud Run | GCP project |
| `CLOUD_RUN_JOB_NAME` | Vercel | Full job resource name for the Jobs API |
| `PIPELINE_CALLBACK_SECRET` | Vercel + Cloud Run | Shared secret for callback auth |
| `NEXT_PUBLIC_APP_URL` | Vercel | Vercel deployment URL — passed to Cloud Run so it knows where to call back |
| `VERCEL_OIDC_TOKEN` | Auto-injected by Vercel | OIDC token used for WIF auth |
| `CASE_ID`, `GCS_VCF_PATH`, `ALLELES`, etc. | Injected per-run by Cloud Run Jobs API | Per-job configuration |

---

## Key files

| File | Purpose |
|---|---|
| `pipeline/run_cloud.py` | Cloud Run Job entrypoint |
| `pipeline/Dockerfile` | Container definition |
| `src/lib/gcp-auth.ts` | WIF token exchange helper |
| `src/app/api/upload-url/route.ts` | Generates GCS resumable upload URI |
| `src/app/api/cases/route.ts` | Creates case + triggers Cloud Run Job |
| `src/app/api/cases/[id]/progress/route.ts` | Receives pipeline stage callbacks |
| `src/app/cases/[id]/page.tsx` | Client component with Realtime subscription |
| `scripts/gcs-lifecycle.json` | GCS 30-day auto-delete lifecycle rule |
