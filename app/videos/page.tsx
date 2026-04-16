import Image from "next/image"
import { Play } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BackToTop } from "@/components/back-to-top"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { Card, CardContent } from "@/components/ui/card"
import { mockVideos, getCategoryColor, getRelativeTime } from "@/lib/mock-data"

export const metadata = {
  title: "Videos - The Insider News Philippines",
  description: "Watch the latest video news from The Insider News Philippines. Post. Share. Stay Informed.",
}

export default function VideosPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-8">
          Latest Videos
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockVideos.map((video) => (
            <Card key={video.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardContent className="p-0">
                <a href={video.video_url} target="_blank" rel="noopener noreferrer">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={video.thumbnail_url}
                      alt={video.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-[#CE1126] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="h-7 w-7 text-white fill-white ml-1" />
                      </div>
                    </div>
                    <span className={`absolute top-3 left-3 px-2 py-1 text-xs font-semibold text-white rounded ${getCategoryColor(video.category)}`}>
                      {video.category}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-serif font-bold text-lg text-foreground line-clamp-2 group-hover:text-[#CE1126] transition-colors mb-2">
                      {video.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {video.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getRelativeTime(video.published_at)}
                    </p>
                  </div>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
      <BackToTop />
      <MobileBottomNav />
    </div>
  )
}
