import Link from "next/link"
import { Navigation } from "@/components/Navigation"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-5 sm:px-6 pt-36 pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,hsl(160_84%_29%/0.06)_0%,transparent_70%)] pointer-events-none" />

        <div className="animate-fade-up">
          <Badge variant="outline" className="mb-7 text-primary border-primary/30 bg-primary/5 px-3.5 py-1 text-xs font-medium tracking-wide">
            Built for Gemma4Good Hackathon
          </Badge>
        </div>

        <h1
          className="animate-fade-up-1 text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight max-w-3xl leading-[1.08] mb-6"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          Personalized cancer vaccines{" "}
          <span className="text-gradient">for dogs</span>
        </h1>

        <p className="animate-fade-up-2 text-lg sm:text-xl text-muted-foreground max-w-lg mb-10 leading-relaxed">
          Upload a tumor biopsy file. Get ranked vaccine targets, an AI clinical
          report, and a synthesis-ready mRNA sequence — in 24 hours.
        </p>

        <div className="animate-fade-up-3 flex flex-col sm:flex-row gap-3">
          <Link
            href="/demo"
            className="px-7 py-3 rounded-xl bg-hero-gradient text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/25 text-sm"
          >
            Try the Demo
          </Link>
          <Link
            href="/auth/signup"
            className="px-7 py-3 rounded-xl border border-border bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/70 transition-colors text-sm"
          >
            Request Access
          </Link>
        </div>

        {/* Pipeline flow */}
        <div className="animate-fade-up-4 mt-16 flex flex-col sm:flex-row items-center gap-2 text-xs text-muted-foreground max-w-2xl w-full justify-center">
          {[
            { label: "Tumor VCF", icon: "🧬" },
            { label: "Variant Calling", icon: "🔍" },
            { label: "Epitope Scoring", icon: "⚗️" },
            { label: "AI Report", icon: "🤖" },
            { label: "mRNA FASTA", icon: "💉" },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border border-border/60 bg-card/60 min-w-[96px] hover:border-primary/30 transition-colors">
                <span className="text-xl">{step.icon}</span>
                <span className="font-medium">{step.label}</span>
              </div>
              {i < 4 && <span className="text-border/60 hidden sm:block text-base">→</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Problem */}
      <section className="px-5 sm:px-6 py-24 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-muted-foreground text-xs uppercase tracking-widest mb-4 font-semibold">
            The Problem
          </p>
          <h2
            className="text-center text-3xl sm:text-4xl font-bold mb-6 max-w-2xl mx-auto leading-tight"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            One dog. One vaccine. Three months.{" "}
            <span className="text-gradient">One breakthrough.</span>
          </h2>
          <div className="max-w-2xl mx-auto mb-14 text-center space-y-4">
            <p className="text-muted-foreground leading-relaxed text-base sm:text-lg">
              An ML scientist and tech entrepreneur dedicated three months and a university
              research lab to designing a personalized cancer vaccine for his dog.
              NBC News called it{" "}
              <a
                href="https://youtu.be/14SgyUhSIGQ?si=iw5FrjprnY46SEHG"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors font-medium"
              >
                a medical breakthrough
              </a>
              {" "}— and it was.
            </p>
            <p className="text-muted-foreground leading-relaxed text-base sm:text-lg">
              But it required being an AI veteran with rare access to university infrastructure.
              That's not available to most dog owners and their vets.{" "}
              <span className="text-foreground font-semibold">It was a one-off. We're making it the standard.</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { before: "3 months", after: "24 hours", label: "Design time", icon: "⏱️" },
              { before: "PhD lab required", after: "Any vet clinic", label: "Accessibility", icon: "🏥" },
              { before: "$10,000+", after: "~$15", label: "Compute cost", icon: "💰" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border/60 bg-card p-6 text-center hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
              >
                <span className="text-2xl mb-3 block">{stat.icon}</span>
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-semibold">
                  {stat.label}
                </p>
                <p className="text-muted-foreground/60 line-through text-sm mb-1.5">{stat.before}</p>
                <p className="text-primary text-2xl font-bold" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
                  {stat.after}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-5 sm:px-6 py-24 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-muted-foreground text-xs uppercase tracking-widest mb-4 font-semibold">
            How It Works
          </p>
          <h2
            className="text-center text-3xl sm:text-4xl font-bold mb-14"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            Three steps from biopsy to vaccine spec
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                num: "01",
                icon: "🧬",
                title: "Upload a tumor VCF",
                body: "Standard variant call format from whole-genome or targeted sequencing. Paired tumor/normal or tumor-only.",
              },
              {
                num: "02",
                icon: "⚗️",
                title: "AI scores 190K+ peptides",
                body: "NetMHCpan predicts MHC binding affinity across all mutations × alleles × lengths. Top candidates ranked by composite score.",
              },
              {
                num: "03",
                icon: "📋",
                title: "Clinical report + mRNA spec",
                body: "An AI model writes a veterinary clinical report. The pipeline outputs a codon-optimized mRNA FASTA ready for synthesis.",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="rounded-2xl border border-border/60 bg-card p-6 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-xl shrink-0">
                    {step.icon}
                  </div>
                  <span className="text-primary text-2xl font-bold" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
                    {step.num}
                  </span>
                </div>
                <h3
                  className="text-foreground font-semibold mb-2 text-base"
                  style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
                >
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="px-5 sm:px-6 py-24 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-muted-foreground text-xs uppercase tracking-widest mb-4 font-semibold">
            Output
          </p>
          <h2
            className="text-center text-3xl sm:text-4xl font-bold mb-14"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            What you get back
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                icon: "📊",
                title: "Ranked neoantigen candidates",
                body: "Top 20 epitopes by composite score: IC50 binding affinity, immunogenicity prediction, variant allele frequency.",
              },
              {
                icon: "📋",
                title: "AI clinical report",
                body: "Veterinary-grade report with embedded charts, candidate reasoning, and recommended next steps.",
              },
              {
                icon: "📈",
                title: "Binding affinity charts",
                body: "IC50 bar chart and mutation landscape pie chart — publication-quality visuals for every case.",
              },
              {
                icon: "🧫",
                title: "Synthesis-ready mRNA FASTA",
                body: "Codon-optimized construct with 5′UTR, Kozak, AAY-linked epitopes, 3′UTR, and poly-A(60) tail.",
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="rounded-2xl border border-border/60 bg-card p-6 flex gap-4 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
              >
                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-xl shrink-0">
                  {feat.icon}
                </div>
                <div>
                  <h3
                    className="font-semibold mb-1.5 text-foreground"
                    style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
                  >
                    {feat.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feat.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 sm:px-6 py-24 border-t border-border/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-5"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            See it in action
          </h2>
          <p className="text-muted-foreground mb-9 leading-relaxed text-base sm:text-lg max-w-md mx-auto">
            Explore the full pipeline output on the HCC1395 breast cancer benchmark — ranked
            candidates, clinical report, and mRNA construct.
          </p>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-hero-gradient text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/25 text-sm"
          >
            View Demo Case
            <span>→</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/50 px-5 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <span className="text-base">🐾</span>
            <span className="font-medium">Project Rosie — Open Source</span>
          </div>
          <div className="flex items-center gap-5">
            <a
              href="https://github.com/shashank-padala/project-rosie"
              className="hover:text-foreground transition-colors font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <Badge variant="outline" className="border-primary/30 text-primary text-xs font-medium">
              Built for Gemma4Good
            </Badge>
          </div>
        </div>
      </footer>
    </div>
  )
}
