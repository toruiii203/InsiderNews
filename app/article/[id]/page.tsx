export const runtime = 'edge'

import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Clock, Eye, Calendar, User, ArrowLeft, Tag } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArticleCard } from "@/components/article-card"
import { BackToTop } from "@/components/back-to-top"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { JsonLd } from "@/components/json-ld"
import { ShareButtons } from "@/components/share-buttons"
import { Button } from "@/components/ui/button"
import { getCategoryColor, getRelativeTime, type Article } from "@/lib/mock-data"
import { supabaseAdmin } from "@/lib/supabase"

interface ArticlePageProps {
  params: Promise<{ id: string }>
}

async function getArticle(id: string): Promise<Article | null> {
  try {
    const { data, error } = await supabaseAdmin.from("articles").select("*").eq("id", id).single()
    if (error) {
      console.error("Error fetching article:", error)
      return null
    }
    return data
  } catch (err) {
    console.error("Unexpected error fetching article:", err)
    return null
  }
}

async function getRelatedArticles(category: string, excludeId: string): Promise<Article[]> {
  try {
    const { data, error } = await supabaseAdmin.from("articles").select("*")
      .eq("category", category).eq("status", "published")
      .neq("id", excludeId).lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false }).limit(3)
    if (error) {
      console.error("Error fetching related articles:", error)
      return []
    }
    return data ?? []
  } catch (err) {
    console.error("Unexpected error fetching related articles:", err)
    return []
  }
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  try {
    const { id } = await params
    const article = await getArticle(id)
    if (!article) return { title: "Article Not Found - The Insider News Philippines" }
    return {
      title: `${article.title ?? "Untitled"} - The Insider News Philippines`,
      description: article.excerpt ?? "",
      openGraph: {
        title: article.title ?? "Untitled",
        description: article.excerpt ?? "",
        type: "article",
        images: article.image_url ? [article.image_url] : [],
        publishedTime: article.published_at,
        authors: article.author ? [article.author] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: article.title ?? "Untitled",
        description: article.excerpt ?? "",
        images: article.image_url ? [article.image_url] : [],
      },
    }
  } catch (err) {
    console.error("Error generating metadata:", err)
    return { title: "The Insider News Philippines" }
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params
  const article = await getArticle(id)
  if (!article) notFound()

  const relatedArticles = await getRelatedArticles(article.category ?? "", article.id)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title ?? "",
    description: article.excerpt ?? "",
    image: article.image_url ?? "",
    datePublished: article.published_at ?? "",
    author: { "@type": "Person", name: article.author ?? "Unknown" },
    publisher: { "@type": "Organization", name: "The Insider News Philippines" },
  }

  const contentParagraphs = (article.content ?? "").split("\n\n").filter(Boolean)

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={jsonLd} />
      <Header />
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
            <Link href="/"><ArrowLeft className="h-4 w-4 mr-1" />Back to Home</Link>
          </Button>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {article.category && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getCategoryColor(article.category)}`}>
                {article.category}
              </span>
            )}
            {article.is_breaking && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#CE1126] text-white animate-pulse">BREAKING</span>
            )}
            {article.language === "FIL" && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FCD116] text-black">FILIPINO</span>
            )}
          </div>
          <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground leading-tight mb-4">
            {article.title ?? "Untitled"}
          </h1>
          {article.excerpt && (
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">{article.excerpt}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-y py-3">
            {article.author && (
              <span className="flex items-center gap-1.5"><User className="h-4 w-4" />{article.author}</span>
            )}
            {article.published_at && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(article.published_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            )}
            {article.reading_time != null && (
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{article.reading_time} min read</span>
            )}
            {article.view_count != null && (
              <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" />{article.view_count.toLocaleString()} views</span>
            )}
            {article.published_at && (
              <span className="ml-auto">{getRelativeTime(article.published_at)}</span>
            )}
          </div>
        </div>

        {article.image_url && (
          <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden mb-8">
            <Image src={article.image_url} alt={article.title ?? "Article image"} fill className="object-cover" priority />
          </div>
        )}

        <div className="prose prose-lg max-w-none mb-8 text-foreground leading-relaxed">
          {contentParagraphs.length > 0 ? (
            contentParagraphs.map((para, i) => (
              <p key={i} className="mb-4 text-base leading-relaxed">{para}</p>
            ))
          ) : (
            <p className="text-muted-foreground">No content available.</p>
          )}
        </div>

        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6 pt-4 border-t">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {article.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground hover:bg-muted/80 cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between py-4 border-t border-b mb-8">
          <ShareButtons title={article.title ?? ""} />
        </div>

        {relatedArticles.length > 0 && (
          <section>
            <h2 className="text-xl font-serif font-bold mb-4">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedArticles.map(a => <ArticleCard key={a.id} article={a} />)}
            </div>
          </section>
        )}
      </main>
      <Footer />
      <BackToTop />
      <MobileBottomNav />
    </div>
  )
}