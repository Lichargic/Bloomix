import type { Season } from '../lib/theme'
import { SEASONS } from '../lib/theme'

const SEASON_GLYPHS: Record<Season, string[]> = {
  spring: ['✿', '❀', '·'],
  summer: ['·', '•', '✦'],
  autumn: ['❦', '◆', '·'],
  winter: ['❄', '✧', '·'],
}

interface ParticlesProps {
  season: Season
  count?: number
}

export function Particles({ season, count = 14 }: ParticlesProps) {
  const s = SEASONS[season]
  const glyphs = SEASON_GLYPHS[season]

  const particles = Array.from({ length: count }).map((_, i) => {
    const left  = (i * 11 + (i % 4) * 17) % 100
    const delay = -((i * 0.83) % 9)
    const dur   = 11 + ((i * 1.7) % 8)
    const dx    = ((i % 7) - 3) * 18
    const sway  = 10 + (i % 4) * 9
    const size  = 9 + (i % 4) * 4
    const color = i % 2 ? s.petal : s.petal2
    const glyph = glyphs[i % glyphs.length]

    return (
      <span
        key={i}
        className={`particle particle-${season}`}
        style={{
          left: `${left}%`,
          top: `${-12 - (i % 5) * 4}%`,
          color,
          fontSize: size,
          animationDelay: `${delay}s`,
          animationDuration: `${dur}s`,
          '--dx':   `${dx}px`,
          '--sway': `${sway}px`,
          '--spin': `${i % 2 ? 1 : -1}`,
        } as React.CSSProperties}
      >{glyph}</span>
    )
  })

  return <div className="sky" aria-hidden="true">{particles}</div>
}
