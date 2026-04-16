"use client"

import { useState, useEffect } from "react"
import {
  Users, Mail, Calendar, Download, Trash2,
  Send, Loader2, CheckCircle, AlertCircle, ChevronDown, RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { mockArticles } from "@/lib/mock-data"

interface Subscriber {
  email: string
  subscribedAt: string
  confirmed: boolean
}

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "change-me-in-env"

type NotifyStatus = "idle" | "loading" | "success" | "error"
type FetchStatus = "loading" | "done" | "error"

export function SubscribersTab() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>("loading")

  const [selectedArticleId, setSelectedArticleId] = useState<string>(mockArticles[0]?.id ?? "")
  const [notifyStatus, setNotifyStatus] = useState<NotifyStatus>("idle")
  const [notifyMessage, setNotifyMessage] = useState("")

  // ── Fetch real subscribers from the API ─────────────────────────────────────
  const loadSubscribers = async () => {
    setFetchStatus("loading")
    try {
      const res = await fetch("/api/subscribe", {
        headers: { "x-admin-secret": ADMIN_SECRET },
      })
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      setSubscribers(data.subscribers ?? [])
      setFetchStatus("done")
    } catch {
      setFetchStatus("error")
    }
  }

  useEffect(() => { loadSubscribers() }, [])

  // ── Notify ──────────────────────────────────────────────────────────────────
  const handleNotify = async () => {
    const article = mockArticles.find((a) => a.id === selectedArticleId)
    if (!article) return
    setNotifyStatus("loading")
    setNotifyMessage("")
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": ADMIN_SECRET,
        },
        body: JSON.stringify({ article }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setNotifyStatus("success")
        setNotifyMessage(data.message)
      } else {
        setNotifyStatus("error")
        setNotifyMessage(data.error ?? "Something went wrong.")
      }
    } catch {
      setNotifyStatus("error")
      setNotifyMessage("Network error. Please try again.")
    }
    setTimeout(() => { setNotifyStatus("idle"); setNotifyMessage("") }, 6000)
  }

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const csv = [
      ["Email", "Subscribed Date"],
      ...subscribers.map((s) => [s.email, new Date(s.subscribedAt).toLocaleDateString()]),
    ].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "subscribers.csv"; a.click()
  }

  // ── Delete (removes from local state only — no DB yet) ──────────────────────
  const handleDelete = (email: string) => {
    if (confirm("Are you sure you want to remove this subscriber?")) {
      fetch("/api/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET }, body: JSON.stringify({ email }) }).then(() => setSubscribers(subscribers.filter((s) => s.email !== email)))
    }
  }

  // ── Derived stats ───────────────────────────────────────────────────────────
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
  const thisWeek = subscribers.filter((s) => new Date(s.subscribedAt) >= oneWeekAgo).length
  const thisMonth = subscribers.filter((s) => new Date(s.subscribedAt) >= oneMonthAgo).length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold">Subscribers</h1>
        <div className="flex gap-2">
          <Button onClick={loadSubscribers} variant="outline" size="icon" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${fetchStatus === "loading" ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={handleExport} variant="outline" className="gap-2" disabled={subscribers.length === 0}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-[#002D72]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fetchStatus === "loading" ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : subscribers.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-[#CE1126]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{thisWeek}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            <Mail className="h-4 w-4 text-[#FCD116]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{thisMonth}</div>
          </CardContent>
        </Card>
      </div>

      {/* Notify Subscribers panel */}
      <Card className="border-[#002D72]/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5 text-[#002D72]" />
            Notify Subscribers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose an article and send an email notification to all {subscribers.length} subscribers.
          </p>

          <div className="relative">
            <select
              value={selectedArticleId}
              onChange={(e) => setSelectedArticleId(e.target.value)}
              disabled={notifyStatus === "loading"}
              className="w-full appearance-none rounded-lg border border-input bg-background px-4 py-3 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#002D72] disabled:opacity-50 cursor-pointer"
            >
              {mockArticles.map((a) => (
                <option key={a.id} value={a.id}>[{a.category}] {a.title}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>

          {selectedArticleId && (() => {
            const a = mockArticles.find((x) => x.id === selectedArticleId)
            if (!a) return null
            return (
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <p className="font-medium text-foreground line-clamp-1">{a.title}</p>
                <p className="text-muted-foreground line-clamp-2">{a.excerpt}</p>
              </div>
            )
          })()}

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Button
              onClick={handleNotify}
              disabled={notifyStatus === "loading" || notifyStatus === "success" || !selectedArticleId || subscribers.length === 0}
              className="bg-[#002D72] hover:bg-[#002D72]/90 text-white gap-2"
            >
              {notifyStatus === "loading" ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Sending…</>
              ) : notifyStatus === "success" ? (
                <><CheckCircle className="h-4 w-4" />Sent!</>
              ) : (
                <><Send className="h-4 w-4" />Send to {subscribers.length} Subscribers</>
              )}
            </Button>
            {notifyStatus === "success" && notifyMessage && (
              <p className="flex items-center gap-1.5 text-sm text-emerald-600">
                <CheckCircle className="h-4 w-4 shrink-0" />{notifyMessage}
              </p>
            )}
            {notifyStatus === "error" && notifyMessage && (
              <p className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />{notifyMessage}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscribers list */}
      <Card>
        <CardHeader><CardTitle className="text-lg">All Subscribers</CardTitle></CardHeader>
        <CardContent>
          {fetchStatus === "loading" && (
            <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading subscribers…
            </div>
          )}
          {fetchStatus === "error" && (
            <div className="flex items-center justify-center py-10 text-destructive gap-2">
              <AlertCircle className="h-5 w-5" /> Failed to load subscribers.
              <button onClick={loadSubscribers} className="underline text-sm ml-1">Retry</button>
            </div>
          )}
          {fetchStatus === "done" && subscribers.length === 0 && (
            <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
              <Mail className="h-5 w-5" /> No subscribers yet.
            </div>
          )}
          {fetchStatus === "done" && subscribers.length > 0 && (
            <div className="space-y-3">
              {subscribers.map((subscriber) => (
                <div key={subscriber.email} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#002D72]/10 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-[#002D72]" />
                    </div>
                    <div>
                      <p className="font-medium">{subscriber.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Subscribed on {new Date(subscriber.subscribedAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(subscriber.email)} className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
