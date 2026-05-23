"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Search as SearchIcon, Loader2 } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArticleCard } from "@/components/article-card"
import { BackToTop } from "@/components/back-to-top"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"

type Article = {
  id: string
  title: string
  excerpt: string
  content: string
  image_url: string
  category: string
  tags: string[]
  published_at: string
  view_count: number
  author: string
}

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQ = searchParams.get("q") || ""

  const [query, setQuery] = useState(initialQ)
  const [inputValue, setInputValue] = useState(initialQ)
  const [results, setResults] = useState<Article[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  // Sync query from URL changes
  useEffect(() => {
    const q = searchParams.get("q") || ""
    setQuery(q)
    setInputValue(q)
  }, [searchParams])

  // Run search whenever query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSearched(false)
      return
    }

    async function doSearch() {
      setSearching(true)
      setSearched(false)
      try {
        // Fetch all published articles and filter client-side
        const res = await fetch(`/api/articles?status=published&limit=200`)
        if (!res.ok) throw new Error("fetch failed")
        const data = await res.json()
        const articles: Article[] = Array.isArray(data) ? data : data.articles ?? []

        const q = query.toLowerCase()
        const filtered = articles.filter(a =>
          a.title?.toLowerCase().includes(q) ||
          a.excerpt?.toLowerCase().includes(q) ||
          a.content?.toLowerCase().includes(q) ||
          a.category?.toLowerCase().includes(q) ||
          a.tags?.some(tag => tag.toLowerCase().includes(q)) ||
          a.author?.toLowerCase().includes(q)
        )
        setResults(filtered)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
        setSearched(true)
      }
    }

    doSearch()
  }, [query])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setQuery(inputValue.trim())
  }

  return (
    <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
      <div className="max-w-2xl mx-auto mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground text-center mb-6">
          Search News
        </h1>
        <form onSubmit={handleSubmit} className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            suppressHydrationWarning
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Search articles by title, content, or tags..."
            className="w-full pl-12 pr-4 py-4 rounded-xl border border-input bg-background text-lg focus:outline-none focus:ring-2 focus:ring-[#002D72]"
            autoFocus
          />
          {searching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
          )}
        </form>
      </div>

      {query.trim() ? (
        <div>
          {searching ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#002D72] mx-auto mb-3" />
              <p className="text-muted-foreground">Searching articles...</p>
            </div>
          ) : searched ? (
            <>
              <p className="text-muted-foreground mb-6">
                {results.length} result{results.length !== 1 ? "s" : ""} found for &quot;{query}&quot;
              </p>
              {results.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.map(article => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No articles found. Try a different search term.</p>
                </div>
              )}
            </>
          ) : null}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Enter a search term to find articles.</p>
        </div>
      )}
    </main>
  )
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Suspense fallback={
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="h-8 bg-muted rounded animate-pulse mb-6 w-48 mx-auto" />
            <div className="h-14 bg-muted rounded-xl animate-pulse" />
          </div>
        </main>
      }>
        <SearchContent />
      </Suspense>
      <Footer />
      <BackToTop />
      <MobileBottomNav />
    </div>
  )
}
