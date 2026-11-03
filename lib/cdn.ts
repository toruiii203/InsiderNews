const SUPABASE_STORAGE_PUBLIC_PREFIX =
  "https://dyamlsfldhjpimdlixfc.supabase.co/storage/v1/object/public/"
const CDN_PUBLIC_PREFIX = "https://img.theinsidernewsph.com/"

export function toCdnUrl(url: string | null | undefined): string {
  if (!url) return ""
  if (url.startsWith(SUPABASE_STORAGE_PUBLIC_PREFIX)) {
    return url.replace(SUPABASE_STORAGE_PUBLIC_PREFIX, CDN_PUBLIC_PREFIX)
  }
  return url
}
