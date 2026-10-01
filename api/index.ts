import { createHandler } from '../server/app.ts'
import { loadConfig } from '../server/config.ts'
export default createHandler({ config: loadConfig() })
