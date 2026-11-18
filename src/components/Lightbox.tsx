import { useEffect, useRef, type KeyboardEvent } from 'react'
import { Icon } from './Icon'

export interface LightboxItem { image: string; alt: string; caption: string }

export function Lightbox({ items, index, onClose, onNavigate }: {
  items: LightboxItem[]; index: number | null; onClose: () => void; onNavigate: (index: number) => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (index !== null) {
      returnFocus.current = document.activeElement as HTMLElement
      if (!dialog.open) dialog.showModal()
      document.body.style.overflow = 'hidden'
    } else {
      if (dialog.open) dialog.close()
      document.body.style.overflow = ''
    }
  }, [index])
  useEffect(() => () => { document.body.style.overflow = '' }, [])
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const handleClose = () => { onClose(); returnFocus.current?.focus() }
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onClose])

  if (index === null) return null
  const item = items[index]
  const go = (next: number) => onNavigate((next + items.length) % items.length)
  const handleKey = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'ArrowRight') go(index + 1)
    if (event.key === 'ArrowLeft') go(index - 1)
  }

  return <dialog ref={ref} className="lightbox" aria-label={item.caption || item.alt} onKeyDown={handleKey}>
    <div className="lightbox-top">
      <span className="lightbox-count">{index + 1} / {items.length}</span>
      <div className="lightbox-nav">
        {items.length > 1 && <button type="button" className="btn sm" aria-label="이전 화면" onClick={() => go(index - 1)}><Icon name="chevronLeft" /></button>}
        {items.length > 1 && <button type="button" className="btn sm" aria-label="다음 화면" onClick={() => go(index + 1)}><Icon name="chevronRight" /></button>}
        <button type="button" className="btn sm" aria-label="닫기" onClick={() => ref.current?.close()}><Icon name="close" /></button>
      </div>
    </div>
    <div className="lightbox-body">
      <img src={item.image} alt={item.alt} />
      {item.caption && <p className="lightbox-caption">{item.caption}</p>}
    </div>
  </dialog>
}
