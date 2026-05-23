"use client"

import { useState, useEffect, useCallback } from "react"
import { TrendingUp, Flame, MapPin, Newspaper, RefreshCw, Zap, ExternalLink, Image as ImageIcon } from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────
type Topic = {
  tag: string
  count: string
  heat: number
  imageUrl: string | null
  imageCaption: string | null
  newsUrl: string | null
}

type Region = {
  name: string
  label: string
  trend: string
  bar: number
}

// ── Fallback PH images (used when GNews has no image for a topic) ─────────────
const PH_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=900&q=80", // El Nido
  "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=900&q=80", // Banaue
  "https://images.unsplash.com/photo-1583417267826-aebc4d1542e1?w=900&q=80", // Cebu festival
  "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=900&q=80", // Mayon
]

// ── Fluctuation helpers ───────────────────────────────────────────────────────
function fluctuateTopics(topics: Topic[]): Topic[] {
  return topics.map(t => {
    const delta = (Math.random() - 0.48) * 0.7
    const newHeat = Math.max(10, Math.min(100, t.heat + delta))
    const rawCount = parseFloat(t.count.replace(/[KM+]/g, ""))
    const isK = t.count.includes("K")
    const newCount = Math.max(0.1, rawCount + (Math.random() - 0.48) * 0.2)
    return { ...t, heat: parseFloat(newHeat.toFixed(1)), count: `${newCount.toFixed(1)}${isK ? "K" : ""}` }
  })
}

function fluctuateRegions(regions: Region[]): Region[] {
  return regions.map(r => {
    const delta = (Math.random() - 0.48) * 1.5
    const newBar = Math.max(10, Math.min(99, r.bar + delta))
    const pct = Math.round(newBar / 5)
    return { ...r, bar: parseFloat(newBar.toFixed(1)), trend: `+${pct}%` }
  })
}

