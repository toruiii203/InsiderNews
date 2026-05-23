export const runtime = 'edge'

import { NextResponse } from "next/server"

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

// ── Fallbacks ─────────────────────────────────────────────────────────────────
const FALLBACK_TOPICS: Topic[] = [
  { tag: "#WestPhilippineSea", count: "48.2K", heat: 98, imageUrl: null, imageCaption: null, newsUrl: null },
  { tag: "#BudgetHearings2026", count: "31.7K", heat: 85, imageUrl: null, imageCaption: null, newsUrl: null },
  { tag: "#PalawanTourism", count: "22.4K", heat: 72, imageUrl: null, imageCaption: null, newsUrl: null },
  { tag: "#PesoWatch", count: "19.8K", heat: 65, imageUrl: null, imageCaption: null, newsUrl: null },
  { tag: "#TyphoonUpdate", count: "15.3K", heat: 58, imageUrl: null, imageCaption: null, newsUrl: null },
  { tag: "#GilasPilipinas", count: "12.1K", heat: 44, imageUrl: null, imageCaption: null, newsUrl: null },
]

const FALLBACK_REGIONS: Region[] = [
  { name: "NCR", label: "Metro Manila", trend: "+18%", bar: 92 },
  { name: "Region VII", label: "Cebu", trend: "+12%", bar: 76 },
  { name: "Region XI", label: "Davao", trend: "+9%", bar: 62 },
  { name: "Region IV-A", label: "CALABARZON", trend: "+7%", bar: 50 },
  { name: "Region III", label: "Central Luzon", trend: "+6%", bar: 40 },
  { name: "BARMM", label: "Bangsamoro", trend: "+5%", bar: 30 },
]

// ── Google Trends RSS — free, refresh often ───────────────────────────────────
async function fetchGoogleTrends(): Promise<{ tag: string; count: string; heat: number; rawTerm: string }[]> {
  try {
    const res = await fetch(
      "https://trends.google.com/trends/trendingsearches/daily/rss?geo=PH",
      {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
        next: { revalidate: 900 } // cache 15 min — free so refresh often
      }
    )
    if (!res.ok) throw new Error("RSS failed")
    const xml = await res.text()

    const titleMatches = [...xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)]
    const trafficMatches = [...xml.matchAll(/<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/g)]

    const topics = titleMatches.slice(1, 7).map((m, i) => {
      const raw = m[1].trim()
      const traffic = trafficMatches[i]?.[1]?.replace(/[^0-9KM+]/g, "").replace("+", "") || "—"
      const tag = raw.startsWith("#") ? raw : `#${raw.replace(/\s+/g, "")}`
      const heat = Math.max(20, 98 - i * 13)
      return { tag, count: traffic, heat, rawTerm: raw }
    })

    if (topics.length === 0) throw new Error("no items parsed")
    return topics
  } catch {
    return FALLBACK_TOPICS.map(t => ({ tag: t.tag, count: t.count, heat: t.heat, rawTerm: t.tag.replace("#", "") }))
  }
}

// ── GNews image fetch — budget: 6 req per call × 4 calls/day = 24/day ─────────
// We fetch ONE article per topic (max=1), only for top 4 topics to save budget
// revalidate: 6 hours = 21600 seconds
async function fetchGNewsImage(
  query: string,
  apiKey: string
): Promise<{ imageUrl: string | null; imageCaption: string | null; newsUrl: string | null }> {
  try {
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query + " Philippines")}&lang=en&country=ph&max=1&apikey=${apiKey}`
    const res = await fetch(url, {
      next: { revalidate: 21600 } // cache 6 hours
    })
    if (!res.ok) throw new Error(`GNews ${res.status}`)
    const data = await res.json()
    const article = data.articles?.[0]
    if (!article) return { imageUrl: null, imageCaption: null, newsUrl: null }
    return {
      imageUrl: article.image || null,
      imageCaption: article.title || null,
      newsUrl: article.url || null,
    }
  } catch {
    return { imageUrl: null, imageCaption: null, newsUrl: null }
  }
}

// ── Region activity — GNews counts, cache 6 hours ────────────────────────────
async function fetchRegionActivity(gnewsKey: string | undefined): Promise<Region[]> {
  const regions = [
    { name: "NCR", label: "Metro Manila", query: "Metro Manila Philippines" },
    { name: "Region VII", label: "Cebu", query: "Cebu Philippines" },
    { name: "Region XI", label: "Davao", query: "Davao Philippines" },
    { name: "Region IV-A", label: "CALABARZON", query: "CALABARZON Philippines" },
    { name: "Region III", label: "Central Luzon", query: "Central Luzon Philippines" },
    { name: "BARMM", label: "Bangsamoro", query: "Bangsamoro Philippines" },
  ]

  if (!gnewsKey) return FALLBACK_REGIONS

  try {
    const counts = await Promise.all(
      regions.map(async r => {
        const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(r.query)}&lang=en&country=ph&max=1&apikey=${gnewsKey}`
        const res = await fetch(url, { next: { revalidate: 21600 } }) // 6 hours
        if (!res.ok) return 0
        const data = await res.json()
        return data.totalArticles ?? 0
      })
    )
    const max = Math.max(...counts, 1)
    return regions.map((r, i) => ({
      name: r.name,
      label: r.label,
      trend: `+${Math.round((counts[i] / max) * 18)}%`,
      bar: Math.round((counts[i] / max) * 90) + 10,
    }))
  } catch {
    return FALLBACK_REGIONS
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET() {
  const gnewsKey = process.env.GNEWS_API_KEY

  // Always fetch Google Trends (free, 15 min cache)
  const trendTerms = await fetchGoogleTrends()

  // Fetch GNews images only for top 4 topics to stay well within 100/day budget
  // 4 topics + 6 regions = 10 GNews calls per refresh × 4 refreshes/day = 40/day
  const topicsWithImages = await Promise.all(
    trendTerms.map(async (t, i) => {
      // Only fetch image for top 4, save budget
      if (!gnewsKey || i >= 4) {
        return { ...t, imageUrl: null, imageCaption: null, newsUrl: null }
      }
      const img = await fetchGNewsImage(t.rawTerm, gnewsKey)
      return { ...t, ...img }
    })
  )

  // Fetch region activity (6 GNews calls, 6 hour cache)
  const regions = await fetchRegionActivity(gnewsKey)

  return NextResponse.json({
    topics: topicsWithImages,
    regions,
    fetchedAt: new Date().toISOString(),
    isLive: !!gnewsKey,
  })
}
