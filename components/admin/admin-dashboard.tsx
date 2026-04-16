"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  LayoutDashboard, FileText, Video, Users, LogOut,
  Plus, Menu, X, Eye, EyeOff, TrendingUp, Newspaper,
  UserCog, Trash2, ShieldCheck, Edit3, Key, Settings2,
  Facebook, Twitter, Youtube, Instagram, Linkedin, Globe, Mail, Phone, MapPin, Save
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArticlesTab } from "@/components/admin/articles-tab"
import { VideosTab } from "@/components/admin/videos-tab"
import { SubscribersTab } from "@/components/admin/subscribers-tab"
import { mockArticles } from "@/lib/mock-data"
import type { AdminUser } from "@/app/admin/page"
import { saveAccounts } from "@/app/admin/page"
import { getSiteSettings, saveSiteSettings, type SiteSettings } from "@/components/footer"

interface AdminDashboardProps {
  onLogout: () => void
  currentUser: AdminUser
}

type TabType = "dashboard" | "articles" | "videos" | "subscribers" | "accounts" | "settings"

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

function getAccounts(): AdminUser[] {
  try { return JSON.parse(localStorage.getItem("tinph_admin_accounts") || "[]") } catch { return [] }
}

export function AdminDashboard({ onLogout, currentUser }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const totalViews = mockArticles.reduce((s, a) => s + a.view_count, 0)
  const breakingCount = mockArticles.filter(a => a.is_breaking).length

  const isSuperAdmin = currentUser.role === "superadmin"

  const navItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "articles" as const, label: "Articles", icon: FileText },
    { id: "videos" as const, label: "Videos", icon: Video },
    { id: "subscribers" as const, label: "Subscribers", icon: Users },
    ...(isSuperAdmin ? [{ id: "accounts" as const, label: "Manage Accounts", icon: UserCog }] : []),
    { id: "settings" as const, label: "Site Settings", icon: Settings2 },
  ]

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-white/10">
        <Link href="/" className="flex items-center">
          <Image src="/tinph-logo.png" alt="The Insider News Philippines" width={150} height={60} className="object-contain" />
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
              <button suppressHydrationWarning onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false) }}
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
        <Button variant="ghost" onClick={onLogout}
          className="w-full text-gray-400 hover:text-white hover:bg-white/10 justify-start text-sm">
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
          <Image src="/tinph-logo.png" alt="The Insider News Philippines" width={130} height={50} className="object-contain" />
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
                { label: "Total Articles", value: mockArticles.length, sub: "+3 this week", icon: Newspaper, color: "text-[#002D72]" },
                { label: "Total Views", value: totalViews.toLocaleString(), sub: "+12% this month", icon: Eye, color: "text-[#CE1126]" },
                { label: "Breaking News", value: breakingCount, sub: "Active stories", icon: TrendingUp, color: "text-[#FCD116]" },
                { label: "Subscribers", value: "1,234", sub: "+56 this week", icon: Users, color: "text-emerald-500" },
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
                <div className="space-y-3">
                  {mockArticles.slice(0, 5).map((article) => (
                    <div key={article.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm truncate">{article.title}</h3>
                        <p className="text-xs text-muted-foreground">{article.category} · {article.author}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.view_count.toLocaleString()}</span>
                        {article.is_breaking && <span className="px-2 py-0.5 bg-[#CE1126] text-white rounded font-bold">BREAKING</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "articles" && <ArticlesTab />}
        {activeTab === "videos" && <VideosTab />}
        {activeTab === "subscribers" && <SubscribersTab />}
        {activeTab === "accounts" && isSuperAdmin && <AccountsTab currentUser={currentUser} />}
        {activeTab === "settings" && <SiteSettingsTab />}
      </main>
    </div>
  )
}

// ── Accounts Management Tab ───────────────────────────────────────────────────
function AccountsTab({ currentUser }: { currentUser: AdminUser }) {
  const [accounts, setAccounts] = useState<AdminUser[]>(getAccounts())
  const [showForm, setShowForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AdminUser | null>(null)
  const [formData, setFormData] = useState({ username: "", password: "", displayName: "", role: "reporter" as AdminUser["role"] })
  const [showPw, setShowPw] = useState(false)
  const [msg, setMsg] = useState("")

  const resetForm = () => { setFormData({ username: "", password: "", displayName: "", role: "reporter" }); setEditingAccount(null); setShowForm(false); setMsg("") }

  const openEdit = (acc: AdminUser) => {
    setEditingAccount(acc)
    setFormData({ username: acc.username, password: acc.password, displayName: acc.displayName, role: acc.role })
    setShowForm(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.username.trim() || !formData.password.trim() || !formData.displayName.trim()) return

    let updated: AdminUser[]
    if (editingAccount) {
      updated = accounts.map(a => a.id === editingAccount.id
        ? { ...a, ...formData }
        : a)
      setMsg("Account updated.")
    } else {
      const dupe = accounts.find(a => a.username === formData.username)
      if (dupe) { setMsg("Username already exists."); return }
      const newAcc: AdminUser = { id: String(Date.now()), ...formData, createdAt: new Date().toISOString() }
      updated = [...accounts, newAcc]
      setMsg("Account created.")
    }
    saveAccounts(updated)
    setAccounts(updated)
    resetForm()
  }

  const handleDelete = (id: string) => {
    if (id === currentUser.id) { alert("You can't delete your own account."); return }
    if (!confirm("Delete this account?")) return
    const updated = accounts.filter(a => a.id !== id)
    saveAccounts(updated)
    setAccounts(updated)
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#002D72]"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-[#002D72]" />Manage Accounts</h1>
          <p className="text-sm text-muted-foreground">Create and manage editor/reporter accounts</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[#002D72] hover:bg-[#001a50] text-white">
          <Plus className="h-4 w-4 mr-2" />New Account
        </Button>
      </div>

      {msg && <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">{msg}</div>}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
              <CardTitle className="font-serif">{editingAccount ? "Edit Account" : "Create New Account"}</CardTitle>
              <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Display Name</label>
                  <input suppressHydrationWarning value={formData.displayName} onChange={e => setFormData(f => ({ ...f, displayName: e.target.value }))} placeholder="e.g. Juan dela Cruz" required className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Username</label>
                  <input suppressHydrationWarning value={formData.username} onChange={e => setFormData(f => ({ ...f, username: e.target.value }))} placeholder="e.g. jdelacruz" required className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1"><Key className="h-3.5 w-3.5" />Password</label>
                  <div className="relative">
                    <input suppressHydrationWarning type={showPw ? "text" : "password"} value={formData.password}
                      onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                      placeholder="Set a strong password" required className={`${inputCls} pr-10`} />
                    <button suppressHydrationWarning type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Role</label>
                  <select suppressHydrationWarning value={formData.role} onChange={e => setFormData(f => ({ ...f, role: e.target.value as AdminUser["role"] }))} className={inputCls}>
                    <option value="reporter">Reporter — can add articles</option>
                    <option value="editor">Editor — can add & edit articles</option>
                    <option value="superadmin">Super Admin — full access</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t">
                  <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                  <Button type="submit" className="bg-[#002D72] hover:bg-[#001a50] text-white">
                    {editingAccount ? "Update Account" : "Create Account"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Accounts List */}
      <Card>
        <CardHeader><CardTitle className="text-lg">All Accounts ({accounts.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {accounts.map(acc => (
              <div key={acc.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#002D72] flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {acc.displayName[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{acc.displayName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${ROLE_COLORS[acc.role]}`}>{ROLE_LABELS[acc.role]}</span>
                    {acc.id === currentUser.id && <span className="text-[10px] text-muted-foreground">(you)</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">@{acc.username} · Created {new Date(acc.createdAt).toLocaleDateString("en-PH")}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(acc)} className="h-8 w-8"><Edit3 className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(acc.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive" disabled={acc.id === currentUser.id}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


// ── Site Settings Tab ─────────────────────────────────────────────────────────
function SiteSettingsTab() {
  const [form, setForm] = useState<SiteSettings>(getSiteSettings())
  const [saved, setSaved] = useState(false)

  const set = (key: keyof SiteSettings, val: string) =>
    setForm(prev => ({ ...prev, [key]: val }))

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
      <input
        suppressHydrationWarning
        type="text"
        value={form[field]}
        onChange={e => set(field, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#002D72]"
      />
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
          <Save className="h-4 w-4" />
          {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {saved && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm px-4 py-2.5 rounded-lg">
          ✓ Settings saved and applied to the live site instantly.
        </div>
      )}

      {/* Social Links */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#002D72]" /> Social Media Links
          </CardTitle>
          <p className="text-xs text-muted-foreground">These appear in the header and footer. Leave blank to hide.</p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Facebook" field="facebook" placeholder="https://facebook.com/yourpage"
            icon={<Facebook className="h-3.5 w-3.5 text-[#1877F2]" />} />
          <Field label="Twitter / X" field="twitter" placeholder="https://twitter.com/yourhandle"
            icon={<Twitter className="h-3.5 w-3.5 text-sky-400" />} />
          <Field label="YouTube" field="youtube" placeholder="https://youtube.com/yourchannel"
            icon={<Youtube className="h-3.5 w-3.5 text-red-500" />} />
          <Field label="Instagram" field="instagram" placeholder="https://instagram.com/yourhandle"
            icon={<Instagram className="h-3.5 w-3.5 text-pink-400" />} />
          <Field label="LinkedIn" field="linkedin" placeholder="https://linkedin.com/company/..."
            icon={<Linkedin className="h-3.5 w-3.5 text-blue-600" />} />
          <Field label="Website" field="website" placeholder="https://yourwebsite.com"
            icon={<Globe className="h-3.5 w-3.5 text-[#FCD116]" />} />
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4 text-[#002D72]" /> Contact Information
          </CardTitle>
          <p className="text-xs text-muted-foreground">Shown in the footer contact section.</p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Email" field="email" placeholder="news@yoursite.com"
            icon={<Mail className="h-3.5 w-3.5 text-gray-500" />} />
          <Field label="Phone" field="phone" placeholder="+63 (2) 8888-1234"
            icon={<Phone className="h-3.5 w-3.5 text-gray-500" />} />
          <div className="sm:col-span-2">
            <Field label="Address" field="address" placeholder="Manila, Philippines"
              icon={<MapPin className="h-3.5 w-3.5 text-gray-500" />} />
          </div>
        </CardContent>
      </Card>

      {/* Tagline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-[#002D72]" /> Brand Tagline
          </CardTitle>
          <p className="text-xs text-muted-foreground">Shown in the footer and header tagline area.</p>
        </CardHeader>
        <CardContent>
          <Field label="Tagline" field="tagline" placeholder="The Truth, Direct from the Source."
            icon={<Newspaper className="h-3.5 w-3.5 text-gray-500" />} />
        </CardContent>
      </Card>
    </div>
  )
}
