import { Howl } from 'howler'

const MUTED_KEY = 'bloomix-music-muted'

function readMuted(): boolean {
  return localStorage.getItem(MUTED_KEY) === 'true'
}

export const bgMusic = new Howl({
  src: [
    '/assets/audio/breezy-trees.mp3',
  ],
  loop: true,
  html5: true,
  volume: 0.4,
})

let started = false

function startOnInteraction() {
  if (started) return
  started = true
  if (!readMuted()) bgMusic.play()
}

document.addEventListener('click', startOnInteraction, { once: true, capture: true })
document.addEventListener('keydown', startOnInteraction, { once: true, capture: true })

export function isBgMuted(): boolean {
  return readMuted()
}

export function setBgMuted(muted: boolean): void {
  localStorage.setItem(MUTED_KEY, String(muted))
  bgMusic.mute(muted)
  if (!muted && !bgMusic.playing()) bgMusic.play()
}
