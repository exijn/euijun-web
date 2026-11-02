import type { ReactNode } from 'react'

export function ExternalLink({ href, children, className, label }: {
  href?: string; children: ReactNode; className?: string; label?: string
}) {
  if (!href?.trim()) return null
  const external = /^https?:\/\//.test(href)
  return <a href={href} className={className} aria-label={label} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
    {children}{external && <span className="sr-only"> (새 탭)</span>}
  </a>
}
