// lib/admin-accounts.ts
export interface AdminUser {
  id: string
  username: string
  displayName: string
  role: "superadmin" | "editor" | "reporter"
  createdAt: string
}

// Verified server-authenticated primary administrator identity
export const PRIMARY_ADMIN_PROFILE: AdminUser = {
  id: "admin-primary",
  username: "admin",
  displayName: "Editorial Administrator",
  role: "superadmin",
  createdAt: "2026-11-01T00:00:00.000Z",
}
