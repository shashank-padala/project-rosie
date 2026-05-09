export const runtime = "nodejs"
export const maxDuration = 120

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getGcpAccessToken } from "@/lib/gcp-auth"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    const bucket = process.env.GCS_BUCKET
    if (!bucket) return NextResponse.json({ error: "GCS_BUCKET not configured" }, { status: 500 })

    const gcsPath = `vcf/${user.id}/${Date.now()}/${file.name}`
    const token = await getGcpAccessToken()
    const fileBuffer = await file.arrayBuffer()

    const res = await fetch(
      `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(gcsPath)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/octet-stream",
        },
        body: fileBuffer,
      }
    )

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `GCS error: ${text}` }, { status: 500 })
    }

    return NextResponse.json({ gcsPath: `gs://${bucket}/${gcsPath}` })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
