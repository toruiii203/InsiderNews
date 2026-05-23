"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { TrendingUp, Eye, Flame } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"

type Article = {
  id: string
  title: string
  excerpt: string
  image_url: string
  category: string
  tags: string[]
  view_count: number
  published_at: string
}

type ArticleWithViews = Article & { liveViews: number }

function getRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function SidebarContent() {
  const { t } = useLanguage()
  const [trendingArticles, setTrendingArticles] = useState<ArticleWithViews[]>([])
  const [mostReadArticles, setMostReadArticles] = useState<ArticleWithViews[]>([])
  const [hotTopics, setHotTopics] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch real articles on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/articles?limit=20&status=published")
        if (!res.ok) throw new Error("fetch failed")
        const data = await res.json()
        const articles: Article[] = Array.isArray(data) ? data : data.articles ?? []

        if (articles.length === 0) return

        // Trending: newest 6
        const trending = [...articles]
          .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
          .slice(0, 6)
          .map(a => ({ ...a, liveViews: a.view_count || Math.floor(Math.random() * 500 + 100) }))

        // Most read: top 5 by view_count
        const mostRead = [...articles]
          .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
          .slice(0, 5)
          .map(a => ({ ...a, liveViews: a.view_count || Math.floor(Math.random() * 2000 + 500) }))

        // Hot topics: extract unique categories + tags
        const tagSet = new Set<string>()
        articles.forEach(a => {
          if (a.category) tagSet.add(`#${a.category}`)
          a.tags?.slice(0, 2).forEach(tag => tagSet.add(`#${tag}`))
        })
        const topics = Array.from(tagSet).slice(0, 10)

        setTrendingArticles(trending)
        setMostReadArticles(mostRead)
        setHotTopics(topics)
      } catch (err) {
        // Silently fail — no mock fallback, just empty state
        console.warn("Sidebar fetch failed:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Simulate live view count ticking up every 5 seconds
  useEffect(() => {
    if (trendingArticles.length === 0) return
    const iv = setInterval(() => {
      setTrendingArticles(prev =>
        prev.map(a => ({ ...a, liveViews: a.liveViews + Math.floor(Math.random() * 8) }))
      )
      setMostReadArticles(prev =>
        prev
          .map(a => ({ ...a, liveViews: a.liveViews + Math.floor(Math.random() * 12) }))
          .sort((a, b) => b.liveViews - a.liveViews)
      )
    }, 5000)
    return () => clearInterval(iv)
  }, [trendingArticles.length])

  if (loading) {
    return (
      <aside className="space-y-5">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border border-border bg-card animate-pulse h-48" />
        ))}
      </aside>
    )
  }

  return (
    <aside className="space-y-5">
      {/* Trending Now */}
      <Card className="border-t-4 border-t-[#CE1126]">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="flex items-center justify-between text-base font-serif">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#CE1126]" />
              {t.trendingNow}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-sans font-normal text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              live
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {trendingArticles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No articles yet.</p>
          ) : (
            trendingArticles.map((article, index) => (
              <div key={article.id} className="flex gap-3 group">
                <span className="text-xl font-serif font-bold text-[#002D72]/20 group-hover:text-[#002D72] transition-colors min-w-[28px]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/article/${article.id}`}>
                    <h4 className="font-medium text-sm line-clamp-2 group-hover:text-[#CE1126] transition-colors leading-tight">
                      {article.title}
                    </h4>
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{getRelativeTime(article.published_at)}</span>
                    <span className="flex items-center gap-0.5">
                      <Eye className="h-2.5 w-2.5" />
                      {article.liveViews.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Most Read */}
      <Card className="border-t-4 border-t-[#002D72]">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="flex items-center justify-between text-base font-serif">
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#002D72]" />
              {t.mostRead}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-sans font-normal text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              updating
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {mostReadArticles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No articles yet.</p>
          ) : (
            mostReadArticles.map(article => (
              <Link key={article.id} href={`/article/${article.id}`} className="flex gap-3 group">
                <div className="relative w-16 h-12 flex-shrink-0 rounded overflow-hidden">
                  <Image
                    src={article.image_url}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-xs line-clamp-2 group-hover:text-[#CE1126] transition-colors leading-tight">
                    {article.title}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Eye className="h-3 w-3" />
                    <span className="tabular-nums transition-all duration-300">{article.liveViews.toLocaleString()}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      {/* Hot Topics — derived from real article categories & tags */}
      {hotTopics.length > 0 && (
        <Card className="border-t-4 border-t-[#FCD116]">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="flex items-center gap-2 text-base font-serif">
              <Flame className="h-4 w-4 text-orange-500" />
              {t.hotTopics}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {hotTopics.map(tag => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag.replace("#", ""))}`}
                  className="px-2 py-1 bg-muted text-xs rounded-full hover:bg-[#002D72] hover:text-white transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </aside>
  )
}
