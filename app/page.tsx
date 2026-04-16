import { Header } from "@/components/header"
import { StockTicker } from "@/components/stock-ticker"
import { BreakingNewsTicker } from "@/components/breaking-news-ticker"
import { HeroCarousel } from "@/components/hero-carousel"
import { LatestNewsFeed } from "@/components/latest-news-feed"
import { SidebarContent } from "@/components/sidebar-content"
import { TrendingTopics } from "@/components/trending-topics"
import { VideoSection } from "@/components/video-section"
import { PhPulse } from "@/components/ph-pulse"
import { PhotoGallery } from "@/components/photo-gallery"
import { CategorySections } from "@/components/category-sections"
import { NewsletterSection } from "@/components/newsletter-section"
import { Footer } from "@/components/footer"
import { BackToTop } from "@/components/back-to-top"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { CurrencyCalculator } from "@/components/currency-calculator"
import { AiNewsChatbot } from "@/components/ai-news-chatbot"
import { WeatherWidget } from "@/components/weather-widget"
import { ThemeSwitcher } from "@/components/theme-switcher"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <StockTicker />
      <BreakingNewsTicker />

      <main className="pb-20 md:pb-0">
        <section className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-8 space-y-6">
              <HeroCarousel />
              <LatestNewsFeed />
            </div>

            {/* Sidebar — hidden on mobile, visible on lg+ */}
            <div className="hidden lg:block lg:col-span-4">
              <div className="lg:sticky lg:top-4 space-y-5">
                <WeatherWidget />
                <ThemeSwitcher />
                <CurrencyCalculator />
                <SidebarContent />
              </div>
            </div>
          </div>
        </section>

        <TrendingTopics />

        <section className="container mx-auto px-4 py-6">
          <VideoSection />
        </section>

        <PhPulse />

        <section className="container mx-auto px-4 py-6">
          <PhotoGallery />
        </section>

        <section className="container mx-auto px-4">
          <CategorySections />
        </section>

        <NewsletterSection />
      </main>

      <Footer />
      <BackToTop />
      <MobileBottomNav />
      <AiNewsChatbot />
    </div>
  )
}
