"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { mockArticles, categories, getRelativeTime, getCategoryColor, type Article } from "@/lib/mock-data"
import { useLanguage, getCategoryName } from "@/lib/language-context"

const ARTICLES_PER_PAGE = 8

export function LatestNewsFeed() {
  const { t, language } = useLanguage()
  const [activeCategory, setActiveCategory] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [articles, setArticles] = useState<Article[]>(mockArticles)

  useEffect(() => {
    fetch("/api/articles?limit=100")
      .then(r => r.json())
      .then(d => { if (d.articles?.length) setArticles(d.articles) })
      .catch(() => {})
  }, [])

  const filteredArticles = activeCategory === "All"
    ? articles
    : articles.filter(a => a.category === activeCategory)

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
      <div className="space-y-4">
        {paginatedArticles.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No articles yet.</p>
        ) : paginatedArticles.map(article => (
          <Card key={article.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <Link href={`/article/${article.id}`} className="flex gap-4 p-4 group">
                <div className="relative w-24 h-20 shrink-0 rounded-lg overflow-hidden">
                  <Image src={article.image_url} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${getCategoryColor(article.category)}`}>{article.category}</span>
                    {article.is_breaking && <span className="px-2 py-0.5 bg-[#CE1126] text-white text-xs font-bold rounded">BREAKING</span>}
                  </div>
                  <h3 className="font-medium text-sm text-foreground group-hover:text-[#002D72] transition-colors line-clamp-2 mb-1">{article.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{article.reading_time} min</span>
                    <span>{getRelativeTime(article.published_at)}</span>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1,p-1))} disabled={currentPage===1}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages,p+1))} disabled={currentPage===totalPages}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}
    </section>
  )
}
