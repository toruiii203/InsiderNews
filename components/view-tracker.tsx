"use client"

import { useEffect } from "react"

interface ViewTrackerProps {
  articleId: string
  category?: string | null
  tags?: string[] | null
}

// Fires a fire-and-forget POST to /api/track-view on mount.
// Must be a client component — the article page itself is a server
// component and can't run browser-side effects.
export function ViewTracker({ articleId, category, tags }: ViewTrackerProps) {
  useEffect(() => {
    fetch("/api/track-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId, category, tags }),
    }).catch(() => {
      // Non-critical — never block or disrupt the reading experience
      // if the tracking call fails.
    })
    // Only re-fire if the viewer navigates to a different article.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId])

  return null
}
