"use client"

import Image from "next/image"
import Link from "next/link"
import { TrendingUp, Eye, Flame } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { mockArticles, getRelativeTime } from "@/lib/mock-data"
import { useLanguage } from "@/lib/language-context"

export function SidebarContent() {
  const { t } = useLanguage()
  const trendingArticles = mockArticles.slice(0, 6)
  const mostReadArticles = [...mockArticles]
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 5)

  return (
    <aside className="space-y-5">
      {/* Trending Now */}
      <Card className="border-t-4 border-t-[#CE1126]">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="flex items-center gap-2 text-base font-serif">
            <TrendingUp className="h-4 w-4 text-[#CE1126]" />
            {t.trendingNow}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {trendingArticles.map((article, index) => (
            <div key={article.id} className="flex gap-3 group">
              <span className="text-xl font-serif font-bold text-[#002D72]/20 group-hover:text-[#002D72] transition-colors min-w-[28px]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`/article/${article.id}`}>
                  <h4 className="font-medium text-sm line-clamp-2 group-hover:text-[#CE1126] transition-colors leading-tight">
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
      <Card className="border-t-4 border-t-[#002D72]">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="flex items-center gap-2 text-base font-serif">
            <Eye className="h-4 w-4 text-[#002D72]" />
            {t.mostRead}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {mostReadArticles.map((article) => (
            <Link 
              key={article.id} 
              href={`/article/${article.id}`}
              className="flex gap-3 group"
            >
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
                  <span>{article.view_count.toLocaleString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Hot Topics */}
      <Card className="border-t-4 border-t-[#FCD116]">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="flex items-center gap-2 text-base font-serif">
            <Flame className="h-4 w-4 text-orange-500" />
            {t.hotTopics}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {["#Election2026", "#PBBM", "#Economy", "#Sports", "#Manila", "#Weather", "#Traffic", "#COVID19"].map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${tag.replace('#', '')}`}
                className="px-2 py-1 bg-muted text-xs rounded-full hover:bg-[#002D72] hover:text-white transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}
