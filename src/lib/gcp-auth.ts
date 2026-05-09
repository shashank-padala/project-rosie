import { GoogleAuth } from "google-auth-library"

const PROJECT_NUMBER = "575738151193"
const POOL_ID        = "vercel-pool"
const PROVIDER_ID    = "vercel-provider"
const SA_EMAIL       = "rosie-pipeline-sa@project-1ea30ea7-dc79-4a14-84b.iam.gserviceaccount.com"

export async function getGcpAccessToken(): Promise<string> {
  // Local dev with JSON key env var
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
    const auth = new GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/cloud-platform"] })
    const token = await auth.getAccessToken()
    return token as string
  }

  // Vercel production: WIF via OIDC token
  const oidcToken = process.env.VERCEL_OIDC_TOKEN
  if (oidcToken) {
    const stsRes = await fetch("https://sts.googleapis.com/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type:            "urn:ietf:params:oauth:grant-type:token-exchange",
        audience:              `//iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/providers/${PROVIDER_ID}`,
        scope:                 "https://www.googleapis.com/auth/cloud-platform",
        requested_token_type:  "urn:ietf:params:oauth:token-type:access_token",
        subject_token:         oidcToken,
        subject_token_type:    "urn:ietf:params:oauth:token-type:jwt",
      }),
    })
    if (!stsRes.ok) throw new Error(`STS exchange failed: ${await stsRes.text()}`)
    const { access_token: federatedToken } = await stsRes.json()

    const impersonateRes = await fetch(
      `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${SA_EMAIL}:generateAccessToken`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${federatedToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ scope: ["https://www.googleapis.com/auth/cloud-platform"] }),
      }
    )
    if (!impersonateRes.ok) throw new Error(`Impersonation failed: ${await impersonateRes.text()}`)
    const { accessToken } = await impersonateRes.json()
    return accessToken
  }

  // Fallback: Application Default Credentials (local after gcloud auth application-default login)
  const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] })
  const token = await auth.getAccessToken()
  return token as string
}
