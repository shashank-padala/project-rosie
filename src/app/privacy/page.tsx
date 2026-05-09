import Link from "next/link"
import { Navigation } from "@/components/Navigation"

export const metadata = {
  title: "Privacy Policy — Project Rosie",
}

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-1 max-w-2xl mx-auto w-full px-5 sm:px-6 pt-28 pb-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-sm">Last updated: May 2026</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-foreground font-semibold text-lg mb-3" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              1. What We Collect
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <span className="text-foreground font-medium">Account data</span> — your name and email
                address from Google, collected when you sign in via Google OAuth.
              </li>
              <li>
                <span className="text-foreground font-medium">Uploaded files</span> — VCF files you
                submit are stored in Google Cloud Storage for the duration of your pipeline run and
                retained for case review.
              </li>
              <li>
                <span className="text-foreground font-medium">Pipeline results</span> — ranked candidates,
                clinical reports, and mRNA sequences are stored in our database linked to your account.
              </li>
              <li>
                <span className="text-foreground font-medium">Usage data</span> — submission timestamps
                and case status. We do not use analytics trackers or ad networks.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground font-semibold text-lg mb-3" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              2. How We Use It
            </h2>
            <p>
              Your data is used solely to operate the pipeline and display results to you. We do not
              sell, share, or license your data to third parties. VCF files and pipeline outputs are
              never used to train machine learning models without explicit consent.
            </p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold text-lg mb-3" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              3. Where It&apos;s Stored
            </h2>
            <p>
              Account and case data is stored in Supabase (PostgreSQL), hosted on AWS. VCF files are
              stored in Google Cloud Storage (us-central1). Pipeline jobs run on Google Cloud Run.
              All data is encrypted at rest and in transit.
            </p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold text-lg mb-3" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              4. Data Retention
            </h2>
            <p>
              Case data and uploaded files are retained for as long as your account is active. You may
              request deletion of your data at any time by emailing{" "}
              <a href="mailto:shashank.padala@gmail.com" className="text-primary hover:underline">
                shashank.padala@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold text-lg mb-3" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              5. Third-Party Services
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <span className="text-foreground font-medium">Google OAuth</span> — used for
                authentication. Governed by Google&apos;s Privacy Policy.
              </li>
              <li>
                <span className="text-foreground font-medium">Supabase</span> — database and auth
                infrastructure.
              </li>
              <li>
                <span className="text-foreground font-medium">Google Cloud</span> — file storage and
                pipeline compute.
              </li>
              <li>
                <span className="text-foreground font-medium">Vercel</span> — web hosting.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground font-semibold text-lg mb-3" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              6. Your Rights
            </h2>
            <p>
              You may request access to, correction of, or deletion of your personal data at any time.
              Contact us at{" "}
              <a href="mailto:shashank.padala@gmail.com" className="text-primary hover:underline">
                shashank.padala@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold text-lg mb-3" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              7. Changes
            </h2>
            <p>
              We may update this policy as the platform evolves. Significant changes will be communicated
              via email to registered users.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-8 border-t border-border/50">
          <Link href="/terms" className="text-primary text-sm hover:underline font-medium">
            Read our Terms of Service →
          </Link>
        </div>
      </main>
    </div>
  )
}
