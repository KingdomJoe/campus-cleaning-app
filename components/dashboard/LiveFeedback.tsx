'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { fetchReviews } from '@/lib/supabase/queries'
import { useLiveData } from '@/lib/supabase/hooks'

export function LiveFeedback() {
  const { data } = useLiveData(fetchReviews, { table: 'reviews' })
  const reviews = data ?? []
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)

  // Auto-rotate every 6 seconds
  useEffect(() => {
    if (!autoPlay) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [autoPlay])

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length)
    setAutoPlay(false)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length)
    setAutoPlay(false)
  }

  const current = reviews[currentIndex]

  if (!current) {
    return (
      <div className="bg-white rounded-xl border border-[#e0e7f1] p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
        <h3 className="text-lg font-bold text-[#001e2b]">Live Feedback</h3>
        <p className="text-sm text-[#7c8c9a] mt-2">No reviews yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-[#e0e7f1] p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-[#001e2b]">Live Feedback</h3>
          <p className="text-xs text-[#7c8c9a] mt-1">Real-time reviews from clients & cleaners</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#00ed64]">{(currentIndex + 1).toString().padStart(2, '0')}</div>
          <div className="text-xs text-[#7c8c9a]">of {reviews.length.toString().padStart(2, '0')}</div>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Review Card */}
        <div key={current.id} className="mb-6 animate-in fade-in-0 duration-500">
          <div className="flex items-start gap-4 mb-4">
            <Avatar name={current.clientName} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold text-[#001e2b] truncate">{current.clientName}</p>
                <span className="text-xs text-[#7c8c9a] flex-shrink-0">for {current.cleanerName}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < current.rating ? 'fill-[#fbbf24] text-[#fbbf24]' : 'text-[#e0e7f1]'}`}
                  />
                ))}
                <span className="text-xs text-[#7c8c9a] ml-2">{current.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Review Text */}
          <p className="text-sm text-[#3d4f9f] leading-relaxed line-clamp-3 mb-3">{current.text}</p>

          {/* Service Type Badge */}
          <div className="flex items-center gap-2">
            <span className="inline-block px-2.5 py-1 bg-[#00ed64]/10 text-[#00684a] text-xs font-medium rounded-lg">
              {current.serviceType.replace(/_/g, ' ').split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </span>
            <span className="text-xs text-[#7c8c9a]">{new Date(current.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-[#e0e7f1] rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#00ed64] to-[#00a852] rounded-full transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / reviews.length) * 100}%` }}
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            className="p-2 rounded-lg text-[#3d4f9f] hover:bg-[#f0f4f9] transition-colors hover:text-[#00684a]"
            aria-label="Previous review"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentIndex(i)
                  setAutoPlay(false)
                }}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  i === currentIndex ? 'bg-[#00ed64] w-6' : 'bg-[#e0e7f1] hover:bg-[#cad6e8]'
                }`}
                aria-label={`Go to review ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="p-2 rounded-lg text-[#3d4f9f] hover:bg-[#f0f4f9] transition-colors hover:text-[#00684a]"
            aria-label="Next review"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Autoplay indicator */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-10 text-[10px] text-[#7c8c9a] opacity-0 group-hover:opacity-100 transition-opacity">
          {autoPlay ? 'Auto-rotating...' : 'Click to resume'}
        </div>
      </div>
    </div>
  )
}
