"use client"

import { useState, useRef, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"

interface Message {
  role: "user" | "assistant"
  content: string
}

const INTRO: Message = {
  role: "assistant",
  content:
    "Hi, I'm Rosie, your clinical AI assistant. I have full context on this case: the ranked neoantigen candidates, binding affinity scores, clinical report, and mRNA design. Ask me anything.",
}

type WidgetState = "closed" | "minimized" | "open"

export function ChatWidget({ caseId }: { caseId: string }) {
  const [state, setState] = useState<WidgetState>("open")
  const [messages, setMessages] = useState<Message[]>([INTRO])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (state === "open") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, state])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: "user", content: input.trim() }
    setMessages((m) => [...m, userMsg])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch(`/api/cases/${caseId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content, history: messages }),
      })
      const data = await res.json()
      setMessages((m) => [...m, { role: "assistant", content: data.reply ?? data.error ?? "No response" }])
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Failed to reach Rosie. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  /* ── Closed: floating bubble ── */
  if (state === "closed") {
    return (
      <button
        onClick={() => setState("open")}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:opacity-90 transition-opacity text-sm font-semibold"
      >
        <span className="text-base leading-none">🐾</span>
        Ask Rosie
      </button>
    )
  }

  /* ── Minimized: header bar only ── */
  if (state === "minimized") {
    return (
      <div className="fixed bottom-6 right-6 z-50 w-64 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
        <ChatHeader onMinimize={() => setState("open")} minimized />
      </div>
    )
  }

  /* ── Open: full chat window ── */
  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 flex flex-col rounded-xl border border-border bg-card shadow-2xl shadow-black/20 overflow-hidden max-h-[520px]">
      <ChatHeader onMinimize={() => setState("minimized")} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[260px] max-h-[360px]">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs shrink-0 mt-0.5">
                🐾
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-secondary text-foreground rounded-bl-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs shrink-0 mt-0.5">
              🐾
            </div>
            <div className="bg-secondary rounded-2xl rounded-bl-sm px-3 py-2 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border/60 flex gap-2 items-end bg-card">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about this case… (Enter to send)"
          rows={2}
          className="resize-none text-xs flex-1"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="shrink-0 h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40"
          aria-label="Send"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M12 7L2 2l2.5 5L2 12l10-5z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function ChatHeader({
  onMinimize,
  minimized = false,
}: {
  onMinimize: () => void
  minimized?: boolean
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 bg-primary cursor-pointer select-none"
      onClick={onMinimize}
    >
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-full bg-white/15 flex items-center justify-center text-sm">
          🐾
        </div>
        <div>
          <p className="text-sm font-semibold text-primary-foreground leading-none">Ask Rosie</p>
          <p className="text-[10px] text-primary-foreground/70 mt-0.5">Clinical AI Assistant</p>
        </div>
        <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onMinimize() }}
        className="h-6 w-6 rounded flex items-center justify-center text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 transition-colors"
        aria-label={minimized ? "Expand" : "Minimize"}
      >
        {minimized ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 7l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  )
}
