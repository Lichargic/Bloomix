import { getOptimizedImageSources } from '../lib/imageSources'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width: number
  height: number
  loading?: 'eager' | 'lazy'
}

export function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  loading = 'lazy',
}: OptimizedImageProps) {
  const sources = getOptimizedImageSources(src)

  return (
    <picture>
      <source type="image/avif" srcSet={sources.avif} />
      <source type="image/webp" srcSet={sources.webp} />
      <img
        src={sources.fallback}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
      />
    </picture>
  )
}
