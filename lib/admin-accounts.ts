// lib/admin-accounts.ts
export interface AdminUser {
  id: string
  username: string
  password: string
  displayName: string
  role: "superadmin" | "editor" | "reporter"
  createdAt: string
}

export function getAccounts(): AdminUser[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem("tinph_admin_accounts")
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

export function saveAccounts(accounts: AdminUser[]) {
  if (typeof window === "undefined") return
  localStorage.setItem("tinph_admin_accounts", JSON.stringify(accounts))
}
