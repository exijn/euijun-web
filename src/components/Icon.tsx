type IconName = 'arrow' | 'down' | 'github' | 'mail' | 'menu' | 'close' | 'plus' | 'up' | 'check'

const paths: Record<IconName, string> = {
  arrow: 'M5 19 19 5M5 5h14v14',
  down: 'M12 4v16m-6-6 6 6 6-6',
  up: 'M12 20V4m-6 6 6-6 6 6',
  mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
  menu: 'M4 7h16M4 17h16',
  close: 'm5 5 14 14M5 19 19 5',
  plus: 'M12 5v14M5 12h14',
  check: 'm5 12 4 4L19 6',
  github: 'M9 19c-4.3 1.3-4.3-2.2-6-2.7m12 5v-3.9c.1-1-.3-1.7-.7-2.1 2.5-.3 5.2-1.2 5.2-5.5 0-1.2-.4-2.2-1.1-3 .1-.3.5-1.4-.1-2.9 0 0-.9-.3-3 1.1a10.4 10.4 0 0 0-5.5 0C7.7 3.6 6.8 3.9 6.8 3.9c-.6 1.5-.2 2.6-.1 2.9-.7.8-1.1 1.8-1.1 3 0 4.3 2.7 5.2 5.2 5.5-.4.4-.8 1.1-.8 2.1v3.9',
}

export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return <svg className={`icon ${className}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}
