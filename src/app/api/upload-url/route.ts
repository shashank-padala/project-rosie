import { NextRequest, NextResponse } from "next/server"
import { Storage } from "@google-cloud/storage"
import { createServerClient } from "@/lib/supabase/server"

function getStorage() {
  const credJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  if (!credJson) throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON not set")
  const credentials = JSON.parse(credJson)
  return new Storage({ credentials, projectId: credentials.project_id })
}

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const filename = searchParams.get("filename")
  if (!filename) return NextResponse.json({ error: "filename required" }, { status: 400 })

  const bucket = process.env.GCS_BUCKET
  if (!bucket) return NextResponse.json({ error: "GCS_BUCKET not configured" }, { status: 500 })

  const gcsPath = `vcf/${user.id}/${Date.now()}/${filename}`

  const [signedUrl] = await getStorage()
    .bucket(bucket)
    .file(gcsPath)
    .generateSignedPostPolicyV4({
      expires: Date.now() + 15 * 60 * 1000,
      conditions: [["content-length-range", 0, 500 * 1024 * 1024]],
    })

  return NextResponse.json({ signedUrl, gcsPath: `gs://${bucket}/${gcsPath}` })
}
