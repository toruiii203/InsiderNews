"use client"

import { useEffect, useRef } from "react"

type AdUnitProps = {
  slot: string
  format?: string
  className?: string
  label?: boolean
}

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

export function AdUnit({ slot, format = "auto", className = "", label = true }: AdUnitProps) {
  const insRef = useRef<HTMLModElement>(null)
  const pushed = useRef(false)

  useEffect(() => {
    if (pushed.current) return
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({})
      pushed.current = true
    } catch (err) {
      console.warn("AdSense push failed:", err)
    }
  }, [])

  return (
    <div className={`w-full flex flex-col items-center ${className}`}>
      {label && (
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
          Advertisement
        </span>
      )}
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%" }}
        data-ad-client="ca-pub-7674493109786024"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
