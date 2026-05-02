import { useCallback, useLayoutEffect, useState } from 'react'

type Direction = 'vertical' | 'horizontal'

/**
 * Attaches scroll-position class names to a scrollable element so that
 * the parent `.scroll-fade-v` / `.scroll-fade-h` wrappers can show or
 * hide their CSS fade overlays.
 *
 * Vertical (default):   adds `can-scroll-up` / `can-scroll-down`
 * Horizontal:           adds `can-scroll-left` / `can-scroll-right`
 *
 * Uses `useLayoutEffect` so classes are applied before the browser paints.
 * Uses `MutationObserver` to catch async content changes (e.g. task lists
 * loading) that `ResizeObserver` alone misses in Firefox.
 * Classes are applied to both the scroll element and its wrapper so the
 * CSS fades work without relying on `:has()`.
 *
 * Returns a callback ref so the hook reattaches when a conditional scroll
 * region appears later, such as Today events or Calendar selected-day events.
 */
export function useScrollFade<T extends HTMLElement>(
  direction: Direction = 'vertical',
) {
  const [node, setNode] = useState<T | null>(null)

  const ref = useCallback((el: T | null) => {
    setNode(el)
  }, [])

  useLayoutEffect(() => {
    const el = node
    if (!el) return

    const wrapperClass = direction === 'vertical' ? 'scroll-fade-v' : 'scroll-fade-h'
    const host = el.parentElement?.classList.contains(wrapperClass)
      ? el.parentElement
      : el

    const targets = host === el ? [el] : [el, host]
    let raf = 0

    function toggleClass(name: string, enabled: boolean) {
      for (const target of targets) {
        target.classList.toggle(name, enabled)
      }
    }

    function clearClasses() {
      for (const target of targets) {
        target.classList.remove(
          'can-scroll-up',
          'can-scroll-down',
          'can-scroll-left',
          'can-scroll-right',
          'is-scrollable-v',
          'is-scrollable-h',
        )
      }
    }

    function update() {
      if (direction === 'vertical') {
        const canScroll = el.scrollHeight > el.clientHeight + 1
        const canScrollUp = canScroll && el.scrollTop > 1
        const canScrollDown = canScroll && el.scrollTop + el.clientHeight < el.scrollHeight - 1

        toggleClass('is-scrollable-v', canScroll)
        toggleClass('can-scroll-up', canScrollUp)
        toggleClass('can-scroll-down', canScrollDown)

        toggleClass('is-scrollable-h', false)
        toggleClass('can-scroll-left', false)
        toggleClass('can-scroll-right', false)
      } else {
        const canScroll = el.scrollWidth > el.clientWidth + 1
        const canScrollLeft = canScroll && el.scrollLeft > 1
        const canScrollRight = canScroll && el.scrollLeft + el.clientWidth < el.scrollWidth - 1

        toggleClass('is-scrollable-h', canScroll)
        toggleClass('can-scroll-left', canScrollLeft)
        toggleClass('can-scroll-right', canScrollRight)

        toggleClass('is-scrollable-v', false)
        toggleClass('can-scroll-up', false)
        toggleClass('can-scroll-down', false)
      }
    }

    function scheduleUpdate() {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }

    scheduleUpdate()

    el.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('load', scheduleUpdate)

    const ro = new ResizeObserver(scheduleUpdate)
    ro.observe(el)

    for (const child of Array.from(el.children)) {
      if (child instanceof HTMLElement) ro.observe(child)
    }

    const mo = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLElement) ro.observe(node)
        }
      }

      scheduleUpdate()
    })

    mo.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    })

    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('load', scheduleUpdate)
      ro.disconnect()
      mo.disconnect()
      clearClasses()
    }
  }, [direction, node])

  return ref
}
