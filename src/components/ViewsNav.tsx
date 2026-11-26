import { useEffect, useState } from 'react'
import type { View } from './layers'

/** The box in the reading zone of the screen, so the menu can mark where you are. */
function useActiveSection(ids: string[], ready: boolean) {
  const [active, setActive] = useState(ids[0])
  const key = ids.join(',')
  useEffect(() => {
    if (!ready) return
    const boxes = key
      .split(',')
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (hit) setActive(hit.target.id)
      },
      { rootMargin: '-15% 0px -70% 0px' },
    )
    boxes.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [key, ready])
  return active
}

interface Props {
  views: View[]
  /** True once the boxes are on the page. */
  ready: boolean
  onPick: () => void
}

/** Links to the boxes of the current dashboard; the one in view is marked. */
export function ViewsNav({ views, ready, onPick }: Props) {
  const active = useActiveSection(
    views.map((v) => v.id),
    ready,
  )
  return (
    <div className="side-list">
      {views.map((v) => (
        <a
          key={v.id}
          className="nav"
          href={`#${v.id}`}
          aria-current={active === v.id ? 'location' : undefined}
          onClick={onPick}
        >
          {v.label}
        </a>
      ))}
    </div>
  )
}
