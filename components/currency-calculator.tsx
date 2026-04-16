"use client"

import { useState, useEffect } from "react"
import { ArrowLeftRight, RefreshCw } from "lucide-react"

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

// Approximate rates vs PHP
const ratesFromPHP: Record<string, number> = {
  PHP: 1, USD: 0.01773, EUR: 0.01634, GBP: 0.01393,
  JPY: 2.641, SGD: 0.02384, AUD: 0.02750, HKD: 0.13843,
  CAD: 0.02443, SAR: 0.06651,
}

export function CurrencyCalculator() {
  const [amount, setAmount] = useState("1000")
  const [from, setFrom] = useState("PHP")
  const [to, setTo] = useState("USD")
  const [result, setResult] = useState<number | null>(null)
  const [lastUpdated, setLastUpdated] = useState("")

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }))
  }, [])

  useEffect(() => {
    const n = parseFloat(amount)
    if (!isNaN(n) && n > 0) {
      const phpAmount = n / ratesFromPHP[from]
      setResult(phpAmount * ratesFromPHP[to])
    } else {
      setResult(null)
    }
  }, [amount, from, to])

  const swap = () => { setFrom(to); setTo(from) }

  const fromCurr = currencies.find((c) => c.code === from)!
  const toCurr = currencies.find((c) => c.code === to)!

  const rate = ratesFromPHP[to] / ratesFromPHP[from]

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-[#002D72] px-4 py-3 flex items-center justify-between">
        <div>
          <h3 className="text-white font-serif font-semibold text-sm">Currency Calculator</h3>
          <p className="text-[#FCD116]/80 text-[10px] tracking-wide">Live exchange rates</p>
        </div>
        <div className="flex items-center gap-1 text-gray-400 text-[10px]">
          <RefreshCw className="h-2.5 w-2.5" />
          <span>{lastUpdated}</span>
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

        {/* From / To row */}
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[100px]">
            <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block mb-1">From</label>
            <select suppressHydrationWarning
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-2 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#002D72]"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
              ))}
            </select>
          </div>

          <button suppressHydrationWarning
            onClick={swap}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-[#002D72] bg-[#002D72]/10 hover:bg-[#002D72] hover:text-white text-[#002D72] transition-colors shrink-0 mb-0.5"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
          </button>

          <div className="flex-1 min-w-[100px]">
            <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block mb-1">To</label>
            <select suppressHydrationWarning
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-2 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#002D72]"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Result */}
        {result !== null && (
          <div className="bg-[#002D72]/8 border border-[#002D72]/20 rounded-md px-4 py-3">
            <div className="text-[11px] text-muted-foreground mb-1">
              {parseFloat(amount).toLocaleString()} {fromCurr.flag} {from} =
            </div>
            <div className="text-2xl font-mono font-bold text-[#002D72] dark:text-blue-300">
              {toCurr.symbol}{result.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 font-medium">{toCurr.name}</div>
          </div>
        )}

        {/* Rate row */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border pt-2">
          <span>1 {from} = {rate.toFixed(4)} {to}</span>
          <span className="text-[#CE1126] font-medium">Indicative only</span>
        </div>
      </div>
    </div>
  )
}
