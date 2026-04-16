"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, Search, X, Moon, Sun, Facebook, Youtube, Twitter } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { categories } from "@/lib/mock-data"
import { useLanguage, getCategoryName } from "@/lib/language-context"
import { getSiteSettings, type SiteSettings } from "@/components/footer"

export function Header() {
  const [currentTime, setCurrentTime] = useState<string>("")
  const [currentDate, setCurrentDate] = useState<string>("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [settings, setSettings] = useState<SiteSettings | null>(null)

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

  return (
    <header className="sticky top-0 z-50 w-full">

      {/* ── Thin top red stripe with date/socials ── */}
      <div className="bg-[#CE1126] h-8 flex items-center">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-white/90 text-[11px] font-medium tracking-wide hidden sm:inline" suppressHydrationWarning>
              {currentDate}
            </span>
            <span className="text-white font-mono text-[11px] font-bold tracking-widest" suppressHydrationWarning>
              {currentTime}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {settings?.facebook && (
              <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors rounded">
                <Facebook className="h-3.5 w-3.5" />
              </a>
            )}
            {settings?.twitter && (
              <a href={settings.twitter} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors rounded">
                <Twitter className="h-3.5 w-3.5" />
              </a>
            )}
            {settings?.youtube && (
              <a href={settings.youtube} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors rounded">
                <Youtube className="h-3.5 w-3.5" />
              </a>
            )}
            <div className="w-px h-3 bg-white/30 mx-1" />
            <button suppressHydrationWarning onClick={() => setLanguage(language === "EN" ? "FIL" : "EN")}
              className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white text-[11px] font-semibold tracking-wider transition-colors rounded">
              {language === "EN" ? "EN" : "FIL"}
            </button>
            {mounted && (
              <button suppressHydrationWarning onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors rounded">
                {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main white header bar ── */}
      <div className="bg-white dark:bg-[#0f172a] border-b-2 border-[#002D72] shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-[70px] gap-6">

            {/* LEFT: vertical rule + tagline stack */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
              <div className="flex flex-col gap-[3px]">
                <div className="w-6 h-[2px] bg-[#CE1126]" />
                <div className="w-4 h-[2px] bg-[#002D72]" />
                <div className="w-6 h-[2px] bg-[#CE1126]" />
              </div>
              <div>
                <p className="text-[#002D72] dark:text-blue-300 text-[10px] font-bold tracking-[0.18em] uppercase">Est. 2024</p>
                <p className="text-gray-400 dark:text-gray-500 text-[9px] tracking-[0.12em] uppercase font-light">The Truth, Direct from the Source.</p>
              </div>
            </div>

            {/* CENTER: Logo — bold, prominent */}
            <Link href="/" className="flex items-center shrink-0 mx-auto lg:mx-0 group">
              <Image
                src="/tinph-logo.png"
                alt="The Insider News Philippines"
                width={180}
                height={72}
                className="object-contain h-[56px] w-auto drop-shadow-sm group-hover:opacity-90 transition-opacity"
                priority
              />
            </Link>

            {/* RIGHT: search + subscribe */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              {/* Search — rectangular, sharp, newspaper-style */}
              <div className="relative">
                <input
                  suppressHydrationWarning
                  type="text"
                  placeholder="Search news..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-52 px-4 py-1.5 pl-9 rounded-none border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#002D72] focus:ring-0 transition-colors"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              </div>
              {/* Subscribe — navy rectangular button */}
              <Link href="/newsletter"
                className="bg-[#002D72] hover:bg-[#001a4a] text-white text-xs font-bold px-4 py-2 tracking-wider uppercase transition-colors whitespace-nowrap rounded-none">
                Subscribe
              </Link>
            </div>

            {/* Mobile controls */}
            <div className="flex items-center gap-1 md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(v => !v)}
                className="text-gray-600 dark:text-gray-300 h-8 w-8">
                {isSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-300 h-8 w-8">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] bg-white dark:bg-[#0f172a] border-gray-200 dark:border-[#002D72]">
                  <div className="flex flex-col gap-1 mt-8">
                    <Link href="/" className="mb-5 flex justify-center">
                      <Image src="/tinph-logo.png" alt="The Insider News Philippines" width={150} height={60} className="object-contain" />
                    </Link>
                    {categories.map((cat) => (
                      <Link key={cat.slug} href={`/category/${cat.slug}`}
                        className="text-gray-700 dark:text-gray-300 hover:text-[#CE1126] py-2 px-3 border-b border-gray-100 dark:border-white/10 text-sm transition-colors font-medium">
                        {getCategoryName(cat.slug, language)}
                      </Link>
                    ))}
                    <Link href="/admin" className="text-[#CE1126] hover:text-[#002D72] py-2 px-3 mt-4 text-sm font-bold">Admin Panel</Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Mobile search */}
          {isSearchOpen && (
            <div className="pb-3 md:hidden">
              <input suppressHydrationWarning type="text" placeholder="Search news..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#002D72] rounded-none" />
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="bg-[#002D72] hidden md:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center">
            {categories.map((cat) => (
              <Link key={cat.slug} href={`/category/${cat.slug}`}
                className="px-4 py-2.5 text-[13px] font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors border-b-2 border-transparent hover:border-[#FCD116] tracking-wide uppercase">
                {getCategoryName(cat.slug, language)}
              </Link>
            ))}
          </div>
        </div>
      </nav>

    </header>
  )
}
