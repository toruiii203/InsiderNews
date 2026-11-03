import { neon } from "@neondatabase/serverless"
import { getRuntimeEnv } from "@/lib/env"

function getDatabaseUrl(): string {
  const url = getRuntimeEnv("DATABASE_URL")
  if (!url) {
    throw new Error("DATABASE_URL environment variable is missing.")
  }
  return url
}

export function getDb() {
  return neon(getDatabaseUrl())
}

/**
 * Execute a parameterized SQL query against Neon PostgreSQL.
 * Safe for Cloudflare Pages Edge runtime and serverless functions.
 */
export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const sql = getDb()
  const rows = await sql.query(text, params)
  return rows as T[]
}

/**
 * Execute a query expecting a single row, or null if no row was returned.
 */
export async function queryOne<T = any>(text: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows.length > 0 ? rows[0] : null
}

export const db = {
  query,
  queryOne,
  getDb,
}

