import { useNavigate } from 'react-router-dom'
import { useTheme } from '../providers/ThemeProvider'
import { SEASONS } from '../lib/theme'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { OptimizedImage } from '../components/OptimizedImage'

export function Landing() {
  useDocumentTitle()
  const navigate = useNavigate()
  const { season } = useTheme()
  const s = SEASONS[season]

  return (
    <div className="welcome" data-screen-label="Landing">
      <main id="main-content" className="welcome-card fade-in">
        <OptimizedImage src={s.logo} alt="" className="logo" width={300} height={300} loading="eager" />
        <h1 className="bloomix-mark">Bloomix</h1>
        <p className="tagline">
          A calm productivity app for the students and the stressed.<br />
          Rewards effort, not perfection.
        </p>
        <button className="cta" onClick={() => navigate('/auth')}>
          get started ›
        </button>
      </main>
    </div>
  )
}
