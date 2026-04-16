"use client"

import { createContext, useContext, useState, ReactNode } from "react"

type Language = "EN" | "FIL"

interface Translations {
  home: string
  search: string
  searchNews: string
  adminPanel: string
  nation: string
  regions: string
  feature: string
  metro: string
  business: string
  entertainment: string
  international: string
  tourism: string
  breakingNews: string
  latestNews: string
  trendingNow: string
  mostRead: string
  hotTopics: string
  viewAll: string
  readMore: string
  hoursAgo: string
  minutesAgo: string
  daysAgo: string
  stayUpdated: string
  newsletterDesc: string
  enterEmail: string
  subscribe: string
  aboutUs: string
  contactUs: string
  privacyPolicy: string
  termsOfService: string
  allRightsReserved: string
  views: string
  shares: string
  comments: string
  loadMore: string
  noResults: string
}

const translations: Record<Language, Translations> = {
  EN: {
    home: "Home", search: "Search", searchNews: "Search news...", adminPanel: "Admin Panel",
    nation: "Nation", regions: "Regions", feature: "Feature", metro: "Metro",
    business: "Business", entertainment: "Entertainment", international: "International", tourism: "Tourism",
    breakingNews: "Breaking News", latestNews: "Latest News", trendingNow: "Trending Now",
    mostRead: "Most Read", hotTopics: "Hot Topics", viewAll: "View All", readMore: "Read More",
    hoursAgo: "hours ago", minutesAgo: "minutes ago", daysAgo: "days ago",
    stayUpdated: "Stay Updated",
    newsletterDesc: "Subscribe to our newsletter and never miss the latest news from the Philippines.",
    enterEmail: "Enter your email", subscribe: "Subscribe",
    aboutUs: "About Us", contactUs: "Contact Us", privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service", allRightsReserved: "All Rights Reserved",
    views: "views", shares: "shares", comments: "comments", loadMore: "Load More", noResults: "No results found",
  },
  FIL: {
    home: "Tahanan", search: "Maghanap", searchNews: "Maghanap ng balita...", adminPanel: "Panel ng Admin",
    nation: "Bansa", regions: "Rehiyon", feature: "Tampok", metro: "Metro",
    business: "Negosyo", entertainment: "Aliwan", international: "Internasyonal", tourism: "Turismo",
    breakingNews: "Balitang Pambansa", latestNews: "Pinakabagong Balita", trendingNow: "Trending Ngayon",
    mostRead: "Pinakamabasa", hotTopics: "Mainit na Paksa", viewAll: "Tingnan Lahat", readMore: "Magbasa Pa",
    hoursAgo: "oras ang nakakaraan", minutesAgo: "minuto ang nakakaraan", daysAgo: "araw ang nakakaraan",
    stayUpdated: "Manatiling Updated",
    newsletterDesc: "Mag-subscribe sa aming newsletter at huwag palampasin ang pinakabagong balita.",
    enterEmail: "Ilagay ang iyong email", subscribe: "Mag-subscribe",
    aboutUs: "Tungkol sa Amin", contactUs: "Makipag-ugnayan", privacyPolicy: "Patakaran sa Privacy",
    termsOfService: "Mga Tuntunin ng Serbisyo", allRightsReserved: "Lahat ng Karapatan ay Nakalaan",
    views: "mga tanawin", shares: "mga ibahagi", comments: "mga komento",
    loadMore: "Magdagdag Pa", noResults: "Walang nakitang resulta",
  },
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("EN")
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) throw new Error("useLanguage must be used within a LanguageProvider")
  return context
}

export function getCategoryName(category: string, language: Language): string {
  const categoryMap: Record<string, Record<Language, string>> = {
    nation: { EN: "Nation", FIL: "Bansa" },
    regions: { EN: "Regions", FIL: "Rehiyon" },
    feature: { EN: "Feature", FIL: "Tampok" },
    metro: { EN: "Metro", FIL: "Metro" },
    business: { EN: "Business", FIL: "Negosyo" },
    entertainment: { EN: "Entertainment", FIL: "Aliwan" },
    international: { EN: "International", FIL: "Internasyonal" },
    tourism: { EN: "Tourism", FIL: "Turismo" },
  }
  return categoryMap[category.toLowerCase()]?.[language] || category
}
