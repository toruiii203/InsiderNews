/**
 * Universal runtime environment resolver for Cloudflare Pages (Edge) and Node.js.
 * Tolerates leading or trailing spaces on dashboard keys.
 */

const CF_CONTEXT_SYMBOL = Symbol.for("__cloudflare-request-context__")

function lookupInObject(obj: any, targetKey: string): string | undefined {
  if (!obj) return undefined;
  if (typeof obj[targetKey] === "string") return obj[targetKey];
  const trimmedTarget = targetKey.trim();
  for (const k of Object.keys(obj)) {
    if (k.trim() === trimmedTarget && typeof obj[k] === "string") {
      return obj[k];
    }
  }
  return undefined;
}

export function getRuntimeEnv(key: string): string | undefined {
  // 1. Cloudflare Pages request context (__cloudflare-request-context__)
  try {
    const cfContext = (globalThis as any)[CF_CONTEXT_SYMBOL];
    if (cfContext?.env) {
      const val = lookupInObject(cfContext.env, key);
      if (typeof val === "string") return val;
    }
  } catch {}

  // 2. Node.js process.env
  if (typeof process !== "undefined" && process.env) {
    const val = lookupInObject(process.env, key);
    if (typeof val === "string") return val;
  }

  // 3. Global scope fallback
  try {
    const val = lookupInObject(globalThis, key);
    if (typeof val === "string") return val;
  } catch {}

  return undefined;
}
