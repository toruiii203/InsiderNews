"use client"

import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { Sun, Moon, Newspaper } from "lucide-react"

const THEMES = [
  {
    id: "light",
    label: "Day",
    icon: <Sun className="h-3.5 w-3.5" />,
    desc: "Classic white",
  },
  {
    id: "dark",
    label: "Night",
    icon: <Moon className="h-3.5 w-3.5" />,
    desc: "Dark mode",
  },
  {
    id: "sepia",
    label: "Print",
    icon: <Newspaper className="h-3.5 w-3.5" />,
    desc: "Sepia tone",
  },
]

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5 px-1">
        Theme
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {THEMES.map((t) => {
          const active = theme === t.id
          return (
            <button suppressHydrationWarning
              key={t.id}
              onClick={() => setTheme(t.id)}
              suppressHydrationWarning
              className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg border-2 transition-all text-center ${
                active
                  ? "border-[#002D72] bg-[#002D72]/5 text-[#002D72] dark:border-[#FCD116] dark:text-[#FCD116] dark:bg-[#FCD116]/5"
                  : "border-border text-muted-foreground hover:border-[#002D72]/40 hover:text-foreground"
              }`}
            >
              {t.icon}
              <span className="text-[11px] font-semibold leading-none">{t.label}</span>
              <span className="text-[9px] leading-none opacity-60">{t.desc}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
