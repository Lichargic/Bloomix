import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../providers/ThemeProvider'
import { SEASONS, getTreeStages } from '../lib/theme'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { Particles } from '../components/Particles'
import { AnimatedTree } from '../components/Tree'
import { SEASON_ORDER, SEASON_MARK, WHO_CARDS, BEATS, TEAM_GROUPS } from '../data/homeContent'

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('')
}

/** Hash a name to a deterministic earthy CSS gradient (hue range 70–180°). */
function nameToGradient(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  const hue  = 70 + (hash % 111)
  const hue2 = 70 + ((hash * 2654435761 >>> 0) % 111)
  const sat  = 38 + (hash % 22)   // 38–59%
  const lgt  = 44 + (hash % 16)   // 44–59%
  return `linear-gradient(135deg, hsl(${hue},${sat}%,${lgt}%) 0%, hsl(${hue2},${sat + 8}%,${lgt + 10}%) 100%)`
}

// ── Component ────────────────────────────────────────────────────────────────

export function HomePage() {
  useDocumentTitle()
  const navigate = useNavigate()
  const { season: appSeason, setSeason, treeShape } = useTheme()
  const s = SEASONS[appSeason]

  const seasonMark = SEASON_MARK[appSeason]
  const stages1 = getTreeStages(appSeason, 'shape-1')
  const stages2 = getTreeStages(appSeason, 'shape-2')
  const stages3 = getTreeStages(appSeason, 'shape-3')

  // Hero garden: stage-6, all 3 shapes. First/last trees clip their respective edges
  // symmetrically; inner trees use evenly spaced left anchors.
  const HERO_TREES: Array<{ src: string; h: number; pos: React.CSSProperties; bottom: number }> = [
    { src: stages3[6], h: 300, pos: { left: '0%'   }, bottom: 0 },
    { src: stages2[6], h: 300, pos: { left: '17%'  }, bottom: 0 },
    { src: stages1[6], h: 300, pos: { left: '35%'  }, bottom: 0 },
    { src: stages3[6], h: 300, pos: { left: '53%'  }, bottom: 0 },
    { src: stages1[6], h: 300, pos: { left: '70%'  }, bottom: 0 },
    { src: stages2[6], h: 300, pos: { right: '-1%' }, bottom: 0 },
  ]

  // Hero entrance — Web Animations API (WAAPI) runs on the compositor thread and
  // bypasses Firefox's CSS animation throttler (bug #1383239) which freezes CSS
  // animations whose `from` keyframe positions elements off-screen.
  const heroRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ease = 'cubic-bezier(0, 0.8, 0.3, 1)'
    const fromBot: Keyframe[] = [
      { transform: 'translateY(180px)', opacity: 0 },
      { transform: 'translateY(0)',     opacity: 1 },
    ]
    const fromTop: Keyframe[] = [
      { transform: 'translateY(-80px)', opacity: 0 },
      { transform: 'translateY(0)',     opacity: 1 },
    ]
    const drop: Keyframe[] = [
      { transform: 'translateY(-40px)', opacity: 0 },
      { transform: 'translateY(0)',     opacity: 1 },
    ]
    const drift: Keyframe[] = [
      { transform: 'translate3d(0, 0, 0)' },
      { transform: 'translate3d(0, -2px, 0)' },
      { transform: 'translate3d(0, 0, 0)' },
    ]

    const timers: ReturnType<typeof setTimeout>[] = []

    const run = (el: Element | null, keyframes: Keyframe[], duration: number, delay = 0) => {
      timers.push(setTimeout(() => {
        el?.animate(keyframes, { duration, easing: ease, fill: 'forwards' })
      }, delay))
    }

    // Nav is outside .hp-hero
    timers.push(setTimeout(() => {
      document.querySelector('.hp-nav')?.animate(fromTop, { duration: 800, easing: ease, fill: 'forwards' })
    }, 100))

    run(hero.querySelector('.hp-hero-clouds'), fromTop, 900, 210)
    run(hero.querySelector('.hp-hero-ground'), fromBot, 1050, 150)
    run(hero.querySelector('.hp-hero-hills'),  fromBot, 1050, 280)

    // Sky mark: entrance then continuous drift
    timers.push(setTimeout(() => {
      const el = hero.querySelector('.hp-hero-sky-mark')
      if (!el) return
      const entrance = el.animate(fromTop, { duration: 750, easing: ease, fill: 'forwards' })
      entrance.addEventListener('finish', () => {
        try { (entrance as Animation & { commitStyles?: () => void }).commitStyles?.() } catch { /* */ }
        entrance.cancel()
        el.animate(drift, { duration: 9000, easing: 'ease-in-out', iterations: Infinity })
      })
    }, 650))

    // Garden trees — stagger inward from center
    const treeDelays = [790, 610, 440, 520, 700, 880]
    hero.querySelectorAll('.hp-garden-tree').forEach((tree, i) =>
      run(tree, fromBot, 1200, treeDelays[i])
    )

    run(hero.querySelector('.hp-hero-badge'),   drop, 650,  980)
    run(hero.querySelector('.hp-hero-h1'),      drop, 650, 1100)
    run(hero.querySelector('.hp-hero-sub'),     drop, 650, 1220)
    run(hero.querySelector('.hp-hero-actions'), drop, 650, 1340)

    return () => timers.forEach(clearTimeout)
  }, [])

  // Hero scroll cue — appears after 1.8s, fades on scroll
  const [cueVisible, setCueVisible] = useState(false)
  const [heroScrolled, setHeroScrolled] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setCueVisible(true), 1800)
    return () => clearTimeout(t)
  }, [])
  useEffect(() => {
    const fn = () => setHeroScrolled(window.scrollY > 80)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Journey scroll mechanic
  const journeySectionRef = useRef<HTMLElement>(null)
  const [journeyBeat, setJourneyBeat] = useState(0)

  const currentBeat   = BEATS[journeyBeat]
  const journeyTreeSrc = stages1[currentBeat.stage]
  const particleCount  = Math.round(8 + (currentBeat.stage / 6) * 18)

  useEffect(() => {
    SEASON_ORDER.forEach(s => {
      // All journey stages for shape-1
      for (let i = 0; i <= 6; i++) {
        const img = new Image()
        img.src = `/assets/trees/shape-1/${s}/stage-${i}.png`
      }
      // Stage-6 for hero garden (shape-2, shape-3)
      ;(['shape-2', 'shape-3'] as const).forEach(shape => {
        const img = new Image()
        img.src = `/assets/trees/${shape}/${s}/stage-6.png`
      })
    })
  }, [])

  // Scroll-driven beat advancement
  useEffect(() => {
    const section = journeySectionRef.current
    if (!section) return
    const update = () => {
      const rect = section.getBoundingClientRect()
      const scrollable = section.offsetHeight - window.innerHeight
      if (scrollable <= 0) return
      const progress = Math.max(0, Math.min(1, -rect.top / scrollable))
      setJourneyBeat(Math.min(BEATS.length - 1, Math.floor(progress * BEATS.length)))
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])

  const whoRef    = useScrollReveal<HTMLElement>()
  const gardenRef = useScrollReveal<HTMLElement>()
  const teamRef   = useScrollReveal<HTMLElement>()
  const ctaRef    = useScrollReveal<HTMLElement>()

  // Mobile hamburger menu
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleOutside)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleOutside)
    }
  }, [menuOpen])

  return (
    <div className="hp" data-season={appSeason}>

      {/* ── Nav ── */}
      <nav className="hp-nav">
        <button
          className="hp-nav-brand"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll to top"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <img src={s.logo} alt="" className="hp-nav-logo-img" />
          <span className="brand-word hp-nav-logo">Bloomix</span>
        </button>
        <div className="hp-nav-links">
          <a href="#what">About</a>
          <a href="#who">Who it's for</a>
          <a href="#garden">Garden</a>
          <a href="#team">Team</a>
        </div>
        {/* Mobile hamburger */}
        <div className="hp-nav-hamburger-wrap" ref={menuRef}>
          <button
            className="hp-nav-hamburger"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="hp-mobile-nav"
            onClick={() => setMenuOpen(o => !o)}
          >
            ☰
          </button>
          {menuOpen && (
            <nav id="hp-mobile-nav" className="hp-nav-dropdown" role="navigation" aria-label="Mobile navigation">
              <a href="#what"   onClick={() => setMenuOpen(false)}>About</a>
              <a href="#who"    onClick={() => setMenuOpen(false)}>Who it's for</a>
              <a href="#garden" onClick={() => setMenuOpen(false)}>Garden</a>
              <a href="#team"   onClick={() => setMenuOpen(false)}>Team</a>
            </nav>
          )}
        </div>
        <button className="hp-nav-cta" onClick={() => navigate('/auth')}>
          Sign in
        </button>
      </nav>

      {/* ── Hero ── */}
      <section className="hp-hero" ref={heroRef}>
        <Particles season={appSeason} count={16} />
        <div className="hp-hero-clouds" aria-hidden="true">
          <div className="hp-cloud hp-cl1" />
          <div className="hp-cloud hp-cl2" />
          <div className="hp-cloud hp-cl3" />
          <div className="hp-cloud hp-cl4 hp-cloud-haze" />
        </div>
        <div className="hp-hero-sky-mark" aria-hidden="true">{seasonMark}</div>
        <div className="hp-hero-hills" aria-hidden="true" />
        <div className="hp-hero-garden" aria-hidden="true">
          {HERO_TREES.map((t, i) => (
            <div
              key={i}
              className="hp-garden-tree"
              style={{ height: t.h, width: t.h, bottom: t.bottom, ...t.pos }}
            >
              <AnimatedTree src={t.src} className="hp-garden-canvas" />
            </div>
          ))}
        </div>
        <div className="hp-hero-ground" aria-hidden="true" />
        <main id="main-content" className="hp-hero-content">
          <div className="hp-hero-badge">Pixel Productivity App</div>
          <h1 className="hp-hero-h1">
            Grow at your<br /><em>own pace</em>
          </h1>
          <p className="hp-hero-sub">
            A productivity app for <strong>students and the stressed</strong>, built around your effort, not your consistency.
          </p>
          <div className="hp-hero-actions">
            <button className="hp-btn-solid" onClick={() => navigate('/auth')}>
              Get started for free
            </button>
            <a className="hp-btn-ghost" href="#what">
              See how it works
            </a>
          </div>
        </main>
        <div
          className="hp-scroll-cue"
          aria-hidden="true"
          style={{ opacity: cueVisible && !heroScrolled ? 1 : 0 }}
        >
          <span className="hp-scroll-label">scroll</span>
          <div className="hp-scroll-bounce">
            <svg width="14" height="9" viewBox="0 0 14 9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1,1 7,8 13,1" />
            </svg>
          </div>
        </div>
      </section>

      <div className="hp-px-div" aria-hidden="true" />

      {/* ── Journey ── */}
      <section className="hp-journey" id="what" ref={journeySectionRef}>
        <div className="hp-journey-sticky">

          {/* Sticky tree column — desktop only */}
          <div className="hp-journey-tree-col">
            <div className="tree-stage hp-journey-scene" aria-hidden="true">
              <Particles season={appSeason} count={particleCount} />
              <div className="sky-mark">{seasonMark}</div>
              <div className="hills" />
              <div className="ground" />
              <div className="tree-wrap">
                <div className="tree-halo" />
                <AnimatedTree src={journeyTreeSrc} className="tree-canvas" />
              </div>
              <div className="stage-label">
                <span className="dot" aria-hidden="true" />
                <span>{s.label} · {currentBeat.stage === 0 ? 'seed' : `stage ${currentBeat.stage}`}</span>
              </div>
            </div>
          </div>

          {/* Fading beat cards */}
          <div className="hp-journey-cards">
            {BEATS.map((beat, i) => (
              <div
                key={beat.stage}
                className={`hp-beat-card${i === journeyBeat ? ' hp-beat-active' : ''}`}
              >
                <div className="hp-tag">{beat.tag}</div>
                <h2 className="hp-beat-h2">{beat.headline}</h2>
                <p className="hp-beat-body">{beat.body}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      <div className="hp-px-div" aria-hidden="true" />

      {/* ── Who it's for ── */}
      <section id="who" ref={whoRef} className="hp-section hp-s-sand hp-reveal">
        <div className="hp-inner">
          <div className="hp-tag">Who It's For</div>
          <h2 className="hp-sh2">Built for people<br />already trying hard</h2>
          <p className="hp-body" style={{ maxWidth: '520px' }}>Not for the person who wakes up at 5am and never misses a day. For everyone else.</p>
          <div className="hp-who-grid">
            {WHO_CARDS.map(c => (
              <div key={c.title} className="hp-who-card">
                <div className="hp-who-title">{c.title}</div>
                <p className="hp-who-body">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="hp-px-div" aria-hidden="true" />

      {/* ── Garden Archive ── */}
      <section id="garden" ref={gardenRef} className="hp-section hp-s-bg hp-reveal">
        <div className="hp-inner">
          <div className="hp-tag">Garden</div>
          <h2 className="hp-sh2">Collect every season</h2>
          <p className="hp-garden-sub">
            Each season you complete is preserved forever. Four seasons, four trees, all yours.
          </p>
          <div className="hp-garden-grid">
            {SEASON_ORDER.map(seasonKey => (
              <div key={seasonKey} className="hp-gc">
                <div className="hp-gc-tree">
                  <img src={getTreeStages(seasonKey, treeShape)[6]} alt={`${SEASONS[seasonKey].label} tree`} />
                </div>
                <div className="hp-gc-label">{SEASONS[seasonKey].label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="hp-px-div" aria-hidden="true" />

      {/* ── Team ── */}
      <section id="team" ref={teamRef} className="hp-section hp-s-sand hp-reveal">
        <div className="hp-inner">
          <div className="hp-tag">The Team</div>
          <h2 className="hp-sh2">Meet the people<br />behind Bloomix</h2>
          <p className="hp-body" style={{ maxWidth: '460px' }}>A small group of students who built something we actually needed ourselves.</p>
          <div className="hp-team-groups">
            {(() => {
              let cardIdx = 0
              return TEAM_GROUPS.map(group => (
                <div key={group.group} className="hp-team-group">
                  <div className="hp-team-group-label">{group.group}</div>
                  <div className="hp-team-grid">
                    {group.members.map(member => {
                      const delay = cardIdx++ * 60
                      return (
                        <div
                          key={member.name}
                          className="hp-team-card"
                          style={{ transitionDelay: `${delay}ms` }}
                        >
                          <div
                            className="hp-team-avatar"
                            style={member.src ? undefined : { background: nameToGradient(member.name) }}
                          >
                            {member.src
                              ? <img src={member.src} alt={member.name} />
                              : <span className="hp-team-initials">{initials(member.name)}</span>
                            }
                          </div>
                          <div className="hp-team-info">
                            <div className="hp-team-name">{member.name}</div>
                            <div className="hp-team-role">{member.role}</div>
                            {member.github !== '#' && (
                              <a href={member.github} className="hp-team-gh" target="_blank" rel="noopener noreferrer" aria-label={`${member.name} on GitHub`}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            })()}
          </div>
        </div>
      </section>

      <div className="hp-px-div" aria-hidden="true" />

      {/* ── CTA ── */}
      <section ref={ctaRef} className="hp-section hp-s-bg hp-cta-section hp-reveal">
        <div className="hp-cta-inner">
          <img
            className="hp-cta-logo"
            src={s.logo}
            alt=""
            aria-hidden="true"
          />
          <h2 className="hp-cta-h2">Your tree waits.<br /><em>No judgment.</em></h2>
          <p className="hp-cta-sub">Start growing today. Come back whenever you're ready.</p>
          <button className="hp-btn-solid" onClick={() => navigate('/auth')}>
            Get Started
          </button>
          <p className="hp-cta-note">Academic prototype · Hosted on Vercel · A kinder productivity app for students &amp; the stressed</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="hp-footer">
        <span className="brand-word hp-footer-logo">Bloomix</span>
        <div className="hp-footer-links">
          <a href="https://www.instagram.com/bloomix.betterment" target="_blank" rel="noopener noreferrer" aria-label="Bloomix on Instagram">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </a>
          <a href="https://github.com/Lichargic/Bloomix.git" target="_blank" rel="noopener noreferrer" aria-label="Bloomix on GitHub">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          </a>
        </div>
        <p className="hp-footer-copy">2026 · Bloomix · A kinder productivity app for students &amp; the stressed</p>
      </footer>

      {/* ── Season picker ── */}
      <div className="hp-season-picker" role="group" aria-label="Choose season">
        {SEASON_ORDER.map(seasonKey => (
          <button
            key={seasonKey}
            className={`hp-season-btn${seasonKey === appSeason ? ' hp-season-active' : ''}`}
            onClick={() => setSeason(seasonKey)}
            aria-label={seasonKey}
            aria-pressed={seasonKey === appSeason}
          >
            {SEASON_MARK[seasonKey]}
          </button>
        ))}
      </div>

    </div>
  )
}
