import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { NewsletterSection } from "@/components/newsletter-section"
import { BackToTop } from "@/components/back-to-top"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"

export const metadata: Metadata = {
  title: "Subscribe to Our Newsletter — The Insider News Philippines",
  description: "Get breaking Philippine news and a daily digest delivered straight to your inbox.",
}

export default function NewsletterPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pb-20 md:pb-0">
        <section className="container mx-auto px-4 py-10 text-center max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
            Never Miss a Story
          </h1>
          <p className="text-muted-foreground">
            Join readers across the Philippines getting breaking news, daily digests,
            and in-depth coverage delivered straight to their inbox.
          </p>
        </section>

        <NewsletterSection />
      </main>

      <Footer />
      <BackToTop />
      <MobileBottomNav />
    </div>
  )
}
