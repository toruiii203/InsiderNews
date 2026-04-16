"use client"

import Image from "next/image"
import Link from "next/link"
import { TrendingUp, Eye, Camera } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WeatherWidget } from "@/components/weather-widget"
import { ArticleCard } from "@/components/article-card"
import { mockArticles, getRelativeTime } from "@/lib/mock-data"

export function NewsSidebar() {
  const trendingArticles = mockArticles.slice(0, 7)
  const mostReadArticles = [...mockArticles]
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 5)
  const photoOfTheDay = mockArticles[5]

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
          {trendingArticles.map((article, index) => (
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
          ))}
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
        <CardContent className="space-y-3">
          {mostReadArticles.map((article) => (
            <ArticleCard key={article.id} article={article} variant="compact" />
          ))}
        </CardContent>
      </Card>

      {/* Photo of the Day */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-serif">
            <Camera className="h-5 w-5 text-[#CE1126]" />
            Photo of the Day
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Link href={`/article/${photoOfTheDay.id}`}>
            <div className="relative h-48 group">
              <Image
                src={photoOfTheDay.image_url}
                alt={photoOfTheDay.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white text-sm font-medium line-clamp-2">
                  {photoOfTheDay.title}
                </p>
                <p className="text-white/70 text-xs mt-1">
                  Photo by {photoOfTheDay.author}
                </p>
              </div>
            </div>
          </Link>
        </CardContent>
      </Card>
    </aside>
  )
}
