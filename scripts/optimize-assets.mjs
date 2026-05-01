import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const sourceDir = path.resolve('public/assets')
const formats = ['webp', 'avif']

async function isFresh(source, target) {
  try {
    const [sourceStat, targetStat] = await Promise.all([stat(source), stat(target)])
    return targetStat.mtimeMs >= sourceStat.mtimeMs
  } catch {
    return false
  }
}

async function optimizeOne(sourcePath) {
  const metadata = await sharp(sourcePath).metadata()
  const width = metadata.width ?? 0
  if (width === 0) return

  const parsed = path.parse(sourcePath)
  const sizes = [
    { suffix: '@1x', width: Math.ceil(width / 2) },
    { suffix: '@2x', width },
  ]

  for (const format of formats) {
    for (const size of sizes) {
      const targetPath = path.join(parsed.dir, `${parsed.name}${size.suffix}.${format}`)
      if (await isFresh(sourcePath, targetPath)) continue

      const pipeline = sharp(sourcePath).resize({ width: size.width, withoutEnlargement: true })
      if (format === 'webp') {
        await pipeline.webp({ quality: 78 }).toFile(targetPath)
      } else {
        await pipeline.avif({ quality: 48 }).toFile(targetPath)
      }
      console.log(`wrote ${path.relative(process.cwd(), targetPath)}`)
    }
  }
}

async function findPngs(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(entries.map(async entry => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return findPngs(fullPath)
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.png') && !entry.name.includes('@')) return [fullPath]
    return []
  }))
  return files.flat()
}

for (const png of await findPngs(sourceDir)) {
  await optimizeOne(png)
}
