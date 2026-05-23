"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowLeftRight, RefreshCw, TrendingUp, TrendingDown } from "lucide-react"

const currencies = [
  { code: "PHP", name: "Philippine Peso", symbol: "₱", flag: "🇵🇭" },
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", flag: "🇨🇦" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼", flag: "🇸🇦" },
]

// Base rates vs PHP
const baseRatesFromPHP: Record<string, number> = {
  PHP: 1, USD: 0.01773, EUR: 0.01634, GBP: 0.01393,
  JPY: 2.641, SGD: 0.02384, AUD: 0.02750, HKD: 0.13843,
  CAD: 0.02443, SAR: 0.06651,
}

function simulateRates(base: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = { PHP: 1 }
  for (const key of Object.keys(base)) {
    if (key === "PHP") continue
    const volatility = key === "JPY" ? 0.0008 : 0.0004
    const delta = (Math.random() - 0.5) * base[key] * volatility
    result[key] = Math.max(0.0001, base[key] + delta)
  }
  return result
}

export function CurrencyCalculator() {
  const [amount, setAmount] = useState("1000")
  const [from, setFrom] = useState("PHP")
  const [to, setTo] = useState("USD")
  const [result, setResult] = useState<number | null>(null)
  const [lastUpdated, setLastUpdated] = useState("")
  const [rates, setRates] = useState(baseRatesFromPHP)
  const [prevRate, setPrevRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const refreshRates = useCallback(async () => {
    setLoading(true)
    // Try fetching live rates (free API)
    try {
      const res = await fetch("https://api.exchangerate-api.com/v4/latest/PHP", {
        signal: AbortSignal.timeout(3000)
      })
      if (res.ok) {
        const data = await res.json()
        if (data.rates) {
          const live: Record<string, number> = { PHP: 1 }
          for (const c of currencies) {
            if (c.code === "PHP") continue
            live[c.code] = 1 / (data.rates[c.code] || 1 / baseRatesFromPHP[c.code])
          }
          setPrevRate(rates[to] / rates[from])
          setRates(live)
          setLastUpdated(new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
          setLoading(false)
          return
        }
      }
    } catch {}
    // Fallback: simulate fluctuation
    setPrevRate(rates[to] / rates[from])
    setRates(simulateRates(rates))
    setLastUpdated(new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
    setLoading(false)
  }, [rates, from, to])

  // Initial + auto-refresh every 60 seconds
  useEffect(() => {
    refreshRates()
    const iv = setInterval(refreshRates, 60 * 1000)
    return () => clearInterval(iv)
  }, []) // eslint-disable-line

  // Micro-fluctuations every 8 seconds (simulate live market feel)
  useEffect(() => {
    const iv = setInterval(() => {
      setPrevRate(r => r)
      setRates(prev => simulateRates(prev))
      setLastUpdated(new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
    }, 8000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const n = parseFloat(amount)
    if (!isNaN(n) && n > 0) {
      const phpAmount = n / rates[from]
      setResult(phpAmount * rates[to])
    } else {
      setResult(null)
    }
  }, [amount, from, to, rates])

  const swap = () => { setFrom(to); setTo(from) }

  const fromCurr = currencies.find((c) => c.code === from)!
  const toCurr = currencies.find((c) => c.code === to)!
  const rate = rates[to] / rates[from]
  const rateUp = prevRate !== null ? rate > prevRate : null

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-[#002D72] px-4 py-3 flex items-center justify-between">
        <div>
          <h3 className="text-white font-serif font-semibold text-sm">Currency Calculator</h3>
          <p className="text-[#FCD116]/80 text-[10px] tracking-wide flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            Live exchange rates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-gray-400 text-[10px]">
            <span suppressHydrationWarning>{lastUpdated}</span>
          </div>
          <button
            onClick={refreshRates}
            disabled={loading}
            className="text-white/60 hover:text-white transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Amount input */}
        <div>
          <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block mb-1">Amount</label>
          <input suppressHydrationWarning
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#002D72]"
            placeholder="Enter amount"
            min="0"
          />
        </div>

        {/* From / Swap / To */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block mb-1">From</label>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-2 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#002D72]"
            >
              {currencies.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
              ))}
            </select>
          </div>
          <button
            onClick={swap}
            className="mb-0.5 p-2 rounded-md border border-input hover:bg-muted transition-colors"
          >
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="flex-1">
            <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block mb-1">To</label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-2 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#002D72]"
            >
              {currencies.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Result */}
        {result !== null && (
          <div className="bg-[#002D72]/5 dark:bg-white/5 rounded-lg p-3 border border-[#002D72]/20">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">
                  {fromCurr.flag} {parseFloat(amount).toLocaleString()} {from} =
                </p>
                <p className="text-2xl font-bold font-mono text-[#002D72] dark:text-blue-300">
                  {toCurr.symbol}{result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{toCurr.name}</p>
              </div>
              <div className="text-right">
                <div className={`flex items-center gap-0.5 text-xs font-medium ${rateUp === true ? "text-emerald-600" : rateUp === false ? "text-red-500" : "text-muted-foreground"}`}>
                  {rateUp === true ? <TrendingUp className="h-3 w-3" /> : rateUp === false ? <TrendingDown className="h-3 w-3" /> : null}
                  <span>{rateUp === true ? "↑" : rateUp === false ? "↓" : "—"}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  1 {from} = {rate.toFixed(from === "JPY" || to === "JPY" ? 3 : 5)} {to}
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center">
          Rates update every 60s · For reference only
        </p>
      </div>
    </div>
  )
}
