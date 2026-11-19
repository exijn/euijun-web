import { defineConfig } from 'vite'

// Bundles the Vercel serverless entry (server/vercel.ts + its server/ and shared/ imports) into a
// single ESM file at api/index.js. Vercel's Node.js function builder does not bundle relative
// imports that use explicit .ts extensions (our local convention, needed so server/index.ts can
// also run directly under Node's native TypeScript support) — it transpiles each file but drops the
// .ts suffix from the compiled output path, so those imports 404 at runtime. Pre-bundling into one
// plain-JS file with no local relative imports sidesteps that entirely. npm-installed dependencies
// (sharp, zod, @vercel/blob) are left external so Vercel's own dependency tracing pulls them from
// node_modules as usual — sharp in particular needs its platform-specific native binary, which must
// come from node_modules rather than be inlined by a bundler.
//
// The output (api/index.js) is committed to git, not gitignored: Vercel's Node.js function
// detection scans the `api/` directory of the pre-build repository checkout before running any
// custom buildCommand, so a function file that only exists after our build step runs is invisible
// to it ("doesn't match any Serverless Functions inside the api directory"). CI verifies the
// committed file is never stale (see .github/workflows/check.yml).
const external = ['zod', 'sharp', '@vercel/blob', '@vercel/blob/client']

export default defineConfig({
  publicDir: false,
  build: {
    ssr: 'server/vercel.ts',
    outDir: 'api',
    emptyOutDir: false,
    sourcemap: false,
    rollupOptions: {
      output: { entryFileNames: 'index.js', format: 'es' },
      external: (id) => external.includes(id) || id.startsWith('node:'),
    },
  },
})
