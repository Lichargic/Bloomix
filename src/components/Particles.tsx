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
  glyphs?: string[]
  color1?: string
  color2?: string
}

export function Particles({ season, count = 14, glyphs, color1, color2 }: ParticlesProps) {
  const s = SEASONS[season]
  const activeGlyphs = glyphs ?? SEASON_GLYPHS[season]
  const activeColor1 = color1 ?? s.petal
  const activeColor2 = color2 ?? s.petal2

  const particles = Array.from({ length: count }).map((_, i) => {
    const left  = (i * 11 + (i % 4) * 17) % 100
    const delay = -((i * 0.83) % 9)
    const dur   = 11 + ((i * 1.7) % 8)
    const dx    = ((i % 7) - 3) * 18
    const sway  = 10 + (i % 4) * 9
    const size  = 9 + (i % 4) * 4
    const color = i % 2 ? activeColor1 : activeColor2
    const glyph = activeGlyphs[i % activeGlyphs.length]

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
        } as unknown as React.CSSProperties}
      >{glyph}</span>
    )
  })

  return <div className="sky" aria-hidden="true">{particles}</div>
}
