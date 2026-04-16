"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Facebook, Twitter, Youtube, Instagram, Linkedin, Globe } from "lucide-react"
import { categories } from "@/lib/mock-data"

export interface SiteSettings {
  facebook: string
  twitter: string
  youtube: string
  instagram: string
  linkedin: string
  website: string
  email: string
  phone: string
  address: string
  tagline: string
}

export const defaultSettings: SiteSettings = {
  facebook: "https://facebook.com",
  twitter: "https://twitter.com",
  youtube: "https://youtube.com",
  instagram: "https://instagram.com",
  linkedin: "",
  website: "",
  email: "news@insidernewsph.com",
  phone: "+63 (2) 8888-1234",
  address: "Manila, Philippines",
  tagline: "The Truth, Direct from the Source.",
}

export function getSiteSettings(): SiteSettings {
  try {
    const raw = localStorage.getItem("tinph_site_settings")
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) }
  } catch {}
  return defaultSettings
}

export function saveSiteSettings(s: SiteSettings) {
  localStorage.setItem("tinph_site_settings", JSON.stringify(s))
}

const SOCIAL_ICONS = [
  { key: "facebook" as const,  Icon: Facebook,  color: "hover:text-[#1877F2]" },
  { key: "twitter" as const,   Icon: Twitter,   color: "hover:text-sky-400" },
  { key: "youtube" as const,   Icon: Youtube,   color: "hover:text-red-500" },
  { key: "instagram" as const, Icon: Instagram, color: "hover:text-pink-400" },
  { key: "linkedin" as const,  Icon: Linkedin,  color: "hover:text-blue-400" },
  { key: "website" as const,   Icon: Globe,     color: "hover:text-[#FCD116]" },
]

export function Footer() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings)

  useEffect(() => {
    setSettings(getSiteSettings())
    // Listen for settings changes from admin
    const handler = () => setSettings(getSiteSettings())
    window.addEventListener("tinph_settings_updated", handler)
    return () => window.removeEventListener("tinph_settings_updated", handler)
  }, [])

  return (
    <footer className="bg-[#0A1628] text-white">
      <div className="h-[3px] bg-gradient-to-r from-[#CE1126] via-[#FCD116] to-[#CE1126]" />
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-start mb-4">
              <Image src="/tinph-logo.png" alt="The Insider News Philippines" width={160} height={65} className="object-contain" />
            </Link>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">{settings.tagline}</p>
            <div className="flex gap-3 flex-wrap">
              {SOCIAL_ICONS.map(({ key, Icon, color }) =>
                settings[key] ? (
                  <a key={key} href={settings[key]} target="_blank" rel="noopener noreferrer"
                    className={`text-gray-500 transition-colors ${color}`}>
                    <Icon className="h-4 w-4" />
                  </a>
                ) : null
              )}
            </div>
          </div>

          {/* Sections */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-[#FCD116] uppercase tracking-wider">Sections</h4>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.name}>
                  <Link href={`/category/${cat.slug}`} className="text-gray-400 hover:text-white transition-colors text-sm">{cat.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-[#FCD116] uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2">
              {[["About Us", "/about"], ["Contact", "/contact"], ["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"], ["Admin Panel", "/admin"]].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-gray-400 hover:text-white transition-colors text-sm">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-[#FCD116] uppercase tracking-wider">Contact</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              {settings.address && <li>{settings.address}</li>}
              {settings.email && <li><a href={`mailto:${settings.email}`} className="hover:text-white transition-colors">{settings.email}</a></li>}
              {settings.phone && <li>{settings.phone}</li>}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-gray-500 text-xs">&copy; {new Date().getFullYear()} The Insider News Philippines. All rights reserved.</p>
          <p className="text-gray-600 text-xs">{settings.tagline}</p>
        </div>
      </div>
    </footer>
  )
}
