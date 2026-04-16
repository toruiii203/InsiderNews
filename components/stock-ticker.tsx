"use client"

import { useEffect, useState, useRef } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StockItem {
  symbol: string
  price: number
  change: number
  changePct: number
}

const initialStocks: StockItem[] = [
  { symbol: "USD/PHP", price: 56.45, change: -0.02, changePct: -0.04 },
  { symbol: "SM", price: 850.40, change: 0.43, changePct: 0.05 },
  { symbol: "BDO", price: 148.00, change: 0.00, changePct: 0.00 },
  { symbol: "PLDT", price: 1210.00, change: 0.00, changePct: 0.00 },
  { symbol: "ALI", price: 28.50, change: -0.10, changePct: -0.35 },
  { symbol: "JFC", price: 185.00, change: 0.50, changePct: 0.27 },
  { symbol: "MER", price: 295.20, change: 0.21, changePct: 0.07 },
  { symbol: "AC", price: 624.00, change: -1.50, changePct: -0.24 },
  { symbol: "TEL", price: 1190.00, change: 3.00, changePct: 0.25 },
  { symbol: "PSEi", price: 6842.30, change: 18.20, changePct: 0.27 },
]

function simulateFluctuation(stocks: StockItem[]): StockItem[] {
  return stocks.map((s) => {
    const delta = (Math.random() - 0.495) * s.price * 0.002
    const newPrice = Math.max(s.price + delta, 0.01)
    const newChange = s.change + delta
    const newChangePct = (newChange / (newPrice - newChange)) * 100
    return {
      ...s,
      price: parseFloat(newPrice.toFixed(2)),
      change: parseFloat(newChange.toFixed(2)),
      changePct: parseFloat(newChangePct.toFixed(2)),
    }
  })
}

export function StockTicker() {
  const [stocks, setStocks] = useState<StockItem[]>(initialStocks)
  // Use CSS animation restart trick — key forces re-mount on stock update
  const [animKey, setAnimKey] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStocks((prev) => simulateFluctuation(prev))
      // Do NOT bump animKey here — let the CSS loop run freely
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const items = [...stocks, ...stocks]

  return (
    <div className="bg-[#0A1628] text-white border-b border-[#002D72] overflow-hidden">
      <div className="flex items-center h-8">
        <div className="flex items-center gap-1.5 px-3 bg-[#002D72] h-full shrink-0 border-r border-[#FCD116]/30">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FCD116] animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest text-[#FCD116] uppercase">Markets</span>
        </div>
        <div className="overflow-hidden flex-1">
          {/* CSS-only infinite scroll — never stops, no JS position tracking */}
          <div className="ticker-track flex whitespace-nowrap">
            {items.map((stock, i) => (
              <div key={i} className="flex items-center gap-1.5 px-4 border-r border-white/10 shrink-0">
                <span className="text-[12px] font-bold text-gray-300">{stock.symbol}</span>
                <span className="text-[12px] font-mono text-white">
                  {stock.symbol === "USD/PHP"
                    ? stock.price.toFixed(2)
                    : stock.price.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </span>
                <span className={`flex items-center gap-0.5 text-[11px] font-medium ${stock.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {stock.change >= 0
                    ? <TrendingUp className="h-2.5 w-2.5" />
                    : <TrendingDown className="h-2.5 w-2.5" />}
                  {stock.change >= 0 ? "+" : ""}{stock.changePct.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
