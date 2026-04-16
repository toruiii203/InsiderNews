"use client"

import Image from "next/image"
import Link from "next/link"
import { Eye, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { type Article, getRelativeTime, getCategoryColor } from "@/lib/mock-data"

interface ArticleCardProps {
  article: Article
  variant?: "default" | "compact" | "featured"
}

export function ArticleCard({ article, variant = "default" }: ArticleCardProps) {
  if (variant === "compact") {
    return (
      <Link href={`/article/${article.id}`}>
        <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-transparent">
          <CardContent className="p-0 flex gap-3">
            <div className="relative w-24 h-24 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={article.image_url}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span className={`inline-block w-fit px-2 py-0.5 text-[10px] font-semibold text-white rounded ${getCategoryColor(article.category)} mb-1`}>
                {article.category}
              </span>
              <h3 className="font-serif font-semibold text-sm text-foreground line-clamp-2 group-hover:text-[#CE1126] transition-colors">
                {article.title}
              </h3>
              <span className="text-xs text-muted-foreground mt-1">
                {getRelativeTime(article.published_at)}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  if (variant === "featured") {
    return (
      <Link href={`/article/${article.id}`}>
        <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0">
          <CardContent className="p-0">
            <div className="relative h-64 overflow-hidden">
              <Image
                src={article.image_url}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <span className={`inline-block px-2 py-1 text-xs font-semibold text-white rounded ${getCategoryColor(article.category)} mb-2`}>
                  {article.category}
                </span>
                <h3 className="font-serif font-bold text-xl text-white line-clamp-2">
                  {article.title}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Link href={`/article/${article.id}`}>
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full">
        <CardContent className="p-0">
          <div className="relative h-48 overflow-hidden">
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {article.is_breaking && (
              <span className="absolute top-3 left-3 px-2 py-1 bg-[#CE1126] text-white text-xs font-bold rounded animate-pulse">
                BREAKING
              </span>
            )}
          </div>
          <div className="p-4">
            <span className={`inline-block px-2 py-1 text-xs font-semibold text-white rounded ${getCategoryColor(article.category)} mb-2`}>
              {article.category}
            </span>
            <h3 className="font-serif font-bold text-lg text-foreground line-clamp-2 group-hover:text-[#CE1126] transition-colors mb-2">
              {article.title}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
              {article.excerpt}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {article.reading_time} min
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {article.view_count.toLocaleString()}
                </span>
              </div>
              <span>{getRelativeTime(article.published_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
