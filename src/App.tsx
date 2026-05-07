import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { Auth } from './pages/Auth'
import { AuthCallback } from './pages/AuthCallback'
import { AuthRoute } from './routes/AuthRoute'
import { PublicOnly } from './routes/PublicOnly'
import { OnboardingRoute } from './routes/OnboardingRoute'
import { ProfileRoute } from './routes/ProfileRoute'

const Onboarding = lazy(() => import('./pages/Onboarding').then(module => ({ default: module.Onboarding })))
const Today = lazy(() => import('./pages/Today').then(module => ({ default: module.Today })))
const Calendar = lazy(() => import('./pages/Calendar').then(module => ({ default: module.Calendar })))
const Bag = lazy(() => import('./pages/Bag').then(module => ({ default: module.Bag })))
const Store = lazy(() => import('./pages/Store').then(module => ({ default: module.Store })))
const Garden = lazy(() => import('./pages/Garden').then(module => ({ default: module.Garden })))
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })))

function protectedRoute(element: React.ReactNode) {
  return (
    <Suspense fallback={<main id="main-content" className="canvas fade-in" />}>
      {element}
    </Suspense>
  )
}

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Routes>
        {/* Public */}
        <Route index element={<HomePage />} />
        {/* auth/callback must be outside PublicOnly so it can process the token before redirecting */}
        <Route path="auth/callback" element={<AuthCallback />} />

        {/* Redirect to /today if already signed in */}
        <Route element={<PublicOnly />}>
          <Route path="auth" element={<Auth />} />
        </Route>

        {/* Protected */}
        <Route element={<AuthRoute />}>
          <Route element={<OnboardingRoute />}>
            <Route path="onboarding" element={protectedRoute(<Onboarding />)} />
          </Route>
          <Route element={<ProfileRoute />}>
            <Route path="today" element={protectedRoute(<Today />)} />
            <Route path="calendar" element={protectedRoute(<Calendar />)} />
            <Route path="calendar/:date" element={protectedRoute(<Calendar />)} />
            <Route path="garden/*" element={protectedRoute(<Garden />)} />
            <Route path="bag" element={protectedRoute(<Bag />)} />
            <Route path="store" element={protectedRoute(<Store />)} />
            <Route path="settings" element={protectedRoute(<Settings />)} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
