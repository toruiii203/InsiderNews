/**
 * Universal runtime environment resolver for Cloudflare Pages (Edge) and Node.js.
 *
 * In Cloudflare Pages Edge runtime:
 * - Dashboard Secrets and Bindings are attached to Cloudflare's RequestContext (env).
 * - process.env does NOT always reflect encrypted secrets at runtime without nodejs_compat flags.
 * This resolver safely checks:
 * 1. Cloudflare Pages Request Context (__cloudflare-request-context__)
 * 2. Node.js process.env
 * 3. globalThis bindings
 */

const CF_CONTEXT_SYMBOL = Symbol.for("__cloudflare-request-context__")

export function getRuntimeEnv(key: string): string | undefined {
  // 1. Cloudflare Pages request context (__cloudflare-request-context__)
  try {
    const cfContext = (globalThis as any)[CF_CONTEXT_SYMBOL]
    if (cfContext?.env && typeof cfContext.env[key] !== "undefined") {
      const val = cfContext.env[key]
      if (typeof val === "string") return val
    }
  } catch {}

  // 2. Node.js process.env (local development, build time, or nodejs runtime)
  if (typeof process !== "undefined" && process.env && typeof process.env[key] !== "undefined") {
    return process.env[key]
  }

  // 3. Global scope fallback
  try {
    const gVal = (globalThis as any)[key]
    if (typeof gVal === "string") return gVal
  } catch {}

  return undefined
}
