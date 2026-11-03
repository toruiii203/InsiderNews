"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { TrendingUp, Eye, Camera } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WeatherWidget } from "@/components/weather-widget"
import { getRelativeTime, type Article } from "@/lib/mock-data"
import { toCdnUrl } from "@/lib/cdn"

export function NewsSidebar() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/articles?limit=15")
      .then(r => r.json())
      .then(d => {
        setArticles(d.articles ?? [])
      })
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }, [])

  const trendingArticles = articles.slice(0, 5)
  const mostReadArticles = [...articles]
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 5)
  const photoOfTheDay = articles.find(a => a.image_url)

  return (
    <aside className="space-y-6">
      {/* Weather Widget */}
      <WeatherWidget />

      {/* Trending Now */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-serif">
            <TrendingUp className="h-5 w-5 text-[#CE1126]" />
            Trending Now
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {trendingArticles.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No trending stories yet.</p>
          ) : (
            trendingArticles.map((article, index) => (
              <div key={article.id} className="flex gap-3 group">
                <span className="text-2xl font-serif font-bold text-[#002D72]/20 group-hover:text-[#002D72] transition-colors">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <Link href={`/article/${article.id}`}>
                    <h4 className="font-medium text-sm line-clamp-2 group-hover:text-[#CE1126] transition-colors">
                      {article.title}
                    </h4>
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {getRelativeTime(article.published_at)}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Most Read */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-serif">
            <Eye className="h-5 w-5 text-[#CE1126]" />
            Most Read
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mostReadArticles.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No read metrics recorded yet.</p>
          ) : (
            mostReadArticles.map((article) => (
              <div key={article.id} className="flex gap-3 group">
                {article.image_url && (
                  <div className="relative w-16 h-16 shrink-0 rounded overflow-hidden">
                    <Image
                      src={toCdnUrl(article.image_url)}
                      alt={article.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <Link href={`/article/${article.id}`}>
                    <h4 className="font-medium text-sm line-clamp-2 group-hover:text-[#CE1126] transition-colors">
                      {article.title}
                    </h4>
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {article.view_count || 0} views
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Photo of the Day */}
      {photoOfTheDay && photoOfTheDay.image_url && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-serif">
              <Camera className="h-5 w-5 text-[#CE1126]" />
              Photo of the Day
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative aspect-[4/3]">
              <Image
                src={toCdnUrl(photoOfTheDay.image_url)}
                alt={photoOfTheDay.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <p className="text-sm font-medium line-clamp-2">
                {photoOfTheDay.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Photo: {photoOfTheDay.author}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </aside>
  )
}
