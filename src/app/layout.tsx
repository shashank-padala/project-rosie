import type { Metadata } from "next"
import { DM_Sans, Inter, Geist_Mono } from "next/font/google"
import "./globals.css"

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] })
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Rosie | Personalized Cancer Vaccines for Dogs",
  description:
    "Upload a tumor VCF. Get ranked neoantigen candidates with binding scores, a prioritization report your oncologist can act on, and a personalized mRNA vaccine sequence — in under 6 hours.",
  metadataBase: new URL("https://rosie.kiraklabs.com"),
  openGraph: {
    title: "Rosie | Personalized Cancer Vaccines for Dogs",
    description: "Personalized cancer vaccines for dogs. Upload a tumor VCF, get ranked neoantigen candidates with binding scores, a prioritization report your oncologist can act on, and a personalized mRNA vaccine sequence.",
    type: "website",
    url: "https://rosie.kiraklabs.com",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Project Rosie" }],
  },
  twitter: {
    card: "summary",
    title: "Rosie | Personalized Cancer Vaccines for Dogs",
    description: "Upload a tumor VCF. Get ranked neoantigen candidates with binding scores, a prioritization report your oncologist can act on, and synthesis-ready mRNA — in under 6 hours.",
    images: ["/icon-512.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-icon.png",
    shortcut: "/favicon-16x16.png",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  )
}
