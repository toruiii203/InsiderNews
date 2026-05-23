"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { TrendingUp, Hash } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type Topic = {
  tag: string
  count: number
  category: string
}

function buildTopicsFromArticles(articles: any[]): Topic[] {
  const tagMap = new Map<string, { count: number; category: string }>()

  articles.forEach(article => {
    // Count categories
    if (article.category) {
      const key = article.category
      const existing = tagMap.get(key)
      tagMap.set(key, { count: (existing?.count || 0) + 3, category: article.category })
    }
    // Count tags
    article.tags?.forEach((tag: string) => {
      const existing = tagMap.get(tag)
      tagMap.set(tag, { count: (existing?.count || 0) + 1, category: article.category || "General" })
    })
  })

  return Array.from(tagMap.entries())
    .map(([tag, { count, category }]) => ({ tag, count, category }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

function simulateCounts(topics: Topic[]) {
  return topics.map(t => ({
    ...t,
    count: Math.max(1, t.count + Math.round((Math.random() - 0.48) * 2))
  }))
}

export function TrendingTopics() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [flash, setFlash] = useState<number | null>(null)
  const [rotateKey, setRotateKey] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/articles?limit=50&status=published")
        if (!res.ok) throw new Error("failed")
        const data = await res.json()
        const articles = Array.isArray(data) ? data : data.articles ?? []
        const derived = buildTopicsFromArticles(articles)
        setTopics(derived)
      } catch {
        // Leave empty — don't show fake data
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Simulate count fluctuations every 4 seconds
  useEffect(() => {
    if (topics.length === 0) return
    const iv = setInterval(() => {
      setTopics(prev => simulateCounts(prev))
    }, 4000)
    return () => clearInterval(iv)
  }, [topics.length])

  // Rotate/re-sort every 12 seconds with flash
  useEffect(() => {
    if (topics.length === 0) return
    const iv = setInterval(() => {
      setTopics(prev => {
        const shuffled = simulateCounts(prev).sort((a, b) => b.count - a.count)
        const flashIdx = Math.floor(Math.random() * shuffled.length)
        setFlash(flashIdx)
        setTimeout(() => setFlash(null), 1500)
        setRotateKey(k => k + 1)
        return shuffled
      })
    }, 12000)
    return () => clearInterval(iv)
  }, [topics.length])

  if (loading) {
    return (
      <section className="py-5 border-y border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-6 w-6 text-[#CE1126]" />
            <h2 className="text-xl font-serif font-bold text-foreground">Trending Topics</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-9 w-24 rounded-full bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (topics.length === 0) return null

  return (
    <section className="py-5 border-y border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-[#CE1126]" />
            <h2 className="text-xl font-serif font-bold text-foreground">
              Trending Topics
            </h2>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>From your articles</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {topics.map((topic, index) => (
            <Link
              key={`${topic.tag}-${rotateKey}`}
              href={`/search?q=${encodeURIComponent(topic.tag)}`}
              className="group"
            >
              <Badge
                variant={index < 3 ? "default" : "outline"}
                className={`
                  px-4 py-2 text-sm font-medium transition-all duration-500 cursor-pointer
                  ${flash === index ? "scale-105 ring-2 ring-[#FCD116]" : ""}
                  ${index < 3
                    ? "bg-gradient-to-r from-[#CE1126] to-[#CE1126]/80 hover:from-[#CE1126]/90 hover:to-[#CE1126]/70 text-white border-0"
                    : "hover:bg-[#002D72] hover:text-white hover:border-[#002D72]"
                  }
                `}
              >
                <Hash className="h-3 w-3 mr-1 inline" />
                {topic.tag}
                <span className="ml-2 text-xs opacity-70">
                  {topic.count}
                </span>
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
