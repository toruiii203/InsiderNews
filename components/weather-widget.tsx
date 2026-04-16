"use client"

import { useState, useEffect } from "react"
import { Cloud, Sun, CloudRain, CloudLightning, Wind, Droplets, Eye, Loader2, MapPin } from "lucide-react"

interface WeatherData {
  temp: number
  feels_like: number
  humidity: number
  wind_kph: number
  visibility_km: number
  condition: string
  description: string
  city: string
  icon: "sunny" | "cloudy" | "rainy" | "stormy"
}

const weatherIcons = {
  sunny:  <Sun className="h-10 w-10 text-[#FCD116] drop-shadow" />,
  cloudy: <Cloud className="h-10 w-10 text-gray-400" />,
  rainy:  <CloudRain className="h-10 w-10 text-blue-400" />,
  stormy: <CloudLightning className="h-10 w-10 text-purple-400" />,
}

const CITIES = ["Manila", "Cebu", "Davao", "Quezon City", "Makati"]

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [cityIndex, setCityIndex] = useState(0)

  const fetchWeather = (city: string) => {
    setLoading(true)
    // Simulated realistic PH weather — replace with openweathermap API when key is available
    // Add NEXT_PUBLIC_OPENWEATHER_KEY to .env.local to enable live data
    const key = process.env.NEXT_PUBLIC_OPENWEATHER_KEY
    if (key) {
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city},PH&appid=${key}&units=metric`)
        .then(r => r.json())
        .then(d => {
          const id = d.weather[0].id
          const icon: WeatherData["icon"] =
            id >= 200 && id < 300 ? "stormy" :
            id >= 300 && id < 600 ? "rainy" :
            id >= 800 && id < 803 ? "sunny" : "cloudy"
          setWeather({
            temp: Math.round(d.main.temp),
            feels_like: Math.round(d.main.feels_like),
            humidity: d.main.humidity,
            wind_kph: Math.round(d.wind.speed * 3.6),
            visibility_km: Math.round((d.visibility || 10000) / 1000),
            condition: d.weather[0].main,
            description: d.weather[0].description,
            city: d.name,
            icon,
          })
          setLoading(false)
        })
        .catch(() => loadMock(city))
    } else {
      loadMock(city)
    }
  }

  const loadMock = (city: string) => {
    const conditions: WeatherData["icon"][] = ["sunny", "cloudy", "rainy", "stormy"]
    const icon = conditions[Math.floor(Math.random() * conditions.length)]
    const descMap = { sunny: "Clear skies", cloudy: "Partly cloudy", rainy: "Light rain", stormy: "Thunderstorm" }
    setTimeout(() => {
      setWeather({
        temp: Math.floor(Math.random() * 8) + 28,
        feels_like: Math.floor(Math.random() * 8) + 30,
        humidity: Math.floor(Math.random() * 25) + 65,
        wind_kph: Math.floor(Math.random() * 20) + 10,
        visibility_km: Math.floor(Math.random() * 5) + 8,
        condition: icon.charAt(0).toUpperCase() + icon.slice(1),
        description: descMap[icon],
        city,
        icon,
      })
      setLoading(false)
    }, 600)
  }

  useEffect(() => {
    fetchWeather(CITIES[cityIndex])
  }, [cityIndex])

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-gradient-to-br from-[#002D72] to-[#0A1628] text-white shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-[#FCD116]" />
          <span className="text-xs font-bold tracking-wide text-[#FCD116] uppercase">Weather PH</span>
        </div>
        {/* City selector */}
        <select suppressHydrationWarning
          value={CITIES[cityIndex]}
          onChange={e => setCityIndex(CITIES.indexOf(e.target.value))}
          className="text-[11px] bg-white/10 border border-white/20 rounded px-2 py-0.5 text-white focus:outline-none cursor-pointer"
        >
          {CITIES.map(c => <option key={c} value={c} className="text-black">{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-28">
          <Loader2 className="h-6 w-6 animate-spin text-white/50" />
        </div>
      ) : weather ? (
        <>
          {/* Main temp row */}
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="text-5xl font-bold tracking-tight leading-none">{weather.temp}°</div>
              <div className="text-sm text-white/70 mt-1 capitalize">{weather.description}</div>
              <div className="text-[11px] text-white/40 mt-0.5">Feels like {weather.feels_like}°C</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              {weatherIcons[weather.icon]}
              <span className="text-[11px] text-white/60">{weather.condition}</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-0 border-t border-white/10">
            <div className="flex flex-col items-center py-2.5 border-r border-white/10">
              <Droplets className="h-3.5 w-3.5 text-blue-300 mb-1" />
              <span className="text-xs font-semibold">{weather.humidity}%</span>
              <span className="text-[10px] text-white/40">Humidity</span>
            </div>
            <div className="flex flex-col items-center py-2.5 border-r border-white/10">
              <Wind className="h-3.5 w-3.5 text-emerald-300 mb-1" />
              <span className="text-xs font-semibold">{weather.wind_kph} kph</span>
              <span className="text-[10px] text-white/40">Wind</span>
            </div>
            <div className="flex flex-col items-center py-2.5">
              <Eye className="h-3.5 w-3.5 text-yellow-300 mb-1" />
              <span className="text-xs font-semibold">{weather.visibility_km} km</span>
              <span className="text-[10px] text-white/40">Visibility</span>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
