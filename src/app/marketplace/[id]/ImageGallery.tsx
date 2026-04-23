"use client"
import { useState } from "react"
import Image from "next/image"
import { ImageIcon, ChevronLeft, ChevronRight } from "lucide-react"

export default function ImageGallery({ images }: { images: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[4/3] bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col items-center justify-center text-zinc-500">
        <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
        <span>No images available</span>
      </div>
    )
  }

  const handlePrev = () => setActiveIndex((prev) => (prev - 1 + images.length) % images.length)
  const handleNext = () => setActiveIndex((prev) => (prev + 1) % images.length)

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-[4/3] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 group">
        <Image src={images[activeIndex]} alt="Property" fill className="object-cover" />
        
        {images.length > 1 && (
          <>
            <button 
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md border border-white/10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md border border-white/10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((img, idx) => (
            <button 
              key={idx} 
              onClick={() => setActiveIndex(idx)}
              className={`relative h-20 w-24 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${activeIndex === idx ? 'border-emerald-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
            >
              <Image src={img} alt={`Thumbnail ${idx}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
