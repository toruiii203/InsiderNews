"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  LayoutDashboard, FileText, Video, Users, LogOut, Plus, Menu, X, Eye,
  TrendingUp, Newspaper, UserCog, ShieldCheck, Settings2,
  Facebook, Twitter, Youtube, Instagram, Linkedin, Globe, Mail, Phone, MapPin, Save,
  Info, AlertCircle, Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArticlesTab } from "@/components/admin/articles-tab"
import { VideosTab } from "@/components/admin/videos-tab"
import { SubscribersTab } from "@/components/admin/subscribers-tab"
import { AboutTab } from "@/components/admin/about-tab"
import { type AdminUser, PRIMARY_ADMIN_PROFILE } from "@/lib/admin-accounts"
import { getSiteSettings, saveSiteSettings, type SiteSettings } from "@/components/footer"

interface AdminDashboardProps {
  onLogout: () => void
  currentUser: AdminUser
}

type TabType = "dashboard" | "articles" | "videos" | "subscribers" | "accounts" | "settings" | "about"

const ROLE_LABELS: Record<AdminUser["role"], string> = {
  superadmin: "Super Admin",
  editor: "Editor",
  reporter: "Reporter",
}
const ROLE_COLORS: Record<AdminUser["role"], string> = {
  superadmin: "bg-[#FCD116] text-[#002D72]",
  editor: "bg-[#002D72] text-white",
  reporter: "bg-emerald-600 text-white",
}

