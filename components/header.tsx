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
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [weather, setWeather] = useState<{ temp: string; icon: string } | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

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
      setCurrentTime(
        now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
      )
      setCurrentDate(
        now.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
      )
    }
    update()
    const iv = setInterval(update, 1000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
      setSearchQuery("")
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch(e as any)
    if (e.key === "Escape") { setIsSearchOpen(false); setSearchQuery("") }
  }

  const handleDesktopSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full">

      {/* ── Top utility bar ── */}
      <div className="bg-[#06101C] border-b border-white/[0.07]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-8">

            {/* Left: BREAKING badge + date + clock */}
            <div className="flex items-center gap-0">
              {/* Pulsing live dot */}
              <div className="flex items-center gap-2 pr-4 border-r border-white/[0.08]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#CE1126] opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#CE1126]" />
                </span>
                <span className="text-[#CE1126] text-[10px] font-bold tracking-[0.2em] uppercase">Live</span>
              </div>

              <span className="text-white/35 text-[11px] pl-4 hidden sm:inline" suppressHydrationWarning>
                {currentDate}
              </span>
              <span className="text-white/15 text-[11px] px-2 hidden sm:inline">·</span>
              <span className="text-white/60 font-mono text-[11px] font-semibold tabular-nums tracking-wide" suppressHydrationWarning>
                {currentTime}
              </span>
            </div>

            {/* Right: socials + divider + lang + theme */}
            <div className="flex items-center">
              {/* Social icons */}
              <div className="flex items-center">
                {settings?.facebook && (
                  <a href={settings.facebook} target="_blank" rel="noopener noreferrer"
                    className="group w-8 h-8 flex items-center justify-center">
                    <Facebook className="h-3.5 w-3.5 text-white/25 group-hover:text-[#1877F2] transition-colors duration-200" />
                  </a>
                )}
                {settings?.twitter && (
                  <a href={settings.twitter} target="_blank" rel="noopener noreferrer"
                    className="group w-8 h-8 flex items-center justify-center">
                    <Twitter className="h-3.5 w-3.5 text-white/25 group-hover:text-[#1DA1F2] transition-colors duration-200" />
                  </a>
                )}
                {settings?.youtube && (
                  <a href={settings.youtube} target="_blank" rel="noopener noreferrer"
                    className="group w-8 h-8 flex items-center justify-center">
                    <Youtube className="h-3.5 w-3.5 text-white/25 group-hover:text-[#FF0000] transition-colors duration-200" />
                  </a>
                )}
              </div>

              <div className="w-px h-3 bg-white/[0.1] mx-1" />

              {/* Language */}
              <button suppressHydrationWarning
                onClick={() => setLanguage(language === "EN" ? "FIL" : "EN")}
                className="h-8 px-2.5 text-white/30 hover:text-white text-[10px] font-bold tracking-[0.15em] transition-colors duration-200">
                {language}
              </button>

              {/* Theme */}
              {mounted && (
                <button suppressHydrationWarning
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="w-8 h-8 flex items-center justify-center text-white/25 hover:text-[#FCD116] transition-colors duration-200">
                  {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Masthead / Logo bar ── */}
      <div className="bg-white dark:bg-[#0D1420] border-b border-gray-100 dark:border-white/[0.06]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4 py-3">

            {/* Left: Edition tag — desktop only */}
            <div className="hidden md:flex flex-col items-start gap-0.5 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-[0.2em] text-[#002D72]/40 dark:text-white/25 uppercase">
                  Philippine Edition
                </span>
              </div>
              <div className="h-px w-16 bg-[#CE1126]/30" />
              <span className="text-[9px] text-gray-400 dark:text-white/20 tracking-wide">
                Trusted · Independent · Filipino
              </span>
            </div>

            {/* Center: Logo */}
            <Link href="/" className="flex items-center shrink-0 group mx-auto md:mx-0">
              <div className="relative">
                <Image
                  src="/tinph-logo.png"
                  alt="The Insider News Philippines"
                  width={190}
                  height={76}
                  className="object-contain h-[58px] w-auto drop-shadow-sm group-hover:opacity-90 transition-opacity duration-200"
                  priority
                />
              </div>
            </Link>

            {/* Right: Search + Subscribe */}
            <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
              {/* Search box */}
              <div className="relative group">
                <input
                  suppressHydrationWarning
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={handleDesktopSearch}
                  className="w-48 h-9 px-9 text-[13px] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/25 rounded focus:outline-none focus:border-[#002D72] dark:focus:border-[#FCD116]/50 focus:bg-white dark:focus:bg-white/[0.07] transition-all duration-200"
                />
                <button
                  onClick={() => {
                    if (searchQuery.trim()) router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
                  }}
                  className="absolute left-0 top-0 h-full px-2.5 flex items-center text-gray-350 dark:text-white/30 hover:text-[#002D72] dark:hover:text-white transition-colors"
                >
                  <Search className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Subscribe CTA */}
              <Link href="/newsletter"
                className="inline-flex items-center h-9 bg-[#CE1126] hover:bg-[#a50e1e] text-white text-[11px] font-bold px-5 tracking-[0.12em] uppercase transition-colors duration-200 whitespace-nowrap">
                Subscribe
              </Link>
            </div>

            {/* Mobile controls */}
            <div className="flex items-center gap-1 md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(v => !v)}
                className="text-gray-500 dark:text-gray-400 h-9 w-9">
                {isSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-400 h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] bg-white dark:bg-[#0D1420] border-gray-100 dark:border-white/[0.06]">
                  <div className="flex flex-col gap-1 mt-8">
                    <Link href="/" className="mb-6 flex justify-center">
                      <Image src="/tinph-logo.png" alt="The Insider News Philippines" width={150} height={60} className="object-contain" />
                    </Link>
                    {categories.map(cat => (
                      <Link key={cat.slug} href={`/category/${cat.slug}`}
                        className="text-gray-700 dark:text-gray-300 hover:text-[#CE1126] py-2.5 px-3 border-b border-gray-100 dark:border-white/[0.05] text-sm transition-colors font-medium">
                        {getCategoryName(cat.slug, language)}
                      </Link>
                    ))}
                    <Link href="/admin" className="text-[#CE1126] hover:text-[#002D72] py-2 px-3 mt-4 text-sm font-bold">
                      Admin Panel
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Mobile search */}
          {isSearchOpen && (
            <div className="pb-3 md:hidden">
              <form onSubmit={handleSearch} className="relative">
                <input
                  ref={searchInputRef}
                  suppressHydrationWarning
                  type="text"
                  placeholder="Search news..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-800 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#002D72] rounded"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#002D72]">
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation bar ── */}
      <nav className="bg-[#002D72] hidden md:block shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center">
            {categories.map(cat => (
              <Link key={cat.slug} href={`/category/${cat.slug}`}
                className="relative px-4 py-2.5 text-[12px] font-bold text-white/70 hover:text-white tracking-[0.08em] uppercase transition-colors duration-150 group">
                {getCategoryName(cat.slug, language)}
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FCD116] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center" />
              </Link>
            ))}
          </div>
        </div>
      </nav>

    </header>
  )
}
