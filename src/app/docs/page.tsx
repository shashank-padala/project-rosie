import { Navigation } from "@/components/Navigation"
import { Badge } from "@/components/ui/badge"

const DOCS = [
  {
    category: "Blog",
    categoryStyle: "border-primary/30 text-primary bg-primary/5",
    title: "The cancer vaccine story",
    description:
      "How one ML scientist spent three months designing a personalized cancer vaccine for his dying dog — and what it revealed about the gap between research and accessibility.",
    href: "https://github.com/shashank-padala/project-rosie/blob/main/docs/blog-01-cancer-vaccine-case.md",
    external: true,
  },
  {
    category: "Hackathon Entry",
    categoryStyle: "border-amber-500/30 text-amber-600 bg-amber-500/5",
    title: "Project Rosie: Open Source AI Pipeline",
    description:
      "Gemma4Good hackathon writeup. How Gemma 4's native function calling, multimodal vision, and 256K context make it the intelligence layer — not a report formatter bolted on at the end.",
    href: "https://padala.ai/blogs/project-rosie-open-source-ai-pipeline",
    external: true,
  },
  {
    category: "Explainer",
    categoryStyle: "border-blue-500/30 text-blue-600 bg-blue-500/5",
    title: "From DNA to vaccine candidates",
    description:
      "The full pipeline journey, written for readers with no biology background. Think of it as tracing a request through a distributed system — except the data is a dog's DNA.",
    href: "https://github.com/shashank-padala/project-rosie/blob/main/docs/explainers/01-from-dna-to-vaccine-candidates.md",
    external: true,
  },
  {
    category: "Technical",
    categoryStyle: "border-border/60 text-muted-foreground bg-secondary/50",
    title: "Key architecture decisions",
    description:
      "Every non-obvious choice made in Project Rosie, and why. Written so a future contributor or hackathon judge can understand the reasoning without asking.",
    href: "https://github.com/shashank-padala/project-rosie/blob/main/docs/explainers/02-key-decisions.md",
    external: true,
  },
  {
    category: "Technical",
    categoryStyle: "border-border/60 text-muted-foreground bg-secondary/50",
    title: "Frontend architecture",
    description:
      "The Next.js 16 + Supabase + Tailwind v4 stack explained. Written for engineers unfamiliar with the frontend. Biology background not needed.",
    href: "https://github.com/shashank-padala/project-rosie/blob/main/docs/explainers/03-frontend-architecture.md",
    external: true,
  },
]

export default function DocsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-1 max-w-4xl mx-auto w-full px-5 sm:px-6 pt-28 pb-16">
        <div className="mb-10">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            Docs &amp; Writing
          </h1>
          <p className="text-muted-foreground text-sm">
            Pipeline explainers, architecture notes, and the Gemma4Good hackathon writeup.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DOCS.map((doc) => (
            <a
              key={doc.title}
              href={doc.href}
              target={doc.external ? "_blank" : undefined}
              rel={doc.external ? "noopener noreferrer" : undefined}
              className="group rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-3">
                <Badge variant="outline" className={`text-xs font-semibold px-2 py-0.5 rounded-md ${doc.categoryStyle}`}>
                  {doc.category}
                </Badge>
                <span className="text-muted-foreground/40 group-hover:text-primary/60 transition-colors text-sm">↗</span>
              </div>
              <div>
                <h2
                  className="font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors"
                  style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
                >
                  {doc.title}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{doc.description}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border/60 bg-secondary/30 px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground mb-0.5">Source code</p>
            <p className="text-xs text-muted-foreground">Full pipeline, frontend, and scripts on GitHub.</p>
          </div>
          <a
            href="https://github.com/shashank-padala/project-rosie"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs px-4 py-2 rounded-lg bg-hero-gradient text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-md shadow-primary/20"
          >
            GitHub →
          </a>
        </div>
      </main>
    </div>
  )
}