export function AdminDashboard({ onLogout, currentUser }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [articles, setArticles] = useState<any[]>([])
  const [subscribersCount, setSubscribersCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [artRes, subRes] = await Promise.all([
          fetch("/api/articles/all"),
          fetch("/api/subscribe"),
        ])
        if (artRes.ok) {
          const artData = await artRes.json()
          setArticles(artData.articles || [])
        }
        if (subRes.ok) {
          const subData = await subRes.json()
          setSubscribersCount(subData.count ?? (subData.subscribers?.length || 0))
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  const totalViews = articles.reduce((s, a) => s + (Number(a.view_count) || 0), 0)
  const breakingCount = articles.filter(a => a.is_breaking).length
  const isSuperAdmin = currentUser.role === "superadmin"

  const navItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "articles" as const, label: "Articles", icon: FileText },
    { id: "videos" as const, label: "Videos", icon: Video },
    { id: "subscribers" as const, label: "Subscribers", icon: Users },
    { id: "about" as const, label: "About Us", icon: Info },
    ...(isSuperAdmin ? [{ id: "accounts" as const, label: "Manage Accounts", icon: UserCog }] : []),
    { id: "settings" as const, label: "Site Settings", icon: Settings2 },
  ]

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-white/10">
        <Link href="/" className="flex items-center">
          <Image src="/tinph-logo-v2.png" alt="The Insider News Philippines" width={150} height={60} className="object-contain" />
        </Link>
      </div>
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#002D72] flex items-center justify-center text-white font-bold text-sm shrink-0">
            {currentUser.displayName[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{currentUser.displayName}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${ROLE_COLORS[currentUser.role]}`}>
              {ROLE_LABELS[currentUser.role]}
            </span>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button suppressHydrationWarning
                onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                  activeTab === item.id ? "bg-[#002D72] text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-3 border-t border-white/10">
        <Button variant="ghost" onClick={onLogout} className="w-full text-gray-400 hover:text-white hover:bg-white/10 justify-start text-sm">
          <LogOut className="h-4 w-4 mr-3" />Sign Out
        </Button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 bg-[#0A1628] text-white flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0A1628] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Image src="/tinph-logo-v2.png" alt="The Insider News Philippines" width={130} height={50} className="object-contain" />
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(v => !v)} className="text-white h-8 w-8">
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-[#0A1628] flex flex-col pt-14">
          <SidebarContent />
        </div>
      )}

      {/* Main */}
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 overflow-auto">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-serif font-bold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {currentUser.displayName}</p>
              </div>
              <Button onClick={() => setActiveTab("articles")} className="bg-[#CE1126] hover:bg-[#CE1126]/90 text-white">
                <Plus className="h-4 w-4 mr-2" />New Article
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Articles", value: loading ? "..." : articles.length, sub: "Live Neon database", icon: Newspaper, color: "text-[#002D72]" },
                { label: "Total Views", value: loading ? "..." : totalViews.toLocaleString(), sub: "Tracked article views", icon: Eye, color: "text-[#CE1126]" },
                { label: "Breaking News", value: loading ? "..." : breakingCount, sub: "Active stories", icon: TrendingUp, color: "text-[#FCD116]" },
                { label: "Subscribers", value: loading ? "..." : subscribersCount.toLocaleString(), sub: "Registered readers", icon: Users, color: "text-emerald-500" },
              ].map(({ label, value, sub, icon: Icon, color }) => (
                <Card key={label}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{value}</div>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader><CardTitle>Recent Articles</CardTitle></CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">Loading articles from Neon...</div>
                ) : articles.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-lg">
                    No articles found in the database. Use &quot;New Article&quot; above to create your first story.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {articles.slice(0, 5).map((article) => (
                      <div key={article.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-sm truncate">{article.title}</h3>
                          <p className="text-xs text-muted-foreground">{article.category} · {article.author}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{Number(article.view_count || 0).toLocaleString()}</span>
                          {article.is_breaking && <span className="px-2 py-0.5 bg-[#CE1126] text-white rounded font-bold">BREAKING</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "articles" && <ArticlesTab />}
        {activeTab === "videos" && <VideosTab />}
        {activeTab === "subscribers" && <SubscribersTab />}
        {activeTab === "about" && <AboutTab />}
        {activeTab === "accounts" && isSuperAdmin && <AccountsTab currentUser={currentUser} />}
        {activeTab === "settings" && <SiteSettingsTab />}
      </main>
    </div>
  )
}

// ── Secure Server-Managed Accounts Tab ──────────────────────────────────────────
function AccountsTab({ currentUser }: { currentUser: AdminUser }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-[#002D72]" />Manage Accounts
          </h1>
          <p className="text-sm text-muted-foreground">Server-authenticated administrator sessions and role permissions</p>
        </div>
      </div>

      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-lg text-sm flex items-start gap-3">
        <Lock className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Server-Side Session Security Active</p>
          <p className="text-xs mt-1 text-emerald-700 dark:text-emerald-400">
            Client-side localStorage storage of passwords has been permanently deprecated.
            All administrative privileges are authorized via cryptographically signed HTTP-only cookies verified against server secrets (`ADMIN_SECRET`).
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Administrator Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border">
            <div className="w-12 h-12 rounded-full bg-[#002D72] flex items-center justify-center text-white font-bold text-base shrink-0">
              {currentUser.displayName[0]?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-base">{currentUser.displayName}</span>
                <span className={`text-xs px-2 py-0.5 rounded font-bold ${ROLE_COLORS[currentUser.role]}`}>
                  {ROLE_LABELS[currentUser.role]}
                </span>
                <span className="text-xs text-muted-foreground">(Current Active Session)</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Username: <code className="font-mono bg-muted px-1.5 py-0.5 rounded">@{currentUser.username}</code> · Authenticated via Secure Server Session
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Role Permissions & Governance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${ROLE_COLORS.superadmin}`}>Super Admin</span>
              <span className="text-sm font-medium">Full Administrative Governance</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Authorized to publish, edit, delete articles and videos, view reader subscriber lists, manage site configuration, and run maintenance tasks.
            </p>
          </div>
          <div className="p-3 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${ROLE_COLORS.editor}`}>Editor</span>
              <span className="text-sm font-medium">Content Review and Editorial Publishing</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Authorized to write, update, and approve articles and uploaded media across all categories.
            </p>
          </div>
          <div className="p-3 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${ROLE_COLORS.reporter}`}>Reporter</span>
              <span className="text-sm font-medium">Draft Article Submission</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Authorized to submit article drafts and upload accompanying images.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Site Settings Tab ───────────────────────────────────────────────────────────
function SiteSettingsTab() {
  const [form, setForm] = useState<SiteSettings>(getSiteSettings())
  const [saved, setSaved] = useState(false)

  const set = (key: keyof SiteSettings, val: string) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSave = () => {
    saveSiteSettings(form)
    window.dispatchEvent(new Event("tinph_settings_updated"))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const Field = ({ label, field, placeholder, icon }: { label: string; field: keyof SiteSettings; placeholder: string; icon: React.ReactNode }) => (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        {icon}{label}
      </label>
      <input suppressHydrationWarning type="text" value={form[field]} onChange={e => set(field, e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#002D72]" />
    </div>
  )

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Site Settings</h2>
          <p className="text-sm text-muted-foreground">Manage your public social links, contact info, and tagline.</p>
        </div>
        <Button onClick={handleSave} className="bg-[#002D72] hover:bg-[#001a50] text-white gap-2">
          <Save className="h-4 w-4" /> {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {saved && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm px-4 py-2.5 rounded-lg">
          ✓ Settings saved and applied to the live site instantly.
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#002D72]" /> Social Media Links
          </CardTitle>
          <p className="text-xs text-muted-foreground">These appear in the header and footer. Leave blank to hide.</p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Facebook" field="facebook" placeholder="https://facebook.com/yourpage" icon={<Facebook className="h-3.5 w-3.5 text-[#1877F2]" />} />
          <Field label="Twitter / X" field="twitter" placeholder="https://twitter.com/yourhandle" icon={<Twitter className="h-3.5 w-3.5 text-sky-400" />} />
          <Field label="YouTube" field="youtube" placeholder="https://youtube.com/yourchannel" icon={<Youtube className="h-3.5 w-3.5 text-red-500" />} />
          <Field label="Instagram" field="instagram" placeholder="https://instagram.com/yourhandle" icon={<Instagram className="h-3.5 w-3.5 text-pink-400" />} />
          <Field label="LinkedIn" field="linkedin" placeholder="https://linkedin.com/company/..." icon={<Linkedin className="h-3.5 w-3.5 text-blue-600" />} />
          <Field label="Website" field="website" placeholder="https://yourwebsite.com" icon={<Globe className="h-3.5 w-3.5 text-[#FCD116]" />} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4 text-[#002D72]" /> Contact Information
          </CardTitle>
          <p className="text-xs text-muted-foreground">Shown in the footer contact section.</p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Email" field="email" placeholder="news@yoursite.com" icon={<Mail className="h-3.5 w-3.5 text-gray-500" />} />
          <Field label="Phone" field="phone" placeholder="+63 (2) 8888-1234" icon={<Phone className="h-3.5 w-3.5 text-gray-500" />} />
          <div className="sm:col-span-2">
            <Field label="Address" field="address" placeholder="Manila, Philippines" icon={<MapPin className="h-3.5 w-3.5 text-gray-500" />} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-[#002D72]" /> Brand Tagline
          </CardTitle>
          <p className="text-xs text-muted-foreground">Shown in the footer and header tagline area.</p>
        </CardHeader>
        <CardContent>
          <Field label="Tagline" field="tagline" placeholder="The Truth, Direct from the Source." icon={<Newspaper className="h-3.5 w-3.5 text-gray-500" />} />
        </CardContent>
      </Card>

      <BlobUrlMigration />
    </div>
  )
}

function BlobUrlMigration() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [result, setResult] = useState<any>(null)

  const runDryRun = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/clean-blob-urls")
      setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const applyFix = async () => {
    if (!confirm("Are you sure? This will clear the image_url for all affected articles.")) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/clean-blob-urls", { method: "POST" })
      setResult(await res.json())
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-amber-800">
          <AlertCircle className="h-4 w-4" /> Legacy Broken Image Cleanup (One-Time)
        </CardTitle>
        <p className="text-xs text-amber-700/80">Find and fix articles that have broken &quot;blob:&quot; image URLs from the previous upload bug.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!data && !result && (
          <Button onClick={runDryRun} disabled={loading} variant="outline" className="w-full border-amber-300 text-amber-800 hover:bg-amber-100">
            {loading ? "Scanning..." : "Run Dry-Run (Scan Affected Articles)"}
          </Button>
        )}

        {data && (
          <div className="space-y-4">
            <div className="text-sm font-medium text-amber-900">{data.message}</div>
            <div className="max-h-60 overflow-y-auto space-y-2 border border-amber-200 rounded p-2 bg-white">
              {data.affected_articles?.map((a: any, i: number) => (
                <div key={a.id} className="text-xs">
                  <span className="font-bold">{i + 1}.</span> {a.title} <span className="text-muted-foreground">(Views: {a.view_count})</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setData(null)} variant="outline" className="flex-1">Cancel</Button>
              <Button onClick={applyFix} disabled={loading} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">
                {loading ? "Applying..." : "Confirm & Clear URLs"}
              </Button>
            </div>
          </div>
        )}

        {result && (
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded text-sm">
            <b>{result.message}</b><br/>
            Successfully updated: {result.success_count}<br/>
            Failed: {result.fail_count}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
