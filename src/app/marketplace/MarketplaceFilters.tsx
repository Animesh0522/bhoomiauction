"use client"
import { useRouter, usePathname } from "next/navigation"
import { useState, useTransition } from "react"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const PROPERTY_TYPES = ['residential', 'commercial', 'agricultural', 'industrial', 'plot']

export default function MarketplaceFilters({ currentSearch, currentType, currentCity, currentMinPrice, currentMaxPrice }: {
  currentSearch: string
  currentType: string
  currentCity: string
  currentMinPrice: string
  currentMaxPrice: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  
  const [search, setSearch] = useState(currentSearch)
  const [type, setType] = useState(currentType)
  const [city, setCity] = useState(currentCity)
  const [minPrice, setMinPrice] = useState(currentMinPrice)
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice)

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (type) params.set('type', type)
    if (city) params.set('city', city)
    if (minPrice) params.set('minPrice', minPrice.replace(/[^0-9]/g, ''))
    if (maxPrice) params.set('maxPrice', maxPrice.replace(/[^0-9]/g, ''))
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const clearFilters = () => {
    setSearch(''); setType(''); setCity(''); setMinPrice(''); setMaxPrice('')
    startTransition(() => router.push(pathname))
  }

  const hasFilters = search || type || city || minPrice || maxPrice

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') applyFilters()
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search properties..."
            className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded-lg pl-9 pr-4 py-2.5 outline-none focus:border-emerald-600 transition-colors placeholder:text-zinc-600"
          />
        </div>

        {/* City */}
        <div className="relative sm:w-48">
          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="City..."
            className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-emerald-600 transition-colors placeholder:text-zinc-600"
          />
        </div>

        {/* Property Type */}
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 text-sm rounded-lg px-4 py-2.5 outline-none focus:border-emerald-600 transition-colors text-white sm:w-48"
          style={{ colorScheme: 'dark' }}
        >
          <option value="">All Types</option>
          {PROPERTY_TYPES.map(t => (
            <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Min Price */}
        <input
          type="number"
          value={minPrice}
          onChange={e => setMinPrice(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Min Price (₹)"
          className="bg-zinc-950 border border-zinc-800 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-emerald-600 transition-colors placeholder:text-zinc-600 sm:w-48"
          style={{ colorScheme: 'dark' }}
        />
        <input
          type="number"
          value={maxPrice}
          onChange={e => setMaxPrice(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Max Price (₹)"
          className="bg-zinc-950 border border-zinc-800 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-emerald-600 transition-colors placeholder:text-zinc-600 sm:w-48"
          style={{ colorScheme: 'dark' }}
        />
        <div className="flex gap-2 sm:ml-auto">
          {hasFilters && (
            <Button variant="ghost" onClick={clearFilters} className="text-zinc-400 hover:text-white gap-1.5">
              <X className="w-4 h-4" /> Clear
            </Button>
          )}
          <Button onClick={applyFilters} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
            <Search className="w-4 h-4" />
            {isPending ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </div>
    </div>
  )
}
