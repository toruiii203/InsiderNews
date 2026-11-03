"use client"

let cachedHeroArticles: any[] | null = null

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRelativeTime, getCategoryColor, type Article } from "@/lib/mock-data"
import { toCdnUrl } from "@/lib/cdn"

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [articles, setArticles] = useState<Article[]>(() => cachedHeroArticles || [])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    fetch("/api/articles?limit=5")
      .then(r => r.json())
      .then(d => {
        if (d.articles?.length) {
          const list = d.articles.slice(0, 5); cachedHeroArticles = list; setArticles(list)
        } else {
          setArticles([])
        }
      })
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }, [])

  const heroArticles = articles.slice(0, 5)

  const nextSlide = useCallback(() => {
    if (heroArticles.length === 0) return
    setCurrentSlide(p => (p + 1) % heroArticles.length)
  }, [heroArticles.length])

  const prevSlide = useCallback(() => {
    if (heroArticles.length === 0) return
    setCurrentSlide(p => (p - 1 + heroArticles.length) % heroArticles.length)
  }, [heroArticles.length])

  useEffect(() => {
    if (heroArticles.length <= 1) return
    const interval = setInterval(nextSlide, 5000)
    return () => clearInterval(interval)
  }, [nextSlide, heroArticles.length])

  if (!mounted) return null

  if (heroArticles.length === 0) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-[#002D72]/15 via-background to-muted border border-border aspect-[16/9] md:aspect-[2/1] flex flex-col items-center justify-center p-8 text-center shadow-sm">
        <span className="px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest bg-[#002D72] text-white mb-3">
          The Insider News Philippines
        </span>
        <h2 className="text-xl md:text-3xl font-serif font-bold text-foreground max-w-lg mb-2">
          Truth. Depth. Impact.
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground max-w-md">
          Independent, verified news coverage for Filipinos at home and abroad.
        </p>
      </div>
    )
  }

  const article = heroArticles[currentSlide]

  return (
    <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-[16/9] md:aspect-[2/1]">
      <div className="absolute inset-0">
        {article.image_url ? (
          <Image src={toCdnUrl(article.image_url)} alt={article.title} fill className="object-cover opacity-70" priority />
        ) : (
          <div className="w-full h-full bg-[#002D72]/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${getCategoryColor(article.category)}`}>{article.category}</span>
          {article.is_breaking && <span className="px-2 py-0.5 bg-[#CE1126] text-white text-xs font-bold rounded animate-pulse">BREAKING</span>}
        </div>
        <Link href={`/article/${article.id}`}>
          <h2 className="text-white font-serif font-bold text-lg md:text-2xl leading-tight hover:text-[#FCD116] transition-colors line-clamp-2 mb-2">{article.title}</h2>
        </Link>
        <p className="text-gray-300 text-sm hidden md:block line-clamp-2 mb-3">{article.excerpt}</p>
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs">{article.author} · {getRelativeTime(article.published_at)}</span>
          {heroArticles.length > 1 && (
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" onClick={prevSlide} className="h-8 w-8 text-white hover:bg-white/20"><ChevronLeft className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={nextSlide} className="h-8 w-8 text-white hover:bg-white/20"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
