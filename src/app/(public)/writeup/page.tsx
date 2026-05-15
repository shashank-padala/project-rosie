import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import { WriteupRenderer } from "./WriteupRenderer"

export const metadata: Metadata = {
  title: "Rosie: AI Clinical Assistant for Oncologists | Gemma4Good Writeup",
  description:
    "The AI Clinical Assistant for Oncologists — starting with veterinary medicine. From tumor DNA to a synthesis-ready mRNA vaccine in under an hour. Gemma4Good hackathon writeup.",
  openGraph: {
    title: "Rosie: AI Clinical Assistant for Oncologists",
    description:
      "The AI Clinical Assistant for Oncologists — starting with veterinary medicine. From tumor DNA to a synthesis-ready mRNA vaccine in under an hour.",
    type: "article",
    url: "https://rosie.kiraklabs.com/writeup",
    images: [{ url: "/project-rosie-cover.png", width: 1804, height: 1194, alt: "Project Rosie — AI Clinical Assistant for Oncologists" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rosie: AI Clinical Assistant for Oncologists",
    description:
      "From tumor DNA to a synthesis-ready mRNA vaccine in under an hour. Gemma4Good Health & Sciences hackathon writeup.",
    images: ["/project-rosie-cover.png"],
  },
}

export default function WriteupPage() {
  const mdPath = path.join(process.cwd(), "docs", "hackathon-writeup.md")
  const content = fs.readFileSync(mdPath, "utf-8")

  return <WriteupRenderer content={content} />
}
