import { HttpError } from './security.ts'

export type Fetcher = typeof fetch

// Vercel Blob read-write tokens look like vercel_blob_rw_<storeId>_<secret>; the store id is the
// 4th underscore-separated segment. This mirrors the (unexported) parsing the SDK itself does.
export function getStoreId(token: string): string {
  const storeId = token.split('_')[3] ?? ''
  if (!storeId) throw new Error('Invalid BLOB_READ_WRITE_TOKEN')
  return storeId
}

export function publicBlobHost(token: string): string {
  return `${getStoreId(token)}.public.blob.vercel-storage.com`
}

const MAX_PDF_BYTES = 20 * 1024 * 1024

// Constrains client-upload tokens to PDFs under portfolio/, matching the public schema's
// portfolioUrl pattern in shared/content.ts. Pure/local: no network, easy to unit test.
export function portfolioUploadConstraints(pathname: string) {
  if (!/^portfolio\/[a-zA-Z0-9/_.-]+\.pdf$/.test(pathname) || pathname.includes('..')) throw new Error('포트폴리오 PDF는 portfolio/ 경로의 .pdf 파일만 업로드할 수 있습니다.')
  return { allowedContentTypes: ['application/pdf'], maximumSizeInBytes: MAX_PDF_BYTES, addRandomSuffix: true as const, tokenPayload: null }
}

// Verifies a profile.portfolio.url before it's accepted into saved content: the host must match
// this deployment's own blob store (derived from the configured read-write token, never trusted
// from the client), and the first bytes fetched from it must be a real PDF signature.
export async function verifyPortfolioUrl(url: string, blobToken: string, fetcher: Fetcher = fetch): Promise<void> {
  // URL hosts are normalized to lowercase by the URL parser, so compare case-insensitively.
  const expectedHost = publicBlobHost(blobToken).toLowerCase()
  let parsed: URL
  try { parsed = new URL(url) } catch { throw new HttpError(422, 'PORTFOLIO_URL', '포트폴리오 PDF 주소가 올바르지 않습니다.') }
  if (parsed.protocol !== 'https:' || parsed.host !== expectedHost || !parsed.pathname.startsWith('/portfolio/') || !parsed.pathname.endsWith('.pdf')) {
    throw new HttpError(422, 'PORTFOLIO_URL', '포트폴리오 PDF 주소가 이 프로젝트의 Blob 스토어 주소와 일치하지 않습니다.')
  }
  let response: Response
  try {
    response = await fetcher(url, { headers: { Range: 'bytes=0-15' }, redirect: 'error', signal: AbortSignal.timeout(12000) })
  } catch { throw new HttpError(502, 'PORTFOLIO_UNCERTAIN', '포트폴리오 PDF 주소를 확인하지 못했습니다.') }
  if (!response.ok) throw new HttpError(422, 'PORTFOLIO_URL', '포트폴리오 PDF 파일을 찾을 수 없습니다.')
  const bytes = Buffer.from(await response.arrayBuffer())
  if (!bytes.subarray(0, 5).equals(Buffer.from('%PDF-', 'ascii'))) throw new HttpError(422, 'PORTFOLIO_FORMAT', '유효한 PDF 파일이 아닙니다.')
}
