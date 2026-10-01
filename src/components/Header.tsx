import { useEffect, useRef, useState } from 'react'
import type { SiteContent } from '../../shared/content'
import { Icon } from './Icon'
import { ExternalLink } from './ExternalLink'
const navigation = [
  { id: 'top', label: '소개' }, { id: 'work', label: '프로젝트' },
  { id: 'open-source', label: '오픈소스' }, { id: 'activities', label: '활동' }, { id: 'contact', label: '연락' },
]
export function Header({ profile }: { profile: SiteContent['profile'] }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('top')
  const toggleRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      let current = 'top'
      for (const { id } of navigation) {
        if ((document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= 150) current = id
      }
      if (window.scrollY > 100 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8) current = 'contact'
      setActive(current)
    }
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    const resize = () => { if (window.innerWidth >= 800) setOpen(false); scroll() }
    scroll()
    window.addEventListener('scroll', scroll, { passive: true })
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', scroll); window.removeEventListener('resize', resize) }
  }, [])
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) { setOpen(false); toggleRef.current?.focus() }
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [open])
  return <header className="header"><div className="container header-inner">
    <a className="wordmark" href="#top" aria-label={profile.englishName + ' 페이지 상단'}>{profile.handle}<span>.</span></a>
    <button ref={toggleRef} className="menu-toggle" type="button" aria-expanded={open} aria-controls="main-navigation" aria-label={open ? '메뉴 닫기' : '메뉴 열기'} onClick={() => setOpen(!open)}><Icon name={open ? 'close' : 'menu'} /></button>
    <nav id="main-navigation" className={'navigation ' + (open ? 'is-open' : '')} aria-label="주요 메뉴">
      {navigation.map(({ id, label }) => <a key={id} href={'#' + id} aria-current={active === id ? 'location' : undefined} onClick={() => {
        setOpen(false)
        if (open) document.getElementById(id)?.focus({ preventScroll: true })
      }}>{label}</a>)}
      <ExternalLink href={profile.github} className="nav-github">GitHub<Icon name="arrow" /></ExternalLink>
    </nav>
  </div></header>
}
