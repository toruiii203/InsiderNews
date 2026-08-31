export const runtime = 'edge'

import { Metadata } from "next"
import Image from "next/image"
import { Mail } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BackToTop } from "@/components/back-to-top"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { supabaseAdmin } from "@/lib/supabase"

interface AboutContent {
  id: number
  heading: string
  mission: string
  story: string
}

interface StaffMember {
  id: string
  name: string
  role: string
  bio: string
  photo_url: string
  email: string
  display_order: number
}

async function getAboutContent(): Promise<AboutContent | null> {
  try {
    const { data, error } = await supabaseAdmin.from("about_content").select("*").eq("id", 1).single()
    if (error) return null
    return data
  } catch {
    return null
  }
}

async function getStaff(): Promise<StaffMember[]> {
  try {
    const { data, error } = await supabaseAdmin.from("staff").select("*").order("display_order", { ascending: true })
    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

export const metadata: Metadata = {
  title: "About Us - The Insider News Philippines",
  description: "Learn about The Insider News Philippines — our mission, our story, and the team behind the news.",
}

export default async function AboutPage() {
  const [about, staff] = await Promise.all([getAboutContent(), getStaff()])

  const heading = about?.heading ?? "About The Insider News Philippines"
  const mission = about?.mission ?? ""
  const story = about?.story ?? ""

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 pb-20 md:pb-12 max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">{heading}</h1>
          {mission && (
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">{mission}</p>
          )}
        </div>

        {story && (
          <div className="prose prose-lg max-w-none mb-16 text-foreground leading-relaxed">
            {story.split(/\r?\n\s*\r?\n/).filter(Boolean).map((para, i) => (
              <p key={i}>{para.trim()}</p>
            ))}
          </div>
        )}

        {staff.length > 0 && (
          <section id="team">
            <h2 className="text-2xl font-serif font-bold text-foreground mb-2 text-center">Our Writers & Staff</h2>
            <p className="text-muted-foreground text-center mb-10">The people behind every story.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {staff.map(member => (
                <div key={member.id} className="flex flex-col items-center text-center p-6 rounded-xl border border-border bg-card">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted mb-4">
                    {member.photo_url ? (
                      <Image src={member.photo_url} alt={member.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#002D72] text-white text-2xl font-bold">
                        {member.name[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="font-serif font-bold text-foreground">{member.name}</h3>
                  <p className="text-sm text-[#CE1126] font-medium mb-2">{member.role}</p>
                  {member.bio && <p className="text-sm text-muted-foreground leading-relaxed mb-2">{member.bio}</p>}
                  {member.email && (
                    <a href={`mailto:${member.email}`} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />{member.email}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
      <BackToTop />
      <MobileBottomNav />
    </div>
  )
}
