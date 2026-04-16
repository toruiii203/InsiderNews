"use client"

import { useState, useMemo } from "react"
import { Search as SearchIcon } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArticleCard } from "@/components/article-card"
import { BackToTop } from "@/components/back-to-top"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { mockArticles } from "@/lib/mock-data"

export default function SearchPage() {
  const [query, setQuery] = useState("")

  const searchResults = useMemo(() => {
    if (!query.trim()) return []
    
    const lowerQuery = query.toLowerCase()
    return mockArticles.filter(
      article =>
        article.title.toLowerCase().includes(lowerQuery) ||
        article.content.toLowerCase().includes(lowerQuery) ||
        article.excerpt.toLowerCase().includes(lowerQuery) ||
        article.category.toLowerCase().includes(lowerQuery) ||
        article.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }, [query])

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        {/* Search Header */}
        <div className="max-w-2xl mx-auto mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground text-center mb-6">
            Search News
          </h1>
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input suppressHydrationWarning
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles by title, content, or tags..."
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-input bg-background text-lg focus:outline-none focus:ring-2 focus:ring-[#0038A8]"
              autoFocus
            />
          </div>
        </div>

        {/* Search Results */}
        {query.trim() ? (
          <div>
            <p className="text-muted-foreground mb-6">
              {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} found for &quot;{query}&quot;
            </p>
            
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No articles found. Try a different search term.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Enter a search term to find articles.
            </p>
          </div>
        )}
      </main>

      <Footer />
      <BackToTop />
      <MobileBottomNav />
    </div>
  )
}
