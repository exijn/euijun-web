type IconName = 'sprout' | 'cap' | 'down' | 'external' | 'chevronRight' | 'arrowRight' | 'menu' | 'close' | 'link'

const paths: Record<IconName, string[]> = {
  sprout: ['M12 20v-8', 'M12 12c0-4 3-6 7-6 0 4-3 6-7 6z', 'M12 14c0-3-2.5-5-6-5 0 3 2.5 5 6 5z'],
  cap: ['M2 9l10-5 10 5-10 5z', 'M6 11v5c3 2 9 2 12 0v-5'],
  down: ['M12 5v14', 'm6 13 6 6 6-6'],
  external: ['M7 17 17 7', 'M8 7h9v9'],
  chevronRight: ['m9 6 6 6-6 6'],
  arrowRight: ['M5 12h14', 'm13 6 6 6-6 6'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  close: ['m6 6 12 12', 'M18 6 6 18'],
  link: ['M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1', 'M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1'],
}

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className}
      width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      {paths[name].map((d, index) => <path key={index} d={d} />)}
    </svg>
  )
}
