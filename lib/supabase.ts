import { createClient } from "@supabase/supabase-js"

const createDynamicClient = (isServer: boolean) => {
  let cachedClient: any = null
  return new Proxy({}, {
    get(target, prop) {
      if (!cachedClient) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
        const key = isServer 
          ? (process.env.SUPABASE_SERVICE_ROLE_KEY || "") 
          : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "")
        if (!url || !key) {
          // If variables are still missing, fallback to empty client or let createClient throw
        }
        cachedClient = createClient(url || "https://placeholder.supabase.co", key || "placeholder")
      }
      const value = cachedClient[prop as keyof typeof cachedClient]
      if (typeof value === "function") {
        return value.bind(cachedClient)
      }
      return value
    }
  }) as any
}

// Browser client (for front-end components)
export const supabase = createDynamicClient(false)

// Server client (for API routes — bypasses RLS)
export const supabaseAdmin = createDynamicClient(true)
