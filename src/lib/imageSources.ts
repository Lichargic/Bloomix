export interface OptimizedImageSources {
  avif: string
  webp: string
  fallback: string
}

function stripExtension(src: string) {
  return src.replace(/\.[a-z0-9]+$/i, '')
}

export function getOptimizedImageSources(src: string): OptimizedImageSources {
  const base = stripExtension(src)
  return {
    avif: `${base}@1x.avif 1x, ${base}@2x.avif 2x`,
    webp: `${base}@1x.webp 1x, ${base}@2x.webp 2x`,
    fallback: src,
  }
}

export function getOptimizedImageUrl(src: string) {
  return `${stripExtension(src)}@2x.webp`
}
