"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { TrendingUp, Flame, MapPin, BarChart3, Clock, RefreshCw } from "lucide-react"
import { mockArticles } from "@/lib/mock-data"

type Topic = { tag: string; count: string; heat: number }
type Region = { name: string; label: string; trend: string; bar: number }

const photoEssay = {
  title: "Faces of the Archipelago",
  subtitle: "A week in pictures across the Philippine islands",
  photos: [
    { src: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=600&q=80", caption: "El Nido, Palawan", region: "Region IV-B" },
    { src: "https://images.unsplash.com/photo-1583417267826-aebc4d1542e1?w=600&q=80", caption: "Sinulog Festival, Cebu", region: "Region VII" },
    { src: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80", caption: "Mayon Volcano, Albay", region: "Region V" },
    { src: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600&q=80", caption: "Banaue Rice Terraces", region: "CAR" },
  ],
}

const fallbackTopics: Topic[] = [
  { tag: "#WestPhilippineSea", count: "48.2K", heat: 98 },
  { tag: "#BudgetHearings2026", count: "31.7K", heat: 85 },
  { tag: "#PalawanTourism", count: "22.4K", heat: 72 },
  { tag: "#PesoWatch", count: "19.8K", heat: 65 },
  { tag: "#TyphoonUpdate", count: "15.3K", heat: 58 },
  { tag: "#GilasVsChina", count: "12.1K", heat: 44 },
]

const fallbackRegions: Region[] = [
  { name: "NCR", label: "Metro Manila", trend: "+18%", bar: 92 },
  { name: "Region VII", label: "Cebu", trend: "+12%", bar: 76 },
  { name: "Region XI", label: "Davao", trend: "+9%", bar: 62 },
  { name: "Region IV-A", label: "CALABARZON", trend: "+7%", bar: 50 },
  { name: "Region III", label: "Central Luzon", trend: "+6%", bar: 40 },
  { name: "BARMM", label: "Bangsamaro", trend: "+5%", bar: 30 },
]

export function PhPulse() {
  const [activePhoto, setActivePhoto] = useState(0)
  const [topics, setTopics] = useState<Topic[]>(fallbackTopics)
  const [regions, setRegions] = useState<Region[]>(fallbackRegions)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)

  const fetchTrending = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/trending")
      if (!res.ok) throw new Error("fetch failed")
      const data = await res.json()
      if (data.topics?.length) setTopics(data.topics)
      if (data.regions?.length) setRegions(data.regions)
      if (data.fetchedAt) {
        const d = new Date(data.fetchedAt)
        setLastUpdated(d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }))
        setIsLive(true)
      }
    } catch {
      setIsLive(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrending()
    const iv = setInterval(fetchTrending, 15 * 60 * 1000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const iv = setInterval(() => setActivePhoto(p => (p + 1) % photoEssay.photos.length), 4000)
    return () => clearInterval(iv)
  }, [])

  return (
    <section className="bg-[#F4F7FB] dark:bg-muted/30 py-10 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-[#CE1126] rounded" />
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                Philippines Pulse
                <span className={`flex items-center gap-1 text-xs font-sans font-medium px-2 py-0.5 rounded-full ${
                  isLive ? "text-[#CE1126] bg-[#CE1126]/10" : "text-amber-600 bg-amber-100"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-[#CE1126] animate-pulse" : "bg-amber-500"}`} />
                  {isLive ? "LIVE" : "CACHED"}
                </span>
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                Trending data from Google PH
                {lastUpdated && <span className="text-xs text-muted-foreground/70">· Updated {lastUpdated}</span>}
              </p>
            </div>
          </div>
          <button suppressHydrationWarning
            onClick={fetchTrending}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#CE1126] transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Region Activity */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="bg-[#002D72] px-4 py-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#FCD116]" />
              <h3 className="text-white font-semibold text-sm">News Activity by Region</h3>
            </div>
            <div className="p-4 space-y-3">
              {(loading ? fallbackRegions : regions).map((prov, i) => (
                <div key={prov.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-sm font-medium text-foreground">{prov.label}</span>
                        <span className="text-xs text-muted-foreground ml-1.5">{prov.name}</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-600">{prov.trend}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#002D72] to-[#CE1126] rounded-full transition-all duration-700"
                        style={{ width: `${prov.bar}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 pb-4">
              <p className="text-[11px] text-muted-foreground text-center border-t border-border pt-3">
                {isLive ? "Based on GNews article volume by region" : "Based on site article views and category engagement"}
              </p>
            </div>
          </div>

          {/* Center: Hot Topics */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="bg-[#CE1126] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-white" />
                <h3 className="text-white font-semibold text-sm">Hot Topics Right Now</h3>
              </div>
              {isLive && <span className="text-white/70 text-[10px]">via Google PH Trends</span>}
            </div>
            <div className="p-4 space-y-2.5">
              {(loading ? fallbackTopics : topics).map((topic, i) => (
                <a
                  key={topic.tag}
                  href={`https://www.google.com/search?q=${encodeURIComponent(topic.tag)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <span className={`text-sm font-black w-5 text-center ${i < 3 ? "text-[#CE1126]" : "text-muted-foreground"}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#002D72] dark:text-blue-300 group-hover:underline truncate">{topic.tag}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-[#CE1126] rounded-full transition-all duration-700" style={{ width: `${topic.heat}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{topic.count} searches</span>
                    </div>
                  </div>
                  <TrendingUp className="h-3.5 w-3.5 text-[#CE1126] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>

          {/* Right: Photo Carousel */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="bg-[#FCD116] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#002D72]" />
                <h3 className="text-[#002D72] font-semibold text-sm">{photoEssay.title}</h3>
              </div>
              <span className="text-[#002D72] text-[10px] font-medium">{photoEssay.subtitle}</span>
            </div>
            <div className="relative h-52 overflow-hidden">
              {photoEssay.photos.map((photo, i) => (
                <div key={i} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: i === activePhoto ? 1 : 0 }}>
                  <img src={photo.src} alt={photo.caption} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <p className="text-white font-semibold text-sm">{photo.caption}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-2.5 w-2.5 text-[#FCD116]" />
                      <span className="text-[#FCD116] text-[10px]">{photo.region}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="absolute bottom-3 right-4 flex gap-1">
                {photoEssay.photos.map((_, i) => (
                  <button suppressHydrationWarning key={i} onClick={() => setActivePhoto(i)} suppressHydrationWarning
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === activePhoto ? "bg-[#FCD116] w-4" : "bg-white/50"}`} />
                ))}
              </div>
            </div>
            <div className="p-4 space-y-2">
              {mockArticles.filter(a => a.category === "Tourism" || a.category === "Feature").slice(0, 2).map(a => (
                <Link key={a.id} href={`/article/${a.id}`} className="flex items-start gap-2 group">
                  <Clock className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-xs text-foreground group-hover:text-[#CE1126] transition-colors line-clamp-2 leading-relaxed">{a.title}</span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
