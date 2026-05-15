"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import Link from "next/link"
import Image from "next/image"
import type { Components } from "react-markdown"

const mdComponents: Components = {
  h1: ({ children }) => (
    <h1
      className="text-3xl font-bold text-foreground mt-10 mb-4 first:mt-0"
      style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2
      className="text-xl font-bold text-foreground mt-10 mb-3 pb-2 border-b border-border/50"
      style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      className="text-base font-semibold text-foreground mt-6 mb-2"
      style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
    >
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-muted-foreground text-sm leading-7 mb-4">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-muted-foreground">{children}</em>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/50 pl-4 my-4 text-muted-foreground/80 text-sm italic">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-outside pl-5 mb-4 space-y-1.5 text-sm text-muted-foreground">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside pl-5 mb-4 space-y-1.5 text-sm text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-")
    if (isBlock) {
      return (
        <code className="block bg-secondary/60 rounded-lg p-4 text-xs font-mono text-foreground/80 overflow-x-auto my-4 leading-relaxed">
          {children}
        </code>
      )
    }
    return (
      <code className="bg-secondary/60 rounded px-1.5 py-0.5 text-xs font-mono text-primary">
        {children}
      </code>
    )
  },
  pre: ({ children }) => <pre className="my-4 overflow-x-auto">{children}</pre>,
  table: ({ children }) => (
    <div className="overflow-x-auto my-6 rounded-xl border border-border/60">
      <table className="w-full text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-secondary/50 border-b border-border/60">{children}</thead>
  ),
  th: ({ children }) => (
    <th
      className="px-4 py-3 text-left font-semibold text-foreground"
      style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
    >
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-muted-foreground border-t border-border/30 leading-relaxed">
      {children}
    </td>
  ),
  hr: () => <hr className="border-border/40 my-8" />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
    >
      {children}
    </a>
  ),
}

export function WriteupRenderer({ content }: { content: string }) {
  // Strip the h1, italic track line, bold subtitle, and leading hr — rendered in styled header above
  const withoutTitle = content
    .replace(/^#\s+.+\n/, "")
    .replace(/^\n\*.+\*\n/, "")
    .replace(/^\n\*\*.+\*\*\n/, "")
    .replace(/^\n---\n/, "")

  return (
    <div className="max-w-3xl mx-auto w-full px-5 sm:px-6 pt-10 pb-20">
      {/* Back nav */}
      <Link
        href="/docs"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        ← Docs &amp; Writing
      </Link>

      {/* Header */}
      <div className="mb-10">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md border border-amber-500/30 text-amber-500 bg-amber-500/5">
            Gemma4Good
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md border border-primary/30 text-primary bg-primary/5">
            Health &amp; Sciences
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md border border-border/60 text-muted-foreground bg-secondary/40">
            Hackathon Writeup
          </span>
        </div>

        <h1
          className="text-3xl sm:text-4xl font-bold text-foreground mb-3 leading-tight"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          Rosie: AI Clinical Assistant for Oncologists
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          The AI Clinical Assistant for Oncologists — starting with veterinary medicine.
          From tumor DNA to a synthesis-ready mRNA vaccine in under an hour,
          with Gemma&nbsp;4 as the intelligence layer no vet clinic can otherwise hire.
        </p>

        <div className="flex flex-wrap items-center gap-4 mt-5 pt-5 border-t border-border/40">
          <span className="text-xs text-muted-foreground/60">By Shashank Padala · Kirak Labs · May 2026</span>
          <div className="flex gap-3 ml-auto">
            <a
              href="https://rosie.kiraklabs.com/demo"
              className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors font-semibold"
            >
              Try the demo →
            </a>
            <a
              href="https://github.com/shashank-padala/project-rosie"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>

      {/* Hero image */}
      <div className="rounded-2xl overflow-hidden mb-10 border border-border/30">
        <Image
          src="/project-rosie-cover.png"
          alt="Project Rosie — AI Clinical Assistant for Oncologists"
          width={1804}
          height={1194}
          className="w-full object-cover"
          priority
        />
      </div>

      {/* Markdown body */}
      <article>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
          {withoutTitle}
        </ReactMarkdown>
      </article>

      {/* Footer CTA */}
      <div className="mt-14 rounded-2xl border border-primary/20 bg-primary/5 px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p
            className="text-sm font-semibold text-foreground mb-1"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            See it working
          </p>
          <p className="text-xs text-muted-foreground">
            A canine mammary tumor case — 4 neoantigen candidates, clinical report, and synthesis spec.
          </p>
        </div>
        <a
          href="https://rosie.kiraklabs.com/demo"
          className="shrink-0 text-xs px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-md shadow-primary/20"
        >
          Open demo →
        </a>
      </div>
    </div>
  )
}
