import type { Metadata } from "next"
import { DM_Sans, Inter, Geist_Mono } from "next/font/google"
import "./globals.css"

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] })
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Project Rosie — Personalized Cancer Vaccines for Dogs",
  description:
    "Upload a tumor VCF. Get a ranked vaccine candidate list, an AI clinical report, and synthesis-ready mRNA in 24 hours.",
  openGraph: {
    title: "Project Rosie",
    description: "Personalized cancer vaccines for dogs — designed by AI, validated by science.",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  )
}
