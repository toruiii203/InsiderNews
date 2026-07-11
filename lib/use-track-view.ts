// lib/use-track-view.ts
"use client"

import { useEffect } from "react"

export function useTrackView(articleId: string, category?: string, tags?: string[]) {
  useEffect(() => {
    if (!articleId) return

    const seenKey = `tinph_viewed_${articleId}`
    if (sessionStorage.getItem(seenKey)) return // already counted this session

    sessionStorage.setItem(seenKey, "1")

    fetch("/api/track-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId, category, tags }),
      keepalive: true,
    }).catch(() => {
      // Non-critical — a missed view count isn't worth surfacing an error to the reader
    })
  }, [articleId, category, tags])
}
