// Regenerates public/fonts/pretendard/*.subset.woff2 from the characters actually used in
// content/site.json and the public/editor UI copy. Run after adding content with new Hangul
// syllables the current subset doesn't cover (those fall back to the system font per character
// until regenerated — not a crash, just a quiet visual gap worth fixing by re-running this).
import subsetFont from 'subset-font'
import { mkdir, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'

const PRETENDARD_TAG = 'v1.3.9'
const WEIGHTS = { Regular: 400, Medium: 500, SemiBold: 600, Bold: 700 }
const SOURCE_FILES = [
  'content/site.json',
  'src/Site.tsx', 'src/App.tsx',
  'src/components/Header.tsx', 'src/components/Lightbox.tsx', 'src/components/ExternalLink.tsx',
  'admin/Editor.tsx',
]

function collectText() {
  let text = ''
  for (const file of SOURCE_FILES) text += readFileSync(file, 'utf8')
  return text
}

function neededChars(text) {
  const hangul = new Set()
  for (const ch of text) {
    const cp = ch.codePointAt(0)
    if ((cp >= 0xac00 && cp <= 0xd7a3) || (cp >= 0x1100 && cp <= 0x11ff) || (cp >= 0x3130 && cp <= 0x318f)) hangul.add(ch)
  }
  const ascii = Array.from({ length: 0x7f - 0x20 }, (_, i) => String.fromCharCode(0x20 + i)).join('')
  // Non-ASCII, non-Hangul symbols confirmed in use: middle dot, arrows, em dash, Korean corner
  // brackets, copyright, ellipsis, multiplication sign (e.g. "800×800" in editor help text).
  const extraSymbols = '·→—「」©↑↓…×'
  return [...hangul].sort().join('') + ascii + extraSymbols
}

async function main() {
  const chars = neededChars(collectText())
  await mkdir('public/fonts/pretendard', { recursive: true })
  for (const [name, weight] of Object.entries(WEIGHTS)) {
    const url = `https://raw.githubusercontent.com/orioncactus/pretendard/${PRETENDARD_TAG}/packages/pretendard/dist/web/static/woff2/Pretendard-${name}.woff2`
    const full = Buffer.from(await (await fetch(url)).arrayBuffer())
    const subset = await subsetFont(full, chars, { targetFormat: 'woff2' })
    const outPath = `public/fonts/pretendard/Pretendard-${name}.subset.woff2`
    await writeFile(outPath, subset)
    console.log(outPath, weight, `${(full.length / 1024).toFixed(0)} KB -> ${(subset.length / 1024).toFixed(1)} KB`)
  }
  const license = await (await fetch(`https://raw.githubusercontent.com/orioncactus/pretendard/${PRETENDARD_TAG}/LICENSE`)).text()
  await writeFile('public/fonts/pretendard/LICENSE', license)
}

await main()
