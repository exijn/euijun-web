import type { SiteContent } from './content.ts'

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function renderMetadata(html: string, profile: SiteContent['profile']) {
  const title = `${profile.name} · ${profile.role}`
  const description = `${profile.tagline} ${profile.introduction}`
  const values: Record<string, string> = { description, 'og:title': title, 'og:description': description, 'og:site_name': profile.englishName, 'og:image:alt': `${profile.englishName} — ${profile.role}` }
  let result = html.replace(/<title>.*?<\/title>/, () => `<title>${escape(title)}</title>`)
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`((?:name|property)="${key}" content=")[^"]*`), (_, prefix: string) => prefix + escape(value))
  }
  const sameAs = [profile.github, profile.linkedin].filter(Boolean)
  const person = { '@context': 'https://schema.org', '@type': 'Person', name: profile.name, alternateName: profile.englishName, url: profile.website, jobTitle: profile.role, sameAs }
  const links = [profile.github ? `<a href="${escape(profile.github)}">GitHub</a>` : '', profile.email ? `<a href="mailto:${escape(profile.email)}">이메일</a>` : ''].filter(Boolean).join(' · ')
  return result.replaceAll('https://exijn.kr', () => profile.website.replace(/\/$/, ''))
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => `<script type="application/ld+json">${JSON.stringify(person).replaceAll('<', '\\u003c')}</script>`)
    .replace(/<noscript>[\s\S]*?<\/noscript>/, () => `<noscript>${escape(title)}. ${escape(description)} ${links} 전체 소개를 보려면 JavaScript를 활성화해 주세요.</noscript>`)
}
