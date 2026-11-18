import { createHandler } from '../server/app.ts'
import { loadBlobToken, loadConfig } from '../server/config.ts'
export default createHandler({ config: loadConfig(), blobToken: loadBlobToken() })
