"use client"

import Image from "next/image"
import Link from "next/link"
import { Camera, ChevronRight } from "lucide-react"

const photos = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=600&h=400&fit=crop",
    caption: "Sunset at Manila Bay draws crowds as city implements new promenade improvements",
    category: "Metro"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=600&h=400&fit=crop",
    caption: "Traditional festivals return as communities celebrate cultural heritage",
    category: "Culture"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&h=400&fit=crop",
    caption: "Philippine wildlife: Conservation efforts show promising results",
    category: "Environment"
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop",
    caption: "Modern infrastructure projects reshape urban landscapes",
    category: "Development"
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1570789210967-2cac24ba4d35?w=600&h=400&fit=crop",
    caption: "Beach destinations prepare for peak tourism season",
    category: "Travel"
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&h=400&fit=crop",
    caption: "Local markets showcase rich variety of Philippine produce",
    category: "Lifestyle"
  }
]

export function PhotoGallery() {
  return (
    <section className="py-6">
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="flex items-center gap-3">
            <Camera className="h-6 w-6 text-[#FCD116]" />
            <span className="text-2xl font-serif font-bold text-foreground">
              Photo Gallery
            </span>
          </h2>
          <Link 
            href="/photos"
            className="flex items-center gap-1 text-[#002D72] hover:text-[#CE1126] text-sm font-medium"
          >
            View All Photos
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <Link 
              key={photo.id} 
              href={`/photos/${photo.id}`}
              className={`group relative overflow-hidden rounded-lg ${
                index === 0 ? "col-span-2 row-span-2" : ""
              }`}
            >
              <div className={`relative ${index === 0 ? "h-80 md:h-96" : "h-40 md:h-48"}`}>
                <Image
                  src={photo.image}
                  alt={photo.caption}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="inline-block px-2 py-1 bg-[#CE1126] text-white text-xs font-medium rounded mb-2">
                    {photo.category}
                  </span>
                  <p className={`text-white font-medium ${index === 0 ? "text-base" : "text-sm"} line-clamp-2`}>
                    {photo.caption}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
