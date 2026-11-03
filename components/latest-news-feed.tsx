"use client"

let cachedArticles: any[] | null = null

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { categories, getRelativeTime, getCategoryColor, type Article } from "@/lib/mock-data"
import { toCdnUrl } from "@/lib/cdn"
import { useLanguage, getCategoryName } from "@/lib/language-context"

const ARTICLES_PER_PAGE = 8

export function LatestNewsFeed() {
  const { t, language } = useLanguage()
  const [activeCategory, setActiveCategory] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [articles, setArticles] = useState<Article[]>(() => cachedArticles || [])
  const [loading, setLoading] = useState(() => !cachedArticles)

  useEffect(() => {
    fetch("/api/articles?limit=100")
      .then(r => r.json())
      .then(d => {
        const list = d.articles ?? []; cachedArticles = list; setArticles(list)
      })
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }, [])

  const filteredArticles = activeCategory === "All"
    ? articles
    : articles.filter(a => a.category?.toLowerCase() === activeCategory.toLowerCase())

  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE)
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE
  const paginatedArticles = filteredArticles.slice(startIndex, startIndex + ARTICLES_PER_PAGE)

  const handleCategoryChange = (category: string) => { setActiveCategory(category); setCurrentPage(1) }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-serif font-bold text-foreground">{t.latestNews}</h2>
      </div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        <button onClick={() => handleCategoryChange("All")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeCategory==="All" ? "bg-[#002D72] text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
          All
        </button>
        {categories.map(cat => (
          <button key={cat.name} onClick={() => handleCategoryChange(cat.name)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeCategory===cat.name ? "bg-[#002D72] text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {getCategoryName(cat.name, language)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading latest news...</div>
      ) : paginatedArticles.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-border bg-card/50">
          <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold text-foreground">No published stories in this section</p>
          <p className="text-xs text-muted-foreground mt-1">Check back soon for the latest reports and breaking news.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {paginatedArticles.map(article => (
              <div key={article.id} className="p-4 flex gap-4 hover:bg-muted/50 transition-colors">
                {article.image_url && (
                  <div className="relative w-24 h-24 md:w-32 md:h-24 shrink-0 rounded-lg overflow-hidden bg-muted">
                    <Image src={toCdnUrl(article.image_url)} alt={article.title} fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${getCategoryColor(article.category)}`}>
                      {article.category}
                    </span>
                    {article.is_breaking && <span className="px-2 py-0.5 bg-[#CE1126] text-white text-xs font-bold rounded">BREAKING</span>}
                    <span className="text-muted-foreground text-xs">{getRelativeTime(article.published_at)}</span>
                  </div>
                  <Link href={`/article/${article.id}`}>
                    <h3 className="font-serif font-bold text-sm md:text-base leading-snug hover:text-[#002D72] dark:hover:text-[#FCD116] transition-colors line-clamp-2 mb-1">
                      {article.title}
                    </h3>
                  </Link>
                  <p className="text-muted-foreground text-xs line-clamp-2 hidden sm:block">{article.excerpt}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <span className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span>
          <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </section>
  )
}
