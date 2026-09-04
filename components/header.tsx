"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Menu, Search, X, Moon, Sun, Facebook, Youtube, Twitter } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { categories } from "@/lib/mock-data"
import { useLanguage, getCategoryName } from "@/lib/language-context"
import { getSiteSettings, type SiteSettings } from "@/components/footer"

export function Header() {
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState<string>("")
  const [currentDate, setCurrentDate] = useState<string>("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [city, setCity] = useState("Loading...")
  const [weather, setWeather] = useState("?? --�C")

  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSettings(getSiteSettings())
    const handler = () => setSettings(getSiteSettings())
    window.addEventListener("tinph_settings_updated", handler)
    return () => window.removeEventListener("tinph_settings_updated", handler)
  }, [])

  useEffect(() => {
    setMounted(true)
    const update = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }))
      setCurrentDate(now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }))
    }
    update()
    const iv = setInterval(update, 1000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    async function fetchLocation() {
      try {
        const locRes = await fetch("https://get.geojs.io/v1/ip/geo.json");
        if (!locRes.ok) return;
        const loc = await locRes.json();
        if (loc.city) setCity(loc.city);
        if (loc.latitude && loc.longitude) {
          const weatherRes = await fetch("https://api.open-meteo.com/v1/forecast?latitude=" + loc.latitude + "&longitude=" + loc.longitude + "&current_weather=true");
          if (weatherRes.ok) {
            const w = await weatherRes.json();
            const code = w.current_weather.weathercode;
            const temp = w.current_weather.temperature;
            let emoji = "☀️";
            if (code === 1 || code === 2) emoji = "⛅";
            else if (code === 3) emoji = "☁️";
            else if (code >= 45 && code <= 48) emoji = "🌫️";
            else if (code >= 51 && code <= 67) emoji = "🌧️";
            else if (code >= 71 && code <= 86) emoji = "❄️";
            else if (code >= 95) emoji = "⛈️";
            setWeather(emoji + " " + temp + "°C");
          }
        }
      } catch (e) {
        setCity("Unknown");
      }
    }
    fetchLocation();
  }, [])

  useEffect(() => {
    if (isSearchOpen) searchRef.current?.focus()
  }, [isSearchOpen])

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
      setSearchQuery("")
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-[#0f172a]">
      
      {/* ── TOP PILL BAR ── */}
      <div className="container mx-auto px-4 pt-4 pb-2">
        <div className="bg-[#1f2937] text-white rounded-[10px] shadow-lg shadow-black/10">
          <div className="flex flex-col md:flex-row items-center justify-between min-h-[40px] px-6 py-2 gap-2 text-[10px] sm:text-[11px] font-sans tracking-wide">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 justify-center">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">Date</span>
                <span className="font-bold" suppressHydrationWarning>{currentDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">Time</span>
                <span className="font-bold" suppressHydrationWarning>{currentTime}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">City</span>
                <span className="font-bold">{city}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">Weather</span>
                <span className="font-bold">☀️ 29.9°C</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="font-bold text-gray-300">USD <span className="text-white">P62.54</span></div>
              <div className="font-bold text-gray-300">EUR <span className="text-white">€0.86</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── LOGO SECTION ── */}
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex justify-center items-center relative">
          <Link href="/" className="inline-block group">
            <Image
              src="/tinph-logo-v2.png"
              alt="The Insider News Philippines"
              width={120}
              height={120}
              priority
              className="object-contain group-hover:opacity-90 transition-opacity"
            />
          </Link>
          
          {/* Mobile menu toggle (placed here to keep it accessible) */}
          <div className="absolute right-0 md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-300">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] bg-white dark:bg-[#0f172a]">
                <div className="flex flex-col gap-1 mt-8">
                  <div className="mb-6 flex justify-center">
                    <Image src="/tinph-logo-v2.png" alt="Logo" width={120} height={40} className="object-contain" />
                  </div>
                  {categories.map(cat => (
                    <Link key={cat.slug} href={`/category/${cat.slug}`}
                      className="text-gray-700 dark:text-gray-300 hover:text-[#f59e0b] py-2.5 px-3 border-b border-gray-100 dark:border-white/10 text-sm font-bold font-sans">
                      {getCategoryName(cat.slug, language)}
                    </Link>
                  ))}
                  <div className="mt-4 px-3">
                    <form onSubmit={handleSearch} className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#f59e0b]" />
                    </form>
                  </div>
                  <Link href="/admin" className="text-[#f59e0b] py-2.5 px-3 mt-4 text-sm font-bold font-sans">Admin Panel</Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* ── NAV BAR ── */}
      <nav className="bg-[#002D72] hidden md:block border-y border-[#001a50]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center relative min-h-[48px]">
            <div className="flex flex-wrap items-center justify-center gap-x-2 py-1">
              {categories.map(cat => (
                <Link key={cat.slug} href={`/category/${cat.slug}`}
                  className="px-3 py-2 text-[11px] font-black text-white hover:bg-white/10 transition-colors uppercase font-sans whitespace-nowrap flex items-center gap-1.5 tracking-wide">
                  {getCategoryName(cat.slug, language)}
                  <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>
              ))}
            </div>
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
              <div className="relative group">
                <button 
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  {isSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                </button>
                {isSearchOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white shadow-xl rounded-md overflow-hidden border border-gray-100 p-2 z-50">
                    <form onSubmit={handleSearch} className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input ref={searchRef} type="text" placeholder="Search news..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded text-black focus:outline-none focus:border-[#fbbd23]" />
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
