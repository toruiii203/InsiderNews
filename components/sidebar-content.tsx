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

type ArticleWithViews = Article & { realViews: number }

const POLL_INTERVAL_MS = 60_000

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

  useEffect(() => {
    async function load() {
      try {
        const [articlesRes, viewsRes] = await Promise.all([
          fetch("/api/articles?limit=20&status=published"),
          fetch("/api/article-views-summary"),
        ])

        if (!articlesRes.ok) throw new Error("articles fetch failed")
        const articlesData = await articlesRes.json()
        const articles: Article[] = Array.isArray(articlesData) ? articlesData : articlesData.articles ?? []

        // If the views endpoint fails, don't block the whole sidebar —
        // just treat every article as having 0 tracked views rather than showing nothing.
        let last24h: Record<string, number> = {}
        let last7d: Record<string, number> = {}
        if (viewsRes.ok) {
          const viewsData = await viewsRes.json()
          last24h = viewsData.last24h ?? {}
          last7d = viewsData.last7d ?? {}
        }

        if (articles.length === 0) return

        // Trending: real 24h view count first, newest published as tiebreaker
        // so brand-new articles with 0 tracked views yet still show up sensibly.
        const trending = [...articles]
          .map(a => ({ ...a, realViews: last24h[a.id] || 0 }))
          .sort((a, b) => {
            if (b.realViews !== a.realViews) return b.realViews - a.realViews
            return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
          })
          .slice(0, 6)

        // Most read: real 7-day view count, same tiebreaker
        const mostRead = [...articles]
          .map(a => ({ ...a, realViews: last7d[a.id] || 0 }))
          .sort((a, b) => {
            if (b.realViews !== a.realViews) return b.realViews - a.realViews
            return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
          })
          .slice(0, 5)

        const tagSet = new Set<string>()
        articles.forEach(a => {
          if (a.category) tagSet.add(`#${a.category}`)
          a.tags?.slice(0, 2).forEach(tag => tagSet.add(`#${tag}`))
        })

        setTrendingArticles(trending)
        setMostReadArticles(mostRead)
        setHotTopics(Array.from(tagSet).slice(0, 10))
      } catch (err) {
        console.warn("Sidebar fetch failed:", err)
      } finally {
        setLoading(false)
      }
    }

    load()
    const iv = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(iv)
  }, [])

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
      {/* Trending Now — real 24h view counts */}
      <Card className="border-t-4 border-t-[#CE1126]">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="flex items-center justify-between text-base font-serif">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#CE1126]" />
              {t.trendingNow}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-sans font-normal text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              last 24h
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
                      {article.realViews.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Most Read — real 7-day view counts */}
      <Card className="border-t-4 border-t-[#002D72]">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="flex items-center justify-between text-base font-serif">
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#002D72]" />
              {t.mostRead}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-sans font-normal text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              last 7d
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
                    <span className="tabular-nums">{article.realViews.toLocaleString()}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      {/* Hot Topics — derived from real article categories & tags (unchanged, already real) */}
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