// ── Component ─────────────────────────────────────────────────────────────────
export function PhPulse() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [activePhoto, setActivePhoto] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [countdown, setCountdown] = useState(900)
  const [pulseKey, setPulseKey] = useState(0)

  // Topics that have images (for the carousel)
  const carouselTopics = topics.filter(t => t.imageUrl || t.newsUrl)

  const fetchTrending = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/trending", { cache: "no-store" })
      if (!res.ok) throw new Error("fetch failed")
      const data = await res.json()
      if (data.topics?.length) setTopics(data.topics)
      if (data.regions?.length) setRegions(data.regions)
      setIsLive(data.isLive ?? false)
      setLastUpdated(
        new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      )
    } catch {
      setIsLive(false)
      setLastUpdated(
        new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      )
    } finally {
      setLoading(false)
      setCountdown(900)
      setPulseKey(k => k + 1)
    }
  }, [])

  useEffect(() => { fetchTrending() }, [fetchTrending])

  // Auto-refresh Google Trends data every 15 min
  useEffect(() => {
    const iv = setInterval(fetchTrending, 15 * 60 * 1000)
    return () => clearInterval(iv)
  }, [fetchTrending])

  // Countdown ticker
  useEffect(() => {
    const iv = setInterval(() => setCountdown(c => (c <= 1 ? 900 : c - 1)), 1000)
    return () => clearInterval(iv)
  }, [])

  // Data fluctuations every 8 seconds
  useEffect(() => {
    if (topics.length === 0) return
    const iv = setInterval(() => {
      setTopics(prev => fluctuateTopics(prev))
      setRegions(prev => fluctuateRegions(prev))
      setLastUpdated(new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
      setPulseKey(k => k + 1)
    }, 8000)
    return () => clearInterval(iv)
  }, [topics.length])

  // Photo carousel auto-advance every 5 seconds
  useEffect(() => {
    const photos = topics.length > 0 ? topics.slice(0, 4) : []
    if (photos.length === 0) return
    const iv = setInterval(() => setActivePhoto(p => (p + 1) % photos.length), 5000)
    return () => clearInterval(iv)
  }, [topics.length])

  const mins = Math.floor(countdown / 60)
  const secs = countdown % 60
  const nextRefresh = `${mins}:${String(secs).padStart(2, "0")}`

  // The 4 topics shown in the carousel (with fallback images)
  const carouselItems = topics.slice(0, 4).map((t, i) => ({
    ...t,
    displayImage: t.imageUrl || PH_FALLBACK_IMAGES[i % PH_FALLBACK_IMAGES.length],
    displayLink: t.newsUrl || `https://trends.google.com/trends/explore?geo=PH&q=${encodeURIComponent(t.tag)}`,
  }))

  return (
    <section className="bg-[#F4F7FB] dark:bg-muted/30 py-10 border-y border-border">
      <div className="container mx-auto px-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-[#CE1126] rounded" />
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                Philippines Pulse
                <span className={`flex items-center gap-1 text-xs font-sans font-medium px-2 py-0.5 rounded-full ${
                  isLive ? "text-[#CE1126] bg-[#CE1126]/10" : "text-amber-600 bg-amber-100 dark:bg-amber-900/30"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-[#CE1126] animate-pulse" : "bg-amber-500"}`} />
                  {isLive ? "LIVE" : "CACHED"}
                </span>
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
                What the Philippines is searching for right now
                {lastUpdated && (
                  <>
                    <span className="text-muted-foreground/50">· Updated {lastUpdated}</span>
                    <span className="text-[10px] text-muted-foreground/40">· Next refresh in {nextRefresh}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            suppressHydrationWarning
            onClick={fetchTrending}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#CE1126] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* ── Loading skeleton ── */}
        {loading && topics.length === 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card border border-border rounded-xl h-80 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── LEFT: Region Activity ── */}
            <div className="bg-card border border-border rounded-xl overflow-hidden" key={`regions-${pulseKey}`}>
              <div className="bg-[#002D72] px-4 py-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#FCD116]" />
                <h3 className="text-white font-semibold text-sm">News Activity by Region</h3>
                <span className="ml-auto flex items-center gap-1 text-[10px] text-white/40">
                  <Zap className="h-2.5 w-2.5" />
                  {isLive ? "via GNews" : "estimated"}
                </span>
              </div>
              <div className="p-4 space-y-3.5">
                {regions.map((r, i) => (
                  <div key={r.name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-semibold text-foreground">{r.label}</span>
                          <span className="text-[10px] text-muted-foreground">{r.name}</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{r.trend}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#002D72] to-[#CE1126] rounded-full transition-all duration-1000 ease-in-out"
                          style={{ width: `${r.bar}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4">
                <p className="text-[11px] text-muted-foreground text-center border-t border-border pt-3">
                  {isLive ? "Based on GNews article volume by region" : "Estimated based on engagement"}
                </p>
              </div>
            </div>

            {/* ── CENTER: Hot Topics ── */}
            <div className="bg-card border border-border rounded-xl overflow-hidden" key={`topics-${pulseKey}`}>
              <div className="bg-[#CE1126] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-white" />
                  <h3 className="text-white font-semibold text-sm">Trending in Philippines</h3>
                </div>
                <span className="text-white/60 text-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
                  Google Trends PH
                </span>
              </div>
              <div className="p-4 space-y-2">
                {topics.map((topic, i) => (
                  <a
                    key={topic.tag}
                    href={`https://trends.google.com/trends/explore?geo=PH&q=${encodeURIComponent(topic.tag)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/60 transition-colors group cursor-pointer"
                  >
                    <span className={`text-sm font-black w-5 text-center shrink-0 ${i < 3 ? "text-[#CE1126]" : "text-muted-foreground"}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#002D72] dark:text-blue-300 truncate group-hover:underline">
                        {topic.tag}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#CE1126] to-[#FCD116] rounded-full transition-all duration-1000 ease-in-out"
                            style={{ width: `${topic.heat}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                          {topic.count} searches
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground/30 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Real News Images Carousel ── */}
            <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
              <div className="bg-[#FCD116] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Newspaper className="h-4 w-4 text-[#002D72]" />
                  <h3 className="text-[#002D72] font-semibold text-sm">News Images</h3>
                </div>
                <span className="text-[#002D72]/50 text-[10px] font-medium flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-[#002D72]/40 animate-pulse" />
                  {isLive ? "via GNews · 6hr cache" : "Philippines photos"}
                </span>
              </div>

              {/* Carousel */}
              <div className="relative h-56 bg-muted overflow-hidden flex-shrink-0">
                {carouselItems.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-8 w-8 opacity-30" />
                    <span className="text-xs opacity-50">Loading images...</span>
                  </div>
                ) : (
                  carouselItems.map((item, i) => (
                    <a
                      key={`${item.tag}-${i}`}
                      href={item.displayLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 block group transition-opacity duration-700"
                      style={{ opacity: i === activePhoto ? 1 : 0, pointerEvents: i === activePhoto ? "auto" : "none" }}
                    >
                      <img
                        src={item.displayImage}
                        alt={item.imageCaption || item.tag}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => {
                          ;(e.target as HTMLImageElement).src = PH_FALLBACK_IMAGES[i % PH_FALLBACK_IMAGES.length]
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                      {/* Trending badge */}
                      <div className="absolute top-3 left-3">
                        <span className="bg-[#CE1126] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          {item.tag}
                        </span>
                      </div>

                      {/* Caption from real news article */}
                      {item.imageCaption && (
                        <div className="absolute bottom-8 left-3 right-3">
                          <p className="text-white text-xs font-medium line-clamp-2 leading-relaxed drop-shadow">
                            {item.imageCaption}
                          </p>
                        </div>
                      )}

                      {/* Hover: read article */}
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="flex items-center gap-1 bg-white/90 text-[#002D72] text-[10px] font-bold px-2 py-1 rounded">
                          <ExternalLink className="h-2.5 w-2.5" />
                          {item.newsUrl ? "Read article" : "View trend"}
                        </span>
                      </div>
                    </a>
                  ))
                )}

                {/* Dot indicators */}
                {carouselItems.length > 0 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {carouselItems.map((_, i) => (
                      <button
                        suppressHydrationWarning
                        key={i}
                        onClick={() => setActivePhoto(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === activePhoto ? "bg-white w-5" : "bg-white/40 w-1.5 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Topic rows below carousel */}
              <div className="flex-1 divide-y divide-border">
                {carouselItems.map((item, i) => (
                  <button
                    suppressHydrationWarning
                    key={item.tag + i}
                    onClick={() => setActivePhoto(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === activePhoto
                        ? "bg-[#002D72]/5 dark:bg-white/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                      i === activePhoto ? "bg-[#CE1126] text-white" : "bg-muted text-muted-foreground"
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-semibold truncate block ${
                        i === activePhoto ? "text-[#002D72] dark:text-blue-300" : "text-foreground"
                      }`}>
                        {item.tag}
                      </span>
                      {item.imageCaption && (
                        <span className="text-[10px] text-muted-foreground truncate block">
                          {item.imageCaption}
                        </span>
                      )}
                    </div>
                    {/* Show GNews badge for topics that have real images */}
                    {item.imageUrl && (
                      <span className="text-[9px] text-muted-foreground/50 shrink-0 font-medium">GNews</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </section>
  )
}
