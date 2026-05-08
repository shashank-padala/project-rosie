"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface Message {
  role: "user" | "assistant"
  content: string
}

export function ChatWidget({ caseId }: { caseId: string }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
      setMessages((m) => [...m, { role: "assistant", content: "Failed to reach Gemma 4. Try again." }])
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

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors text-sm font-medium"
      >
        <span>🤖</span> Ask Clinical AI
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 flex flex-col rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <span>🤖</span>
          <span className="text-sm font-medium">Clinical AI Assistant</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-sm">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[340px]">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center mt-8">
            Ask anything about the candidates, clinical report, or mRNA design.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-lg px-3 py-2 text-xs text-muted-foreground">
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-border flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about this case… (Enter to send)"
          rows={2}
          className="resize-none text-xs"
        />
        <Button onClick={send} disabled={loading || !input.trim()} size="sm" className="shrink-0 self-end">
          Send
        </Button>
      </div>
    </div>
  )
}
