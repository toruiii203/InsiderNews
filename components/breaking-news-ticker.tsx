"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { mockArticles, type Article } from "@/lib/mock-data"
import { useLanguage } from "@/lib/language-context"

export function BreakingNewsTicker() {
  const [breakingNews, setBreakingNews] = useState<Article[]>([])
  const { language } = useLanguage()

  useEffect(() => {
    // Start with mock breaking news, then try real data
    const mockBreaking = mockArticles.filter(a => a.is_breaking).slice(0, 5)
    setBreakingNews(mockBreaking)

    fetch("/api/articles?limit=20")
      .then(r => r.json())
      .then(d => {
        const breaking = (d.articles ?? []).filter((a: Article) => a.is_breaking).slice(0, 5)
        if (breaking.length > 0) setBreakingNews(breaking)
      })
      .catch(() => {})
  }, [])

  if (breakingNews.length === 0) return null
  const items = [...breakingNews, ...breakingNews]

  return (
    <div className="bg-[#CE1126] text-white py-2 overflow-hidden">
      <div className="container mx-auto px-4 flex items-center gap-4">
        <div className="flex items-center gap-2 shrink-0 bg-white/20 px-3 py-1 rounded">
          <AlertCircle className="h-4 w-4 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wide">{language === "FIL" ? "Balita" : "Breaking"}</span>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="flex animate-marquee whitespace-nowrap gap-8">
            {items.map((article, i) => (
              <Link key={`${article.id}-${i}`} href={`/article/${article.id}`}
                className="text-sm font-medium hover:text-yellow-300 transition-colors shrink-0">
                {article.title}
                <span className="mx-4 text-white/50">•</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
