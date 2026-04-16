"use client"

import Image from "next/image"
import Link from "next/link"
import { ChevronRight, Quote } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const opinions = [
  {
    id: 1,
    title: "The Future of Philippine Democracy: Challenges and Opportunities",
    excerpt: "As we navigate through changing political landscapes, it becomes increasingly important to reflect on the foundations of our democratic institutions...",
    author: "Maria Santos",
    authorRole: "Political Analyst",
    authorImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    date: "April 3, 2026"
  },
  {
    id: 2,
    title: "Economic Recovery: What the Numbers Really Mean for Filipino Families",
    excerpt: "Behind every economic indicator lies a story of everyday Filipinos striving for a better life. Let's examine what recent trends mean for households...",
    author: "Juan dela Cruz",
    authorRole: "Economics Editor",
    authorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    date: "April 2, 2026"
  },
  {
    id: 3,
    title: "Climate Change and the Filipino Farmer: A Call to Action",
    excerpt: "Our agricultural sector faces unprecedented challenges. Here's why we need immediate and decisive action to protect our farmers and food security...",
    author: "Ana Reyes",
    authorRole: "Environmental Correspondent",
    authorImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    date: "April 1, 2026"
  }
]

export function OpinionSection() {
  return (
    <section className="py-8 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="flex items-center gap-3">
            <span className="w-1 h-8 bg-[#CE1126] rounded" />
            <span className="text-2xl font-serif font-bold text-foreground">
              Opinion & Editorial
            </span>
          </h2>
          <Link 
            href="/category/opinion"
            className="flex items-center gap-1 text-[#002D72] hover:text-[#CE1126] text-sm font-medium"
          >
            View All
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {opinions.map((opinion) => (
            <Card key={opinion.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-[#CE1126]">
              <CardContent className="p-6">
                <Quote className="h-8 w-8 text-[#CE1126]/20 mb-4" />
                <h3 className="font-serif font-bold text-lg text-foreground mb-3 group-hover:text-[#CE1126] transition-colors line-clamp-2">
                  {opinion.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                  {opinion.excerpt}
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <Image
                    src={opinion.authorImage}
                    alt={opinion.author}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div>
                    <p className="font-medium text-foreground text-sm">{opinion.author}</p>
                    <p className="text-xs text-muted-foreground">{opinion.authorRole}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
