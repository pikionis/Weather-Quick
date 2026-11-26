import type { ReactNode } from 'react'

interface Props {
  id: string
  title: string
  subtitle?: ReactNode
  /** Controls on the right of the title, such as Max / Min. */
  actions?: ReactNode
  className?: string
  children: ReactNode
}

/** One box of the dashboard. Its id is what the menu's Views jump to. */
export function Section({ id, title, subtitle, actions, className = '', children }: Props) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className={`card ${className}`}>
      <div className="card-head">
        <div>
          <h2 id={`${id}-h`}>{title}</h2>
          {subtitle && <p className="sub">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  )
}
