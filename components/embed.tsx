'use client'

import { useEffect, useState, memo } from 'react'
import { motion } from 'framer-motion'
import { FiChevronLeft, FiChevronRight, FiPlay } from 'react-icons/fi'

/* ---------------- CONFIG ---------------- */
const VISIBLE_COUNT = 7
const CENTER_INDEX = 3
const AUTO_SCROLL_INTERVAL = 3000
const TRANSITION_DURATION = 0.8

const cardConfigs = [
  { scale: 0.4, x: '120%', rotate: 0, zIndex: 10, opacity: 0.1, filter: 'grayscale(1) blur(2px)' },
  { scale: 0.6, x: '80%', rotate: 0, zIndex: 20, opacity: 0.3, filter: 'grayscale(0.8)' },
  { scale: 0.75, x: '40%', rotate: 0, zIndex: 30, opacity: 0.6, filter: 'grayscale(0.4)' },
  { scale: 0.9, x: '0%', rotate: 0, zIndex: 40, opacity: 1, filter: 'none' },
  { scale: 0.75, x: '-40%', rotate: 0, zIndex: 30, opacity: 0.6, filter: 'grayscale(0.4)' },
  { scale: 0.6, x: '-80%', rotate: 0, zIndex: 20, opacity: 0.3, filter: 'grayscale(0.8)' },
  { scale: 0.4, x: '-120%', rotate: 0, zIndex: 10, opacity: 0.1, filter: 'grayscale(1) blur(2px)' },
]

/* ---------------- CARD ---------------- */
const ShortsCard = memo(({
  videoId,
  position,
  isActive,
  isPlaying,
  onPlayStateChange,
}: {
  videoId: string
  position: number
  isActive: boolean
  isPlaying: boolean
  onPlayStateChange: (playing: boolean) => void
}) => {
  const baseParams = 'controls=0&rel=0&modestbranding=1&playsinline=1&fs=0&disablekb=1&loop=1&mute=0'
  const autoplayParam = isPlaying ? '&autoplay=1' : '&autoplay=0'
  const playlistParam = `&playlist=${videoId}`

  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?${baseParams}${autoplayParam}${playlistParam}`

  return (
    <motion.div
      animate={cardConfigs[position]}
      transition={{ duration: TRANSITION_DURATION, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        rounded-md overflow-hidden border transition-all duration-300
        ${isActive ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'border-slate-800 shadow-xl'}
        ${isActive ? 'cursor-pointer' : 'pointer-events-none'}
      `}
      style={{ width: 170, height: 300 }}
      onClick={() => isActive && onPlayStateChange(!isPlaying)}
    >
      <div className="relative w-full h-full bg-slate-900">
        <iframe
          key={`${videoId}-${isPlaying}`}
          src={embedUrl}
          title={videoId}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          className={`w-full h-full pointer-events-none transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-60'}`}
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />

        {/* Elite Overlay Details */}
        {!isPlaying && isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-[2px]">
                <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center bg-white/10">
                    <FiPlay className="text-white translate-x-0.5 text-sm" />
                </div>
            </div>
        )}

        {isPlaying && (
          <div className="absolute top-2 right-2 bg-red-600 text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-tighter text-white animate-pulse">
            Live
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 border-t border-slate-800 p-1.5 backdrop-blur-md">
        <div className="text-[9px] text-slate-400 font-mono tracking-widest uppercase text-center">
          ID: {videoId.substring(0,6)}
        </div>
      </div>
    </motion.div>
  )
})

ShortsCard.displayName = 'ShortsCard'

/* ---------------- MAIN SECTION ---------------- */
const YouTubeShortsSection = ({ shortIds }: { shortIds: string[] }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [isHovered, setIsHovered] = useState(false)

  const getVideoIndex = (pos: number) =>
    (activeIndex + pos - CENTER_INDEX + shortIds.length) % shortIds.length

  const currentCenterVideoId = shortIds[getVideoIndex(CENTER_INDEX)]

  const handlePlayStateChange = (playing: boolean) => {
    if (playing) {
      setPlayingVideoId(currentCenterVideoId)
      setIsPlaying(true)
    } else {
      setPlayingVideoId(null)
      setIsPlaying(false)
    }
  }

  const next = () => {
    setPlayingVideoId(null)
    setIsPlaying(false)
    setActiveIndex(i => (i + 1) % shortIds.length)
  }

  const prev = () => {
    setPlayingVideoId(null)
    setIsPlaying(false)
    setActiveIndex(i => (i - 1 + shortIds.length) % shortIds.length)
  }

  useEffect(() => {
    if (isPlaying || isHovered) return
    const interval = setInterval(next, AUTO_SCROLL_INTERVAL)
    return () => clearInterval(interval)
  }, [activeIndex, isPlaying, isHovered])

  if (shortIds.length < 4) return null

  return (
    <section className="w-full">
      <div className="w-full">
        <div
          className="relative h-[350px] w-full overflow-hidden flex items-center justify-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Subtle Elite Grid/Lines */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-slate-800 to-transparent" />
            <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
          </div>

          {/* Cards */}
          {Array.from({ length: VISIBLE_COUNT }).map((_, pos) => {
            const videoId = shortIds[getVideoIndex(pos)]
            const isActive = pos === CENTER_INDEX
            const isCurrentlyPlaying = playingVideoId === videoId

            return (
              <ShortsCard
                key={videoId}
                videoId={videoId}
                position={pos}
                isActive={isActive}
                isPlaying={isCurrentlyPlaying}
                onPlayStateChange={handlePlayStyleChange => handlePlayStateChange(handlePlayStyleChange)}
              />
            )
          })}

          {/* Nav Controls */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-between px-3 z-50">
            <button
              onClick={prev}
              disabled={isPlaying}
              className="cursor-pointer w-8 h-8 rounded-sm flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500 transition-all disabled:opacity-20"
            >
              <FiChevronLeft size={25} />
            </button>
            <button
              onClick={next}
              disabled={isPlaying}
              className="cursor-pointer w-8 h-8 rounded-sm flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500 transition-all disabled:opacity-20"
            >
              <FiChevronRight size={25} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default YouTubeShortsSection