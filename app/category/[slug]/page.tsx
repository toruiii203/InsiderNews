import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArticleCard } from "@/components/article-card"
import { BackToTop } from "@/components/back-to-top"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { categories, type Article } from "@/lib/mock-data"
import { supabaseAdmin } from "@/lib/supabase"

interface CategoryPageProps { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = categories.find(c => c.name.toLowerCase() === slug.toLowerCase())
  if (!category) return { title: "Category Not Found - The Insider News Philippines" }
  return {
    title: `${category.name} News - The Insider News Philippines`,
    description: `Latest ${category.name} news and updates from The Insider News Philippines.`,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = categories.find(c => c.name.toLowerCase() === slug.toLowerCase())
  if (!category) notFound()

  const { data: categoryArticles } = await supabaseAdmin.from("articles").select("*")
    .ilike("category", slug).eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })

  const articles: Article[] = categoryArticles ?? []

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className={`w-2 h-10 ${category.color} rounded`} />
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">{category.name}</h1>
          </div>
          <p className="text-muted-foreground">{articles.length} articles in this category</p>
        </div>
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(article => <ArticleCard key={article.id} article={article} />)}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No articles found in this category yet.</p>
          </div>
        )}
      </main>
      <Footer />
      <BackToTop />
      <MobileBottomNav />
    </div>
  )
}
