import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getGcpAccessToken } from "@/lib/gcp-auth"

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
  const token = await getGcpAccessToken()

  // Initiate a GCS resumable upload — server gets the URI, browser uploads directly
  const res = await fetch(
    `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=resumable&name=${encodeURIComponent(gcsPath)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": "application/octet-stream",
      },
      body: JSON.stringify({}),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: `GCS error: ${text}` }, { status: 500 })
  }

  const uploadUri = res.headers.get("Location")!
  return NextResponse.json({ uploadUri, gcsPath: `gs://${bucket}/${gcsPath}` })
}
