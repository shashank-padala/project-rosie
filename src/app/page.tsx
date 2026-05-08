import Link from "next/link"
import { Navigation } from "@/components/Navigation"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.75_0.15_175/0.08)_0%,transparent_60%)] pointer-events-none" />
        <Badge variant="outline" className="mb-6 text-primary border-primary/30 bg-primary/5 px-3 py-1">
          Built for Gemma4Good Hackathon
        </Badge>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight max-w-3xl leading-[1.15] mb-6">
          Personalized cancer vaccines for dogs —{" "}
          <span className="text-primary">designed in 24 hours</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mb-10 leading-relaxed">
          Upload a tumor VCF. Get a ranked neoantigen candidate list, an AI clinical report,
          and synthesis-ready mRNA. Built on open science.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/demo"
            className="px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-sm"
          >
            Try the Demo
          </Link>
          <Link
            href="/auth/signup"
            className="px-6 py-3 rounded-md border border-border bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors text-sm"
          >
            Request Access
          </Link>
        </div>

        {/* Pipeline flow */}
        <div className="mt-16 flex flex-col sm:flex-row items-center gap-2 text-xs text-muted-foreground max-w-2xl w-full justify-center">
          {[
            { label: "Tumor VCF", icon: "🧬" },
            { label: "Variant Calling", icon: "🔍" },
            { label: "Epitope Scoring", icon: "⚗️" },
            { label: "AI Report", icon: "🤖" },
            { label: "mRNA FASTA", icon: "💉" },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg border border-border/50 bg-card/50 min-w-[90px]">
                <span className="text-lg">{step.icon}</span>
                <span>{step.label}</span>
              </div>
              {i < 4 && <span className="text-border hidden sm:block">→</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Problem */}
      <section className="px-4 py-20 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-muted-foreground text-sm uppercase tracking-widest mb-8 font-medium">
            The Problem
          </p>
          <div className="max-w-2xl mx-auto mb-12 space-y-5 text-center">
            <p className="text-2xl sm:text-3xl font-medium leading-relaxed">
              An ML scientist and tech entrepreneur spent{" "}
              <span className="text-primary">3 months</span> with a university
              research lab to design a personalized cancer vaccine for his dog.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              NBC News covered it as a{" "}
              <a
                href="https://youtu.be/14SgyUhSIGQ?si=iw5FrjprnY46SEHG"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
              >
                medical breakthrough
              </a>
              {" "}— because it was. He made something genuinely impossible possible.
              But it required being an AI veteran with connections to university research
              infrastructure. That&apos;s not ground reality for most dog owners.
              It was a one-off. <strong className="text-foreground">We&apos;re making it the standard.</strong>
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { before: "3 months", after: "24 hours", label: "Design time" },
              { before: "PhD lab", after: "Any vet clinic", label: "Who can access it" },
              { before: "$10,000+", after: "~$15", label: "Compute cost" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border/50 bg-card p-6 text-center"
              >
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-muted-foreground line-through text-sm mb-1">{stat.before}</p>
                <p className="text-primary text-xl font-bold">{stat.after}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-20 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-muted-foreground text-sm uppercase tracking-widest mb-3 font-medium">
            How It Works
          </p>
          <h2 className="text-center text-3xl font-bold mb-12">
            Three steps from biopsy to vaccine spec
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                title: "Upload a tumor VCF",
                body: "Standard variant call format from whole-genome or targeted sequencing. Paired tumor/normal or tumor-only.",
              },
              {
                num: "02",
                title: "AI scores 190K+ peptides",
                body: "NetMHCpan predicts MHC binding affinity across all mutations × alleles × lengths. Top candidates ranked by composite score.",
              },
              {
                num: "03",
                title: "Clinical report + mRNA spec",
                body: "An AI model writes a veterinary clinical report. The pipeline outputs a codon-optimized mRNA FASTA ready for synthesis.",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="rounded-xl border border-border/50 bg-card p-6"
              >
                <p className="text-primary text-3xl font-bold mb-3">{step.num}</p>
                <h3 className="text-foreground font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="px-4 py-20 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-muted-foreground text-sm uppercase tracking-widest mb-3 font-medium">
            Output
          </p>
          <h2 className="text-center text-3xl font-bold mb-12">What you get back</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                body: "Codon-optimized construct with 5'UTR, Kozak, AAY-linked epitopes, 3'UTR, and poly-A(60) tail.",
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="rounded-xl border border-border/50 bg-card p-6 flex gap-4"
              >
                <span className="text-2xl shrink-0 mt-0.5">{feat.icon}</span>
                <div>
                  <h3 className="font-semibold mb-1">{feat.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feat.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 border-t border-border/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">See it in action</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Explore the full pipeline output on the HCC1395 breast cancer benchmark — ranked
            candidates, clinical report, and mRNA construct.
          </p>
          <Link
            href="/demo"
            className="inline-block px-8 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            View Demo Case →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/50 px-4 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>🐾</span>
            <span>Project Rosie — Open Source</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/shashank-padala/project-rosie"
              className="hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <Badge variant="outline" className="border-primary/30 text-primary text-xs">
              Built for Gemma4Good
            </Badge>
          </div>
        </div>
      </footer>
    </div>
  )
}
