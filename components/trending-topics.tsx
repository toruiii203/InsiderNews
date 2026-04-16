"use client"

import Link from "next/link"
import { TrendingUp, Hash } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const trendingTopics = [
  { tag: "Election2028", count: 15420, category: "Politics" },
  { tag: "PesoStrength", count: 12350, category: "Business" },
  { tag: "GilasPilipinas", count: 9870, category: "Sports" },
  { tag: "MNLTraffic", count: 8540, category: "Metro" },
  { tag: "PhilippineTourism", count: 7230, category: "Travel" },
  { tag: "TechPH", count: 6890, category: "Technology" },
  { tag: "OFWNews", count: 5670, category: "World" },
  { tag: "HealthPH", count: 4980, category: "Lifestyle" },
]

export function TrendingTopics() {
  return (
    <section className="py-5 border-y border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-6 w-6 text-[#CE1126]" />
          <h2 className="text-xl font-serif font-bold text-foreground">
            Trending Topics
          </h2>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {trendingTopics.map((topic, index) => (
            <Link 
              key={topic.tag}
              href={`/search?q=${topic.tag}`}
              className="group"
            >
              <Badge 
                variant={index < 3 ? "default" : "outline"}
                className={`
                  px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer
                  ${index < 3 
                    ? "bg-gradient-to-r from-[#CE1126] to-[#CE1126]/80 hover:from-[#CE1126]/90 hover:to-[#CE1126]/70 text-white border-0" 
                    : "hover:bg-[#002D72] hover:text-white hover:border-[#002D72]"
                  }
                `}
              >
                <Hash className="h-3 w-3 mr-1 inline" />
                {topic.tag}
                <span className="ml-2 text-xs opacity-70">
                  {(topic.count / 1000).toFixed(1)}k
                </span>
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
