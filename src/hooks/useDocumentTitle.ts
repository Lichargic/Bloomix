import { useEffect } from 'react'

export function getDocumentTitle(title?: string | null) {
  const trimmed = title?.trim()
  return trimmed ? `${trimmed} / Bloomix` : 'Bloomix'
}

export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    document.title = getDocumentTitle(title)
  }, [title])
}
