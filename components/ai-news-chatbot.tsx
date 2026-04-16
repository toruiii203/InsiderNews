"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Bot, User, Loader2, Zap } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

const SUGGESTIONS = [
  "What's the latest in Philippine politics?",
  "Tell me about tourism in the Philippines",
  "Summarize today's top business news",
  "What's happening in the West Philippine Sea?",
]

export function AiNewsChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your Insider News PH assistant. Ask me anything about Philippine news, current events, or get a summary of today's top stories.",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [provider, setProvider] = useState<"groq" | "gemini" | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isOpen])

  const sendMessage = async (text?: string) => {
    const userMsg = (text || input).trim()
    if (!userMsg || isLoading) return
    setInput("")
    const updatedMessages: Message[] = [...messages, { role: "user", content: userMsg }]
    setMessages(updatedMessages)
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      })
      const data = await response.json()
      if (data.provider) setProvider(data.provider)
      setMessages((prev) => [...prev, { role: "assistant", content: data.message || "Sorry, I couldn't process that." }])
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Connection error. Please check that GROQ_API_KEY or GEMINI_API_KEY is set in your .env.local file.",
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const showSuggestions = messages.length === 1

  return (
    <>
      {/* Floating button */}
      <button suppressHydrationWarning
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex items-center gap-2 bg-[#002D72] hover:bg-[#001a50] text-white px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        {!isOpen && <span className="text-sm font-medium hidden sm:inline">Ask the News Bot</span>}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-36 right-4 sm:right-6 md:bottom-20 z-50 w-[340px] sm:w-[390px] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "540px" }}>

          {/* Header */}
          <div className="bg-[#002D72] px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-full bg-[#FCD116] flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-[#002D72]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold">Insider News Bot</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-gray-300 text-[10px] flex items-center gap-1">
                  <Zap className="h-2.5 w-2.5 text-[#FCD116]" />
                  {provider === "groq" ? "Groq · LLaMA 3.3 70B" : provider === "gemini" ? "Google · Gemini 1.5 Flash" : "AI Powered"}
                </p>
              </div>
            </div>
            <button suppressHydrationWarning onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === "assistant" ? "bg-[#002D72]" : "bg-[#CE1126]"}`}>
                  {msg.role === "assistant" ? <Bot className="h-3.5 w-3.5 text-white" /> : <User className="h-3.5 w-3.5 text-white" />}
                </div>
                <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed max-w-[82%] ${
                  msg.role === "assistant"
                    ? "bg-muted text-foreground rounded-tl-none"
                    : "bg-[#002D72] text-white rounded-tr-none"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Suggestions */}
            {showSuggestions && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] text-muted-foreground px-1">Try asking:</p>
                {SUGGESTIONS.map((s, i) => (
                  <button suppressHydrationWarning key={i} onClick={() => sendMessage(s)}
                    className="block w-full text-left px-3 py-2 rounded-lg border border-[#002D72]/20 bg-[#002D72]/5 hover:bg-[#002D72]/10 text-xs text-[#002D72] dark:text-blue-300 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-[#002D72] flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-muted rounded-xl rounded-tl-none px-3 py-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 flex gap-2 shrink-0">
            <input suppressHydrationWarning
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask about Philippine news..."
              className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#002D72] text-foreground placeholder:text-muted-foreground"
              disabled={isLoading}
            />
            <button suppressHydrationWarning
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="w-9 h-9 rounded-lg bg-[#002D72] hover:bg-[#001a50] disabled:opacity-40 flex items-center justify-center text-white transition-colors shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
