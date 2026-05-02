import { useEffect, useRef } from 'react'
import { SEASONS } from '../lib/theme'
import { getOptimizedImageUrl } from '../lib/imageSources'
import { Particles } from './Particles'
import type { Season } from '../lib/theme'

// ─── Animated canvas tree (wind-sway shader) ─────────────────────────────────

interface AnimatedTreeProps {
  src: string
  className?: string
  mobile?: boolean
}

function AnimatedTree({ src, className = 'tree-canvas', mobile = false }: AnimatedTreeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let frame = 0
    let active = true
    let imageReady = false
    const img = new Image()

    function fitRect(width: number, height: number) {
      const iw = img.naturalWidth  || img.width
      const ih = img.naturalHeight || img.height
      const scale = Math.min(width / iw, height / ih)
      const w = iw * scale
      const h = ih * scale
      return { x: (width - w) / 2, y: height - h, w, h }
    }

    function resize() {
      const box = canvas!.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width  = Math.max(1, Math.round(box.width))
      const height = Math.max(1, Math.round(box.height))
      canvas!.width  = Math.round(width  * dpr)
      canvas!.height = Math.round(height * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function draw(now: number) {
      if (!active) return
      const width  = canvas!.clientWidth
      const height = canvas!.clientHeight
      ctx!.clearRect(0, 0, width, height)

      if (imageReady) {
        const rect   = fitRect(width, height)
        const slice  = mobile ? 5 : 6
        const maxAmp = mobile ? 5 : 9
        const phase  = now * 0.00042
        // Overlap each slice by a small amount to prevent subpixel gaps
        // that appear as thin white horizontal lines across the tree
        const overlap = 0.5

        for (let y = 0; y < rect.h; y += slice) {
          const h       = Math.min(slice, rect.h - y)
          const fromTop = y / rect.h
          const bend    = Math.pow(1 - fromTop, 1.75)
          const offset  =
            Math.sin(phase + fromTop * 1.9) * maxAmp * bend +
            Math.sin(phase * 0.63 + fromTop * 3.1) * maxAmp * 0.22 * bend

          const srcY = (y / rect.h) * img.naturalHeight
          const srcH = (h / rect.h) * img.naturalHeight
          // Extend destination height by overlap to seal gaps between slices
          const destH = h + (y + h < rect.h ? overlap : 0)

          ctx!.drawImage(
            img,
            0,
            srcY,
            img.naturalWidth,
            srcH,
            rect.x + offset,
            rect.y + y,
            rect.w,
            destH
          )
        }
      }

      frame = window.requestAnimationFrame(draw)
    }

    img.onload = () => {
      imageReady = true
      resize()
      frame = window.requestAnimationFrame(draw)
    }

    img.onerror = () => {
      imageReady = false
    }

    img.src = src

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    return () => {
      active = false
      ro.disconnect()
      window.cancelAnimationFrame(frame)
    }
  }, [src, mobile])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
    />
  )
}

// ─── Tree stage ──────────────────────────────────────────────────────────────

interface TreeStageProps {
  season: Season
  growth: number // 0–100
  treeStage?: number
  tendedDays?: number
  todayCare?: number
  greeting: string
  weather?: string
  day?: number
  mobile?: boolean
}

export function TreeStage({
  season,
  growth,
  treeStage = 6,
  tendedDays,
  todayCare,
  greeting,
  weather = 'default',
  day = 1,
  mobile = false,
}: TreeStageProps) {
  const s = SEASONS[season]
  const safeStage = Math.max(0, Math.min(s.treeStages.length - 1, treeStage))
  const treeImg = getOptimizedImageUrl(s.treeStages[safeStage] ?? s.treeImg)
  const vit  = Math.max(0, Math.min(1, growth / 100))
  const halo = 0.15 + vit * 0.55
  const tint = 0.5 + vit * 0.5
  const particleCount = Math.round(8 + vit * 18)

  const blooms = [
    { left: '32%', top: '22%', at: 20 },
    { left: '58%', top: '18%', at: 35 },
    { left: '44%', top: '30%', at: 55 },
    { left: '26%', top: '38%', at: 70 },
    { left: '62%', top: '36%', at: 85 },
  ]
  const bloomGlyph = season === 'winter' ? '❄' : season === 'autumn' ? '❦' : '✿'

  return (
    <div
      className="tree-stage"
      role="group"
      aria-label={`Bloomix tree, ${s.label}, stage ${safeStage + 1} of ${s.treeStages.length}, ${growth}% grown`}
      style={{
        '--tree-img': `url(${treeImg})`,
        '--tree-tint': tint,
        '--halo': halo,
      } as React.CSSProperties}
      data-screen-label="Tree stage"
    >
      {weather !== 'none' && (
        <Particles season={season} count={particleCount} />
      )}

      <div className="sky-mark" aria-hidden="true">
        {season === 'winter' ? '❄' : season === 'autumn' ? '❦' : '☀'}
      </div>

      <div className="hills"  aria-hidden="true" />
      <div className="ground" aria-hidden="true" />

      <div className="stage-label">
        <span className="dot" aria-hidden="true" />
        <span>
          {s.label} · stage {safeStage + 1}/{s.treeStages.length}
          {typeof tendedDays === 'number' ? ` · ${tendedDays} tended day${tendedDays === 1 ? '' : 's'}` : ` · day ${day}`}
        </span>
      </div>

      <div className="tree-wrap">
        <div className="tree-halo" aria-hidden="true" />
        <AnimatedTree src={treeImg} mobile={mobile} />
        {blooms.map((b, i) => (
          <span
            key={i}
            className="tree-bloom"
            aria-hidden="true"
            style={{
              left: b.left,
              top: b.top,
              opacity: growth >= b.at ? 1 : 0,
              transform: growth >= b.at ? 'scale(1)' : 'scale(0.4)',
              transitionDelay: `${i * 70}ms`,
              color: s.petal,
            }}
          >{bloomGlyph}</span>
        ))}
      </div>

      <div className="greeting">
        <p>{greeting}</p>
      </div>

      <div
        className="grow-meter"
        role="progressbar"
        aria-label={`Tree growth: ${growth}% complete`}
        aria-valuenow={growth}
        aria-valuemin={0}
        aria-valuemax={100}
        title={`${growth}% of this tree cycle complete`}
      >
        <span className="grow-fill" style={{ width: `${growth}%` }}>
          <span className="sun" aria-hidden="true">{growth >= 100 ? '✿' : '☀'}</span>
        </span>
      </div>

      {typeof todayCare === 'number' && (
        <div className="care-caption">
          Today's care: {todayCare}%
        </div>
      )}
    </div>
  )
}
