import { createServer } from 'node:http'
import { createHandler } from './app.ts'
import { loadConfig } from './config.ts'
const config = loadConfig()
const port = Number(process.env.PORT || 4174)
createServer(createHandler({ config })).listen(port, process.env.HOST || '127.0.0.1', () => {
  process.stdout.write(`Site listening on http://127.0.0.1:${port}\n`)
  if (!config) process.stdout.write('Private routes are disabled: server environment is not configured.\n')
})
