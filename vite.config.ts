import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, readFileSync } from 'node:fs'
import { contentSchema, publicContent } from './shared/content.ts'
import { renderMetadata } from './shared/metadata.ts'

export default defineConfig({ plugins: [react(), {
  name: 'site-content',
  resolveId(id) { if (id === 'virtual:site-content') return '\0site-content' },
  load(id) {
    if (id !== '\0site-content') return
    this.addWatchFile('content/site.json')
    const content = contentSchema.parse(JSON.parse(readFileSync('content/site.json', 'utf8')))
    for (const project of content.projects.filter((item) => item.published && item.image)) {
      if (!existsSync('public' + project.image)) throw new Error(`Missing project image: ${project.image}`)
    }
    return `export default ${JSON.stringify(publicContent(content))}`
  },
  transformIndexHtml(html) {
    const { profile } = contentSchema.parse(JSON.parse(readFileSync('content/site.json', 'utf8')))
    return renderMetadata(html, profile)
  },
  generateBundle() {
    const { profile } = contentSchema.parse(JSON.parse(readFileSync('content/site.json', 'utf8')))
    const origin = new URL(profile.website).origin
    this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n` })
    this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url></urlset>` })
  },
}] })
