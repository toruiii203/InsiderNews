"use client"

import { useState } from "react"
import { Send, CheckCircle, Loader2, AlertCircle, Mail, Bell, Newspaper } from "lucide-react"
import { Button } from "@/components/ui/button"

type Status = "idle" | "loading" | "success" | "error" | "duplicate"

const STORAGE_KEY = "tinph_subscribed_email"

export function NewsletterSection() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || status === "loading") return

    // Check localStorage first to avoid duplicate calls
    const alreadySubscribed = typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEY)
      : null

    if (alreadySubscribed) {
      setStatus("duplicate")
      setMessage(`${alreadySubscribed} is already subscribed.`)
      return
    }

    setStatus("loading")
    setMessage("")

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem(STORAGE_KEY, email)
        setStatus("success")
        setMessage("You're in! Check your inbox for a confirmation email.")
        setEmail("")
      } else if (res.status === 409) {
        setStatus("duplicate")
        setMessage("This email is already subscribed.")
      } else {
        setStatus("error")
        setMessage(data.error || "Something went wrong. Please try again.")
      }
    } catch {
      setStatus("error")
      setMessage("Network error. Please check your connection and try again.")
    }
  }

  const reset = () => { setStatus("idle"); setMessage("") }

  return (
    <section className="bg-gradient-to-r from-[#002D72] to-[#001a50] py-14">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">

          {/* Icon + heading */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Newspaper className="h-5 w-5 text-[#FCD116]" />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-3">
            Stay Updated
          </h2>
          <p className="text-blue-100 mb-4 text-sm leading-relaxed">
            Get the latest Philippine news delivered straight to your inbox.<br className="hidden sm:block"/>
            No spam — just the stories that matter.
          </p>

          {/* Perks row */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-7 text-xs text-blue-200">
            <span className="flex items-center gap-1.5"><Bell className="h-3.5 w-3.5 text-[#FCD116]"/>Breaking news alerts</span>
            <span className="flex items-center gap-1.5"><Newspaper className="h-3.5 w-3.5 text-[#FCD116]"/>Daily digest</span>
            <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-[#FCD116]"/>Unsubscribe anytime</span>
          </div>

          {/* Form */}
          {status !== "success" ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                suppressHydrationWarning
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (status !== "idle") reset() }}
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-blue-300 focus:outline-none focus:ring-2 focus:ring-[#FCD116] text-sm"
                required
                disabled={status === "loading"}
              />
              <Button
                suppressHydrationWarning
                type="submit"
                disabled={status === "loading"}
                className="bg-[#CE1126] hover:bg-[#CE1126]/90 text-white px-6 shrink-0"
              >
                {status === "loading"
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Subscribing...</>
                  : <><Send className="h-4 w-4 mr-2"/>Subscribe</>}
              </Button>
            </form>
          ) : (
            <div className="flex items-center justify-center gap-3 bg-white/10 border border-[#FCD116]/30 rounded-xl px-6 py-4 max-w-md mx-auto">
              <CheckCircle className="h-6 w-6 text-[#FCD116] shrink-0" />
              <div className="text-left">
                <p className="text-white font-semibold text-sm">You're subscribed!</p>
                <p className="text-blue-200 text-xs mt-0.5">{message}</p>
              </div>
            </div>
          )}

          {/* Error / duplicate messages */}
          {(status === "error" || status === "duplicate") && message && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <AlertCircle className="h-4 w-4 text-red-300 shrink-0" />
              <p className="text-red-300 text-sm">{message}</p>
            </div>
          )}

          <p className="text-blue-300/50 text-xs mt-5">
            By subscribing you agree to our{" "}
            <a href="/privacy" className="underline hover:text-blue-200 transition-colors">Privacy Policy</a>.
            We never share your data.
          </p>
        </div>
      </div>
    </section>
  )
}
