"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Plus, Edit, Trash2, Eye, Search, X, Calendar, Clock, Zap, Timer, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { categories, type Article } from "@/lib/mock-data"

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "change-me-in-env"

// ─── Date/Time Picker ─────────────────────────────────────────────────────────
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
function getDaysInMonth(m: number, y: number) { return new Date(y, m, 0).getDate() }

function DateTimePicker({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const d = value ? new Date(value) : new Date()
  const [month, setMonth]   = useState(d.getMonth() + 1)
  const [day, setDay]       = useState(d.getDate())
  const [year, setYear]     = useState(d.getFullYear())
  const [hour, setHour]     = useState(d.getHours())
  const [minute, setMinute] = useState(d.getMinutes())
  const currentYear = new Date().getFullYear()
  const daysInMonth = getDaysInMonth(month, year)
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 60 }, (_, i) => i)
  const emit = (m: number, dy: number, y: number, h: number, mi: number) =>
    onChange(new Date(y, m - 1, Math.min(dy, getDaysInMonth(m, y)), h, mi).toISOString())
  const sel = "px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#002D72] appearance-none cursor-pointer hover:border-[#002D72]/50 transition-colors"
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <select suppressHydrationWarning value={month} onChange={e => { const v=+e.target.value; setMonth(v); emit(v,day,year,hour,minute) }} className={`${sel} w-full pr-7`}>
            {MONTHS.map((m,i) => <option key={m} value={i+1}>{m}</option>)}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">▼</span>
        </div>
        <input suppressHydrationWarning type="number" min={1} max={daysInMonth} value={day}
          onChange={e => { const v=Math.min(Math.max(1,+e.target.value),daysInMonth); setDay(v); emit(month,v,year,hour,minute) }}
          className={`${sel} w-24 text-center`} />
        <input suppressHydrationWarning type="number" min={currentYear-5} max={currentYear+5} value={year}
          onChange={e => { const v=+e.target.value; setYear(v); emit(month,day,v,hour,minute) }}
          className={`${sel} w-28 text-center`} />
      </div>
      <div className="flex gap-2 items-center">
        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 relative">
          <select suppressHydrationWarning value={hour} onChange={e => { const v=+e.target.value; setHour(v); emit(month,day,year,v,minute) }} className={`${sel} w-full pr-7`}>
            {hours.map(h => <option key={h} value={h}>{h===0?"12 AM":h<12?`${h} AM`:h===12?"12 PM":`${h-12} PM`}</option>)}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">▼</span>
        </div>
        <div className="flex-1 relative">
          <select suppressHydrationWarning value={minute} onChange={e => { const v=+e.target.value; setMinute(v); emit(month,day,year,hour,v) }} className={`${sel} w-full pr-7`}>
            {minutes.map(m => <option key={m} value={m}>{String(m).padStart(2,"0")}</option>)}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">▼</span>
        </div>
        <button suppressHydrationWarning type="button"
          onClick={() => { const n=new Date(); setMonth(n.getMonth()+1); setDay(n.getDate()); setYear(n.getFullYear()); setHour(n.getHours()); setMinute(n.getMinutes()); onChange(n.toISOString()) }}
          className="text-[11px] text-[#002D72] hover:text-[#CE1126] font-medium whitespace-nowrap transition-colors">Now</button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        {new Date(year, month-1, Math.min(day,getDaysInMonth(month,year)), hour, minute).toLocaleString("en-PH", { dateStyle:"long", timeStyle:"short" })}
      </p>
    </div>
  )
}

