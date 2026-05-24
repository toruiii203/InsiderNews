"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
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
      setCurrentTime(now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }))
      setCurrentDate(now.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" }))
    }
    update()
    const iv = setInterval(update, 1000)
    return () => clearInterval(iv)
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
    <header className="sticky top-0 z-50 w-full">

      {/* ── UTILITY BAR ── */}
      <div className="bg-[#0d1f45] border-b border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-9">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CE1126] animate-pulse" />
                <span className="text-[#FCD116] text-[10px] font-black tracking-[0.25em] uppercase font-sans">Live</span>
              </div>
              <div className="w-px h-3 bg-white/20" />
              <span className="text-white/50 text-[11px] font-sans hidden sm:inline" suppressHydrationWarning>{currentDate}</span>
              <span className="text-white/80 font-mono text-[11px] font-bold tracking-widest tabular-nums" suppressHydrationWarning>{currentTime}</span>
            </div>
            <div className="flex items-center">
              {settings?.facebook && (
                <a href={settings.facebook} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-9 flex items-center justify-center text-white/40 hover:text-[#FCD116] transition-colors">
                  <Facebook className="h-3 w-3" />
                </a>
              )}
              {settings?.twitter && (
                <a href={settings.twitter} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-9 flex items-center justify-center text-white/40 hover:text-[#FCD116] transition-colors">
                  <Twitter className="h-3 w-3" />
                </a>
              )}
              {settings?.youtube && (
                <a href={settings.youtube} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-9 flex items-center justify-center text-white/40 hover:text-[#FCD116] transition-colors">
                  <Youtube className="h-3 w-3" />
                </a>
              )}
              <div className="w-px h-3 bg-white/20 mx-1" />
              <button suppressHydrationWarning onClick={() => setLanguage(language === "EN" ? "FIL" : "EN")}
                className="px-2.5 h-9 text-white/50 hover:text-[#FCD116] text-[10px] font-black tracking-widest font-sans transition-colors">
                {language}
              </button>
              {mounted && (
                <button suppressHydrationWarning onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="w-8 h-9 flex items-center justify-center text-white/40 hover:text-[#FCD116] transition-colors">
                  {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MASTHEAD — exactly like the logo ── */}
      <Link href="/" className="block group">
        {/* Blue band — THE INSIDER NEWS */}
        <div className="bg-[#1e3a72] dark:bg-[#122448]" style={{ height: "72px" }}>
          <div className="h-full flex items-center justify-center">
            <span
              className="text-white font-serif font-bold leading-none select-none group-hover:opacity-90 transition-opacity"
              style={{ fontSize: "clamp(28px, 5vw, 58px)", letterSpacing: "-0.01em" }}
            >
              THE INSIDER NEWS
            </span>
          </div>
        </div>

        {/* Red band — PHILIPPINES */}
        <div className="bg-[#B5293A] dark:bg-[#8f1e2b]" style={{ height: "52px" }}>
          <div className="h-full flex items-center justify-center">
            <span
              className="text-[#B5293A] dark:text-[#8f1e2b] font-serif font-bold leading-none select-none group-hover:opacity-90 transition-opacity"
              style={{
                fontSize: "clamp(18px, 3vw, 36px)",
                letterSpacing: "0.18em",
                WebkitTextStroke: "1px rgba(255,255,255,0.9)",
                color: "transparent",
              }}
            >
              PHILIPPINES
            </span>
          </div>
        </div>
      </Link>

      {/* ── CONTROLS BAR — search + subscribe, sits right below masthead ── */}
      <div className="bg-white dark:bg-[#0f172a] border-b border-[#002D72]/15 dark:border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-11">

            {/* Desktop search */}
            <div className="hidden md:flex items-center flex-1">
              <div className="relative group">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300 dark:text-white/20 group-focus-within:text-[#B5293A] transition-colors" />
                <input
                  suppressHydrationWarning
                  type="text"
                  placeholder="Search news..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  className="w-52 pl-6 pr-3 py-1 text-sm bg-transparent border-0 border-b border-gray-200 dark:border-white/10 text-gray-700 dark:text-white placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:border-[#B5293A] transition-colors font-sans"
                />
              </div>
            </div>

            <div className="flex-1 hidden md:block" />

            <Link
              href="/newsletter"
              className="hidden md:inline-flex items-center bg-[#B5293A] hover:bg-[#8f1e2b] text-white text-[10px] font-black px-5 py-2 tracking-[0.2em] uppercase font-sans transition-colors"
            >
              Subscribe
            </Link>

            {/* Mobile controls */}
            <div className="flex items-center gap-1 md:hidden w-full justify-between">
              <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(v => !v)}
                className="h-9 w-9 text-gray-600 dark:text-gray-300">
                {isSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              </Button>
              <Link href="/newsletter"
                className="bg-[#B5293A] text-white text-[10px] font-black px-4 py-1.5 tracking-widest uppercase font-sans">
                Subscribe
              </Link>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-600 dark:text-gray-300">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] bg-white dark:bg-[#0f172a]">
                  <div className="flex flex-col gap-1 mt-8">
                    <div className="mb-6">
                      <div className="bg-[#1e3a72] px-4 py-3 text-center">
                        <p className="text-white font-serif font-bold text-xl tracking-tight">THE INSIDER NEWS</p>
                      </div>
                      <div className="bg-[#B5293A] px-4 py-2 text-center">
                        <p className="text-white font-serif font-bold text-sm tracking-[0.18em]">PHILIPPINES</p>
                      </div>
                    </div>
                    {categories.map(cat => (
                      <Link key={cat.slug} href={`/category/${cat.slug}`}
                        className="text-gray-700 dark:text-gray-300 hover:text-[#B5293A] py-2.5 px-3 border-b border-gray-100 dark:border-white/10 text-sm transition-colors font-medium font-sans">
                        {getCategoryName(cat.slug, language)}
                      </Link>
                    ))}
                    <Link href="/admin" className="text-[#B5293A] py-2.5 px-3 mt-4 text-sm font-bold font-sans">Admin Panel</Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Mobile search */}
          {isSearchOpen && (
            <div className="pb-3 md:hidden">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input ref={searchRef} suppressHydrationWarning type="text"
                  placeholder="Search news..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#B5293A] font-sans" />
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ── NAV BAR ── */}
      <nav className="bg-[#002D72] hidden md:block">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center">
            {categories.map(cat => (
              <Link key={cat.slug} href={`/category/${cat.slug}`}
                className="px-5 py-3 text-[12px] font-bold text-white/70 hover:text-white hover:bg-white/10 transition-all border-b-2 border-transparent hover:border-[#FCD116] tracking-[0.12em] uppercase font-sans whitespace-nowrap">
                {getCategoryName(cat.slug, language)}
              </Link>
            ))}
          </div>
        </div>
      </nav>

    </header>
  )
}
