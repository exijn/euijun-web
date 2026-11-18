import { useEffect, useRef, useState } from 'react'
import type { SiteContent } from '../../shared/content'
import { Icon } from './Icon'
import { ExternalLink } from './ExternalLink'

export function Header({ profile, hasOss, hasActivities }: { profile: SiteContent['profile']; hasOss: boolean; hasActivities: boolean }) {
  const navigation = [
    { id: 'projects', label: '프로젝트' }, { id: 'about', label: '해 온 일' },
    ...(hasOss ? [{ id: 'oss', label: '오픈소스' }] : []),
    ...(hasActivities ? [{ id: 'activity', label: '활동' }] : []),
    { id: 'contact', label: '연락' },
  ]
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('top')
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const line = window.innerHeight * 0.35
      let current = 'top'
      for (const { id } of navigation) {
        const top = document.getElementById(id)?.getBoundingClientRect().top
        if (top !== undefined && top < line) current = id
      }
      // On short pages the last section can never cross the 35% line because the document
      // can't scroll further; once the viewport bottom reaches the page end, force it active.
      if (window.scrollY > 100 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8) {
        current = navigation[navigation.length - 1].id
      }
      setActive(current)
    }
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    const resize = () => { if (window.innerWidth >= 760) setOpen(false); scroll() }
    scroll()
    window.addEventListener('scroll', scroll, { passive: true })
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', scroll); window.removeEventListener('resize', resize) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasOss, hasActivities])

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) { setOpen(false); toggleRef.current?.focus() }
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [open])

  return <header className="hdr">
    <div className="wrap hdr-in">
      <a className="mark" href="#top" aria-label={profile.name + ', 맨 위로'}>
        <span className="mark-ic" aria-hidden="true"><Icon name="sprout" /></span>
        <span>{profile.name}</span>
      </a>
      <nav className="nav" aria-label="주요 섹션">
        {navigation.map(({ id, label }) => (
          <a key={id} href={'#' + id} className={active === id ? 'on' : ''} aria-current={active === id ? 'location' : undefined}>{label}</a>
        ))}
      </nav>
      {profile.github && <ExternalLink href={profile.github} className="btn sm gh">GitHub<Icon name="external" /></ExternalLink>}
      <button type="button" ref={toggleRef} className="btn menu-btn" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? '메뉴 닫기' : '메뉴 열기'} onClick={() => setOpen(!open)}>
        <Icon name={open ? 'close' : 'menu'} />
      </button>
    </div>
    {open && <nav id="mobile-menu" className="mpanel" aria-label="모바일 메뉴" onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false) }}>
      {navigation.map(({ id, label }) => (
        <a key={id} href={'#' + id} className={active === id ? 'on' : ''} aria-current={active === id ? 'location' : undefined} onClick={() => {
          setOpen(false)
          document.getElementById(id)?.focus({ preventScroll: true })
        }}>
          {label}<Icon name="chevronRight" />
        </a>
      ))}
    </nav>}
  </header>
}
