import { createServer } from 'node:http'
import { createHandler } from '../server/app.ts'
import { mockGitHub, testConfig, testBlobToken } from './fixtures/github.ts'

const { fetcher } = mockGitHub()
createServer(createHandler({ config: testConfig, fetcher, blobToken: testBlobToken })).listen(4175, '127.0.0.1')
