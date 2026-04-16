"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { ArticleCard } from "@/components/article-card"
import { mockArticles, categories, getCategoryColor, type Article } from "@/lib/mock-data"

export function CategorySections() {
  const [articles, setArticles] = useState<Article[]>(mockArticles)

  useEffect(() => {
    fetch("/api/articles?limit=100")
      .then(r => r.json())
      .then(d => { if (d.articles?.length) setArticles(d.articles) })
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-8 py-6">
      {categories.slice(0, 4).map(category => {
        const categoryArticles = articles.filter(a => a.category === category.name).slice(0, 3)
        if (categoryArticles.length === 0) return null
        return (
          <section key={category.name}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className={`w-1 h-8 ${category.color} rounded`} />
                <h2 className="text-xl font-serif font-bold text-foreground">{category.name}</h2>
              </div>
              <Link href={`/category/${category.name.toLowerCase()}`}
                className="flex items-center gap-1 text-sm text-[#002D72] hover:text-[#CE1126] font-medium transition-colors">
                See All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categoryArticles.map(article => <ArticleCard key={article.id} article={article} />)}
            </div>
          </section>
        )
      })}
    </div>
  )
}
