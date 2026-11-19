import { createHandler } from './app.ts'
import { loadBlobToken, loadConfig } from './config.ts'
export default createHandler({ config: loadConfig(), blobToken: loadBlobToken() })
