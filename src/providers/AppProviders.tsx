import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { queryClient } from '../lib/queryClient'
import { AuthProvider } from './AuthProvider'
import { ThemeProvider } from './ThemeProvider'
import { AudioProvider } from './AudioProvider'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <AudioProvider>
              {children}
            </AudioProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