// ─── Articles Tab ─────────────────────────────────────────────────────────────
export function ArticlesTab() {
  const [articles, setArticles]       = useState<Article[]>([])
  const [fetchStatus, setFetchStatus] = useState<"loading"|"done"|"error">("loading")
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)

  const loadArticles = async () => {
    setFetchStatus("loading")
    try {
      const res = await fetch("/api/articles?limit=100", {
        headers: { "x-admin-secret": ADMIN_SECRET }
      })
      const data = await res.json()
      // merge with scheduled (future) articles too
      const res2 = await fetch("/api/articles/all", {
        headers: { "x-admin-secret": ADMIN_SECRET }
      })
      const data2 = res2.ok ? await res2.json() : { articles: [] }
      setArticles(data2.articles ?? data.articles ?? [])
      setFetchStatus("done")
    } catch {
      setFetchStatus("error")
    }
  }

  useEffect(() => { loadArticles() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return
    await fetch("/api/articles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET },
      body: JSON.stringify({ id }),
    })
    setArticles(articles.filter(a => a.id !== id))
  }

  const filteredArticles = articles.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const scheduledCount = articles.filter(a => new Date(a.published_at) > new Date()).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-serif font-bold">Articles</h1>
          {scheduledCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
              <Timer className="h-3 w-3" />{scheduledCount} scheduled
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button onClick={loadArticles} variant="outline" size="icon" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${fetchStatus === "loading" ? "animate-spin" : ""}`} />
          </Button>
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input suppressHydrationWarning type="text" placeholder="Search articles..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#002D72]" />
          </div>
          <Button onClick={() => setShowAddForm(true)} className="bg-[#CE1126] hover:bg-[#CE1126]/90 text-white shrink-0">
            <Plus className="h-4 w-4 mr-2" />Add Article
          </Button>
        </div>
      </div>

      {(showAddForm || editingArticle) && (
        <ArticleForm
          article={editingArticle}
          onClose={() => { setShowAddForm(false); setEditingArticle(null) }}
          onSave={async (article, mode) => {
            const status = mode === "schedule" ? "scheduled" : "published"
            const method = editingArticle ? "PATCH" : "POST"
            const res = await fetch("/api/articles", {
              method,
              headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET },
              body: JSON.stringify({ ...article, status }),
            })
            const data = await res.json()
            if (data.article) {
              if (editingArticle) {
                setArticles(articles.map(a => a.id === data.article.id ? data.article : a))
              } else {
                setArticles([data.article, ...articles])
              }
            }
            setShowAddForm(false)
            setEditingArticle(null)
          }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Articles ({filteredArticles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {fetchStatus === "loading" && (
            <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading articles…
            </div>
          )}
          {fetchStatus === "error" && (
            <div className="flex items-center justify-center py-10 text-destructive gap-2">
              <AlertCircle className="h-5 w-5" /> Failed to load.
              <button onClick={loadArticles} className="underline text-sm ml-1">Retry</button>
            </div>
          )}
          {fetchStatus === "done" && (
            <div className="space-y-3">
              {filteredArticles.length === 0 && (
                <p className="text-center py-10 text-muted-foreground">No articles yet. Click "Add Article" to publish your first story.</p>
              )}
              {filteredArticles.map(article => {
                const isScheduled = new Date(article.published_at) > new Date()
                return (
                  <div key={article.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="relative w-20 h-14 shrink-0 rounded overflow-hidden bg-muted">
                      {article.image_url && <Image src={article.image_url} alt={article.title} fill className="object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-sm truncate">{article.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap mt-1">
                        <span className="px-2 py-0.5 bg-[#002D72]/10 text-[#002D72] rounded font-medium">{article.category}</span>
                        <span>{article.author}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(article.published_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                        {isScheduled && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded font-bold">SCHEDULED</span>}
                        {article.is_breaking && !isScheduled && <span className="px-2 py-0.5 bg-[#CE1126]/10 text-[#CE1126] rounded font-bold">BREAKING</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!isScheduled && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" asChild>
                          <a href={`/article/${article.id}`} target="_blank"><Eye className="h-4 w-4" /></a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => setEditingArticle(article)} className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(article.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Article Form ─────────────────────────────────────────────────────────────
function ArticleForm({ article, onClose, onSave }: {
  article: Article | null
  onClose: () => void
  onSave: (article: Article, mode: "now" | "schedule") => Promise<void>
}) {
  const [publishMode, setPublishMode] = useState<"now"|"schedule">("now")
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: article?.title || "", excerpt: article?.excerpt || "", content: article?.content || "",
    category: article?.category || "Nation", author: article?.author || "",
    image_url: article?.image_url || "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80",
    is_breaking: article?.is_breaking || false, language: (article?.language || "EN") as "EN"|"FIL",
    tags: article?.tags?.join(", ") || "", published_at: article?.published_at || new Date().toISOString(),
  })

  const scheduledDate = new Date(formData.published_at)
  const isFuture = scheduledDate > new Date()
  const calcReadingTime = (c: string) => Math.max(1, Math.ceil(c.split(/\s+/).length / 200))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (publishMode === "schedule" && !isFuture) {
      alert("Scheduled date must be in the future. Use 'Publish Now' to backdate.")
      return
    }
    setSaving(true)
    const newArticle: Article = {
      id: article?.id || String(Date.now()),
      title: formData.title, excerpt: formData.excerpt, content: formData.content,
      category: formData.category, author: formData.author, image_url: formData.image_url,
      published_at: formData.published_at, is_breaking: formData.is_breaking,
      language: formData.language, view_count: article?.view_count || 0,
      reading_time: calcReadingTime(formData.content),
      tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
    }
    await onSave(newArticle, publishMode)
    setSaving(false)
  }

  const inp = "w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#002D72] text-sm"
  const lbl = "text-sm font-medium text-foreground"

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-card z-10 border-b pb-3">
          <CardTitle className="font-serif text-xl">{article ? "Edit Article" : "Add New Article"}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className={lbl}>Title *</label>
              <input suppressHydrationWarning type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className={lbl}>Excerpt *</label>
              <textarea suppressHydrationWarning value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} rows={2} required className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className={lbl}>Content *</label>
              <textarea suppressHydrationWarning value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} rows={6} required className={inp} />
              <p className="text-xs text-muted-foreground">Reading time: ~{calcReadingTime(formData.content)} min</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={lbl}>Category *</label>
                <select suppressHydrationWarning value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={inp}>
                  {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={lbl}>Language</label>
                <select suppressHydrationWarning value={formData.language} onChange={e => setFormData({...formData, language: e.target.value as "EN"|"FIL"})} className={inp}>
                  <option value="EN">English</option>
                  <option value="FIL">Filipino</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={lbl}>Author *</label>
              <input suppressHydrationWarning type="text" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} required className={inp} />
            </div>

            {/* Publishing Mode */}
            <div className="space-y-3">
              <label className={lbl}>Publishing Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setPublishMode("now")}
                  className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 text-left transition-all ${publishMode==="now" ? "border-[#002D72] bg-[#002D72]/5" : "border-input bg-background hover:border-[#002D72]/40"}`}>
                  <div className="flex items-center gap-2">
                    <Zap className={`h-4 w-4 ${publishMode==="now" ? "text-[#002D72]" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-semibold ${publishMode==="now" ? "text-[#002D72]" : "text-foreground"}`}>Publish Now</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">Goes live immediately. You can backdate the date for old news.</p>
                </button>
                <button type="button" onClick={() => setPublishMode("schedule")}
                  className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 text-left transition-all ${publishMode==="schedule" ? "border-amber-500 bg-amber-50" : "border-input bg-background hover:border-amber-400/40"}`}>
                  <div className="flex items-center gap-2">
                    <Timer className={`h-4 w-4 ${publishMode==="schedule" ? "text-amber-600" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-semibold ${publishMode==="schedule" ? "text-amber-700" : "text-foreground"}`}>Schedule</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">Set a future date. Article goes live automatically.</p>
                </button>
              </div>
              <div className={`rounded-lg p-4 border ${publishMode==="schedule" ? "bg-amber-50 border-amber-200" : "bg-[#002D72]/5 border-[#002D72]/20"}`}>
                <label className={`text-sm font-medium flex items-center gap-2 mb-3 ${publishMode==="schedule" ? "text-amber-700" : "text-[#002D72]"}`}>
                  <Calendar className="h-4 w-4" />
                  {publishMode==="now" ? "Article Date & Time (can be backdated)" : "Schedule For"}
                </label>
                <DateTimePicker value={formData.published_at} onChange={iso => setFormData({...formData, published_at: iso})} />
                {publishMode==="schedule" && !isFuture && (
                  <p className="mt-2 text-xs text-red-500 font-medium">⚠ Date must be in the future for scheduling. Use "Publish Now" to backdate.</p>
                )}
                {publishMode==="now" && new Date(formData.published_at) < new Date() && (
                  <p className="mt-2 text-xs text-[#002D72]/70">✓ Backdated — article will appear with this date but publish immediately.</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={lbl}>Image URL</label>
              <input suppressHydrationWarning type="url" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className={lbl}>Tags (comma separated)</label>
              <input suppressHydrationWarning type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="nation, breaking, politics" className={inp} />
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#CE1126]/5 border border-[#CE1126]/20 rounded-lg">
              <input suppressHydrationWarning type="checkbox" id="is_breaking" checked={formData.is_breaking}
                onChange={e => setFormData({...formData, is_breaking: e.target.checked})} className="h-4 w-4 accent-[#CE1126]" />
              <label htmlFor="is_breaking" className="text-sm font-medium text-[#CE1126] cursor-pointer">Mark as Breaking News</label>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={saving || (publishMode==="schedule" && !isFuture)}
                className={publishMode==="schedule" ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-[#002D72] hover:bg-[#001a50] text-white"}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> :
                  article ? "Update Article" : publishMode==="now" ? "⚡ Publish Now" : "⏱ Schedule Article"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
