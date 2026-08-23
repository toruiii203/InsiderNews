"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  Plus, Edit3, Trash2, X, Loader2, AlertCircle, Save,
  Info, Users, Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "change-me-in-env"

interface StaffMember {
  id: string
  name: string
  role: string
  bio: string
  photo_url: string
  email: string
  display_order: number
}

interface AboutContent {
  id: number
  heading: string
  mission: string
  story: string
}

const inp = "w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#002D72] text-sm"
const lbl = "text-sm font-medium text-foreground"

export function AboutTab() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
          <Info className="h-6 w-6 text-[#002D72]" />
          About Us Page
        </h1>
        <p className="text-sm text-muted-foreground">
          Edit the mission statement, story, and your writers/staff — changes go live on{" "}
          <a href="/about" target="_blank" className="underline">/about</a> for every visitor.
        </p>
      </div>

      <AboutContentEditor />
      <StaffManager />
    </div>
  )
}

// ─── About Us content editor ──────────────────────────────────────────────
function AboutContentEditor() {
  const [form, setForm] = useState<AboutContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/about")
      .then(r => r.json())
      .then(d => { if (d.about) setForm(d.about) })
      .catch(() => setError("Failed to load About Us content."))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/about", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setError("Failed to save. Check your admin secret / connection.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card><CardContent className="py-10 flex items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading About Us content…
      </CardContent></Card>
    )
  }

  if (!form) {
    return (
      <Card><CardContent className="py-10 flex items-center justify-center text-destructive gap-2">
        <AlertCircle className="h-5 w-5" /> Could not load content.
      </CardContent></Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Page Content</CardTitle>
        <Button onClick={handleSave} disabled={saving} className="bg-[#002D72] hover:bg-[#001a50] text-white gap-2">
          <Save className="h-4 w-4" /> {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label className={lbl}>Page Heading</label>
          <input suppressHydrationWarning type="text" value={form.heading}
            onChange={e => setForm({ ...form, heading: e.target.value })} className={inp} />
        </div>
        <div className="space-y-1.5">
          <label className={lbl}>Mission Statement</label>
          <textarea suppressHydrationWarning value={form.mission} rows={3}
            onChange={e => setForm({ ...form, mission: e.target.value })} className={inp} />
        </div>
        <div className="space-y-1.5">
          <label className={lbl}>Our Story</label>
          <textarea suppressHydrationWarning value={form.story} rows={6}
            onChange={e => setForm({ ...form, story: e.target.value })} className={inp} />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Staff / Writers manager ───────────────────────────────────────────────
function StaffManager() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<StaffMember | null>(null)

  const load = () => {
    setLoading(true)
    fetch("/api/staff")
      .then(r => r.json())
      .then(d => setStaff(d.staff ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this staff member?")) return
    await fetch("/api/staff", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET },
      body: JSON.stringify({ id }),
    })
    setStaff(staff.filter(s => s.id !== id))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-[#002D72]" /> Writers & Staff ({staff.length})
        </CardTitle>
        <Button onClick={() => setShowForm(true)} className="bg-[#CE1126] hover:bg-[#CE1126]/90 text-white">
          <Plus className="h-4 w-4 mr-2" /> Add Staff Member
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading staff…
          </div>
        ) : staff.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">No staff members yet. Click "Add Staff Member" to get started.</p>
        ) : (
          <div className="space-y-3">
            {staff.map(member => (
              <div key={member.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="relative w-14 h-14 shrink-0 rounded-full overflow-hidden bg-muted">
                  {member.photo_url ? (
                    <Image src={member.photo_url} alt={member.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#002D72] text-white font-bold">
                      {member.name[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-sm truncate">{member.name}</h3>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                  {member.email && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3" />{member.email}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(member)} className="h-8 w-8">
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(member.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {(showForm || editing) && (
        <StaffForm
          member={editing}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSaved={(saved) => {
            if (editing) {
              setStaff(staff.map(s => s.id === saved.id ? saved : s))
            } else {
              setStaff([...staff, saved])
            }
            setShowForm(false)
            setEditing(null)
          }}
        />
      )}
    </Card>
  )
}

function StaffForm({ member, onClose, onSaved }: {
  member: StaffMember | null
  onClose: () => void
  onSaved: (member: StaffMember) => void
}) {
  const [form, setForm] = useState({
    name: member?.name ?? "",
    role: member?.role ?? "",
    bio: member?.bio ?? "",
    photo_url: member?.photo_url ?? "",
    email: member?.email ?? "",
    display_order: member?.display_order ?? 0,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const method = member ? "PATCH" : "POST"
      const body = member ? { id: member.id, ...form } : form
      const res = await fetch("/api/staff", {
        method,
        headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      onSaved(data.staff)
    } catch {
      setError("Failed to save. Check your admin secret / connection.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-md max-h-[92vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
          <CardTitle className="font-serif">{member ? "Edit Staff Member" : "Add Staff Member"}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className={lbl}>Full Name *</label>
              <input suppressHydrationWarning value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Juan dela Cruz" required className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className={lbl}>Role / Title *</label>
              <input suppressHydrationWarning value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                placeholder="e.g. Staff Writer, Editor-in-Chief" required className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className={lbl}>Short Bio</label>
              <textarea suppressHydrationWarning value={form.bio} rows={3}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="A sentence or two about them" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className={lbl}>Photo URL</label>
              <input suppressHydrationWarning type="url" value={form.photo_url}
                onChange={e => setForm(f => ({ ...f, photo_url: e.target.value }))}
                placeholder="https://.../photo.jpg" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className={lbl}>Email (optional)</label>
              <input suppressHydrationWarning type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="name@theinsidernewsph.com" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className={lbl}>Display Order</label>
              <input suppressHydrationWarning type="number" value={form.display_order}
                onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))}
                className={inp} />
              <p className="text-xs text-muted-foreground">Lower numbers appear first (e.g. 0 = shows before 1).</p>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-[#002D72] hover:bg-[#001a50] text-white">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : member ? "Update" : "Add Staff Member"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
