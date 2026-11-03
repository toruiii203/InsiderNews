export const runtime = 'edge'

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BackToTop } from "@/components/back-to-top"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { Card, CardContent } from "@/components/ui/card"
import { categories } from "@/lib/mock-data"
import { db } from "@/lib/db"

export const metadata = {
  title: "Categories - The Insider News Philippines",
  description: "Browse all news categories on The Insider News Philippines. Post. Share. Stay Informed.",
}

export default async function CategoriesPage() {
  let countsMap: Record<string, number> = {}
  try {
    const rows = await db.query(
      `SELECT LOWER(category) as category, COUNT(*)::int as count 
       FROM articles 
       WHERE status = 'published' AND published_at <= NOW()
       GROUP BY LOWER(category)`
    )
    for (const r of rows ?? []) {
      countsMap[r.category] = Number(r.count)
    }
  } catch (err) {
    console.error("[Categories Page] Error fetching category counts:", err)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-8">
          All Categories
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const articleCount = countsMap[category.name.toLowerCase()] ?? 0

            return (
              <Link key={category.name} href={`/category/${category.name.toLowerCase()}`}>
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <CardContent className="p-0">
                    <div className={`h-2 ${category.color}`} />
                    <div className="p-6 flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-serif font-bold text-foreground group-hover:text-[#CE1126] transition-colors">
                          {category.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {articleCount} article{articleCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-[#CE1126] group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </main>

      <Footer />
      <BackToTop />
      <MobileBottomNav />
    </div>
  )
}
