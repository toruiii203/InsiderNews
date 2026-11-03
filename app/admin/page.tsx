"use client"

import { useState } from "react"
import Image from "next/image"
import { Eye, EyeOff, Loader2, AlertCircle, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { type AdminUser, PRIMARY_ADMIN_PROFILE } from "@/lib/admin-accounts"

async function authenticate(username: string, secret: string): Promise<AdminUser | null> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, username }),
    })
    if (!res.ok) return null
    const data = await res.json().catch(() => ({}))
    return {
      ...PRIMARY_ADMIN_PROFILE,
      username: data.username || "admin",
    }
  } catch {
    return null
  }
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
    setError("")
    setIsLoading(true)

    const match = await authenticate(username, password)
    setIsLoading(false)

    if (match) {
      setCurrentUser(match)
      setIsLoggedIn(true)
      setAttempts(0)
      setPassword("") // Never retain plaintext password in memory
    } else {
      const n = attempts + 1
      setAttempts(n)
      if (n >= 5) {
        setLocked(true)
        setError("Too many failed attempts. Try again in 60 seconds.")
        let secs = 60
        setLockTimer(secs)
        const iv = setInterval(() => {
          secs--
          setLockTimer(secs)
          if (secs <= 0) {
            clearInterval(iv)
            setLocked(false)
            setAttempts(0)
            setError("")
          }
        }, 1000)
      } else {
        setError(`Incorrect username or password. ${5 - n} attempt${5 - n !== 1 ? "s" : ""} remaining.`)
      }
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {}
    setIsLoggedIn(false)
    setCurrentUser(null)
    setPassword("")
  }

  if (isLoggedIn && currentUser) {
    return <AdminDashboard onLogout={handleLogout} currentUser={currentUser} />
  }

  return (
    <div className="min-h-screen bg-[#070E1A] flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border-white/10 bg-[#0D1F3C] text-white shadow-2xl">
        <CardContent className="pt-8 pb-6 px-7">
          <div className="flex justify-center mb-6">
            <Image
              src="/tinph-logo-v2.png"
              alt="The Insider News Philippines"
              width={200}
              height={80}
              className="object-contain"
              priority
            />
          </div>

          <div className="flex items-center gap-2 mb-6 p-2.5 rounded-lg bg-[#002D72]/40 border border-[#002D72]/60">
            <Shield className="h-4 w-4 text-[#FCD116] shrink-0" />
            <p className="text-xs text-blue-200">
              Admin Portal - Authorized Editorial Staff Only
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                disabled={locked || isLoading}
                className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#002D72] focus:ring-1 focus:ring-[#002D72] disabled:opacity-50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={locked || isLoading}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#002D72] focus:ring-1 focus:ring-[#002D72] disabled:opacity-50 pr-10 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={locked || isLoading || !username.trim() || !password.trim()}
              className="w-full py-2.5 bg-[#002D72] hover:bg-[#001f52] text-white font-semibold text-sm rounded-lg transition-colors mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Authenticating...
                </span>
              ) : locked ? (
                `Locked (${lockTimer}s)`
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            The Insider News Philippines CMS · Neon + Cloudflare
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
