"use client"

import Image from "next/image"
import { Play } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { mockVideos, getCategoryColor, getRelativeTime } from "@/lib/mock-data"

export function VideoSection() {
  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif font-bold text-foreground">
          Latest Videos
        </h2>
        <a href="/videos" className="text-[#002D72] hover:text-[#CE1126] text-sm font-medium">
          View All Videos
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockVideos.map((video) => (
          <Card key={video.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <CardContent className="p-0">
              <a href={video.video_url} target="_blank" rel="noopener noreferrer">
                <div className="relative h-40 overflow-hidden">
                  <Image
                    src={video.thumbnail_url}
                    alt={video.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-[#CE1126] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="h-6 w-6 text-white fill-white ml-1" />
                    </div>
                  </div>
                  <span className={`absolute top-3 left-3 px-2 py-1 text-xs font-semibold text-white rounded ${getCategoryColor(video.category)}`}>
                    {video.category}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-foreground line-clamp-2 group-hover:text-[#CE1126] transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2">
                    {getRelativeTime(video.published_at)}
                  </p>
                </div>
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
