"use client"

import { useState } from "react"
import Image from "next/image"
import { Eye, EyeOff, Loader2, AlertCircle, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export interface AdminUser {
  id: string
  username: string
  password: string
  displayName: string
  role: "superadmin" | "editor" | "reporter"
  createdAt: string
}

// Extra accounts stored in localStorage (added via admin panel)
export function getAccounts(): AdminUser[] {
  try {
    const raw = localStorage.getItem("tinph_admin_accounts")
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

export function saveAccounts(accounts: AdminUser[]) {
  localStorage.setItem("tinph_admin_accounts", JSON.stringify(accounts))
}

// Primary login: check env secret first, then localStorage accounts
function authenticate(username: string, password: string): AdminUser | null {
  const envSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET || "InsiderNews@2026!"

  // Default super admin account always works using the env secret
  if (username === "admin" && password === envSecret) {
    return {
      id: "1",
      username: "admin",
      password: envSecret,
      displayName: "Super Admin",
      role: "superadmin",
      createdAt: new Date().toISOString(),
    }
  }

  // Check additional accounts saved in localStorage
  const extra = getAccounts()
  return extra.find(a => a.username === username && a.password === password) ?? null
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [attempts, setAttempts] = useState(0)
  const [locked, setLocked] = useState(false)
  const [lockTimer, setLockTimer] = useState(0)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (locked) return
    setError(""); setIsLoading(true)
    await new Promise(r => setTimeout(r, 900))
    const match = authenticate(username, password)
    if (match) {
      setCurrentUser(match); setIsLoggedIn(true); setAttempts(0)
    } else {
      const n = attempts + 1; setAttempts(n)
      if (n >= 5) {
        setLocked(true); setError("Too many failed attempts. Try again in 60 seconds.")
        let secs = 60; setLockTimer(secs)
        const iv = setInterval(() => { secs--; setLockTimer(secs); if (secs <= 0) { clearInterval(iv); setLocked(false); setAttempts(0); setError("") } }, 1000)
      } else {
        setError(`Incorrect username or password. ${5 - n} attempt${5 - n !== 1 ? "s" : ""} remaining.`)
      }
    }
    setIsLoading(false)
  }

  if (isLoggedIn && currentUser) {
    return <AdminDashboard onLogout={() => { setIsLoggedIn(false); setCurrentUser(null) }} currentUser={currentUser} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002D72] via-[#0A1628] to-[#CE1126] flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-2xl border-0">
        <CardContent className="pt-8 pb-6 px-7">
          <div className="flex justify-center mb-6">
            <Image
              src="/tinph-logo.png"
              alt="The Insider News Philippines"
              width={200}
              height={80}
              className="object-contain"
              priority
            />
          </div>

          <p className="text-center text-sm text-muted-foreground mb-6 tracking-wide uppercase font-medium">Admin Portal</p>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}{locked && lockTimer > 0 ? ` (${lockTimer}s)` : ""}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="username" className="text-sm font-medium">Username</label>
              <input suppressHydrationWarning id="username" type="text" value={username}
                onChange={e => setUsername(e.target.value)} placeholder="Enter username"
                required disabled={locked}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#002D72] disabled:opacity-50 text-sm" />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <div className="relative">
                <input suppressHydrationWarning id="password" type={showPassword ? "text" : "password"}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password" required disabled={locked}
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#002D72] disabled:opacity-50 text-sm" />
                <button suppressHydrationWarning type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={isLoading || locked}
              className="w-full bg-[#002D72] hover:bg-[#001a50] text-white h-10">
              {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing in...</>
                : locked ? `Locked (${lockTimer}s)`
                : <><Shield className="h-4 w-4 mr-2" />Sign In</>}
            </Button>
          </form>

          <p className="text-center text-[11px] text-muted-foreground mt-5 border-t border-border pt-4">
            Contact your administrator for login credentials.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
