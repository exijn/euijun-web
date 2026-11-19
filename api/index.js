import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { handleUpload } from "@vercel/blob/client";
import sharp from "sharp";
// shared/content.ts
var text = (max = 500) => z.string().trim().max(max).refine((value) => ![...value].some((char) => char.charCodeAt(0) < 32 && ![
	"\n",
	"\r",
	"	"
].includes(char)), "제어 문자는 사용할 수 없습니다.");
var required = (max = 100) => text(max).min(1, "필수 항목입니다.");
var link = text(500).refine((value) => {
	if (!value) return true;
	try {
		const url = new URL(value);
		return url.protocol === "https:" && !url.username && !url.password;
	} catch {
		return false;
	}
}, "https:// 주소를 입력하세요.");
var requiredUrl = (max = 500) => text(max).min(1, "필수 항목입니다.").refine((value) => {
	try {
		const url = new URL(value);
		return url.protocol === "https:" && !url.username && !url.password;
	} catch {
		return false;
	}
}, "https:// 주소를 입력하세요.");
var id = z.string().regex(/^[a-z0-9][a-z0-9-]{0,39}$/, "ID는 영문 소문자·숫자·하이픈 40자 이내입니다.");
var imagePath = (prefix) => z.string().max(200).refine((value) => !value || new RegExp(`^/images/${prefix}/[a-z0-9/_-]+\\.(webp|avif|png|jpe?g)$`).test(value), "이미지 경로를 확인하세요.");
var image = imagePath("projects");
var color = z.string().regex(/^#[0-9a-f]{6}$/i, "색상은 #rrggbb 형식의 16진수입니다.");
var portfolioUrl = z.string().max(500).refine((value) => !value || /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/portfolio\/[a-zA-Z0-9/_.-]+\.pdf$/.test(value), "Vercel Blob의 portfolio/ 경로 PDF 주소만 허용합니다.");
var base = {
	id,
	published: z.boolean()
};
var projectSchema = z.object({
	...base,
	name: required(60),
	headline: required(150),
	team: text(60),
	role: required(150),
	status: text(60),
	color,
	technologies: z.array(required(50)).max(8),
	work: z.array(required(200)).min(1).max(8),
	note: text(400),
	image,
	imageAlt: text(200),
	github: link,
	screenshots: z.array(z.object({
		...base,
		image,
		alt: required(200),
		caption: text(300)
	}).strict()).max(4),
	documents: z.array(z.object({
		...base,
		label: required(100),
		url: requiredUrl()
	}).strict()).max(8)
}).strict().refine((value) => !value.image || Boolean(value.imageAlt), {
	message: "이미지 설명(alt)을 입력하세요.",
	path: ["imageAlt"]
});
var waySchema = z.object({
	...base,
	title: required(100),
	sub: text(150),
	text: required(500)
}).strict();
var photoSchema = z.object({
	image: imagePath("profile"),
	alt: text(200)
}).strict().refine((value) => !value.image || Boolean(value.alt), {
	message: "사진 설명(alt)을 입력하세요.",
	path: ["alt"]
});
var portfolioSchema = z.object({
	label: text(100),
	url: portfolioUrl,
	updatedAt: z.union([z.literal(""), z.iso.date()])
}).strict().refine((value) => !value.url || Boolean(value.label), {
	message: "포트폴리오 PDF 라벨을 입력하세요.",
	path: ["label"]
});
var contentSchema = z.object({
	schemaVersion: z.literal(3),
	profile: z.object({
		name: required(50),
		englishName: required(80),
		role: required(80),
		tagline: required(200),
		introduction: required(600),
		school: required(150),
		schoolShort: required(60),
		email: z.union([z.literal(""), z.email().max(150)]),
		github: link,
		linkedin: link,
		website: z.url().refine((value) => {
			try {
				const url = new URL(value);
				return url.protocol === "https:" && url.pathname === "/" && !url.search && !url.hash && !url.username && !url.password;
			} catch {
				return false;
			}
		}, "https:// 도메인 주소만 입력하세요."),
		domain: required(100),
		contactText: required(300),
		photo: photoSchema,
		portfolio: portfolioSchema
	}).strict(),
	projects: z.array(projectSchema).max(12),
	ways: z.array(waySchema).max(6),
	openSource: z.object({
		checkedAt: z.iso.date(),
		contributions: z.array(z.object({
			...base,
			name: required(100),
			repo: text(150),
			description: required(300),
			url: z.url().refine((value) => /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+$/.test(value), "GitHub PR 주소를 입력하세요."),
			number: z.number().int().positive(),
			status: z.enum([
				"merged",
				"open",
				"closed",
				"reverted"
			])
		}).strict().refine((item) => item.url.endsWith("/pull/" + item.number), {
			message: "PR 번호와 URL이 일치해야 합니다.",
			path: ["number"]
		})).max(50)
	}).strict(),
	activities: z.array(z.object({
		...base,
		period: text(80),
		title: required(150),
		description: text(600)
	}).strict()).max(30),
	skills: z.array(z.object({
		...base,
		name: required(60),
		items: z.array(required(60)).min(1).max(20)
	}).strict()).max(8)
}).strict().superRefine((content, ctx) => {
	for (const [path, items] of [
		[["projects"], content.projects],
		[["ways"], content.ways],
		[["openSource", "contributions"], content.openSource.contributions],
		[["activities"], content.activities],
		[["skills"], content.skills]
	]) {
		const ids = /* @__PURE__ */ new Set();
		items.forEach((item, index) => {
			if (ids.has(item.id)) ctx.addIssue({
				code: "custom",
				path: [
					...path,
					index,
					"id"
				],
				message: "ID가 중복되었습니다."
			});
			ids.add(item.id);
		});
	}
	content.projects.forEach((project, projectIndex) => {
		for (const [key, items] of [["screenshots", project.screenshots], ["documents", project.documents]]) {
			const ids = /* @__PURE__ */ new Set();
			items.forEach((item, index) => {
				if (ids.has(item.id)) ctx.addIssue({
					code: "custom",
					path: [
						"projects",
						projectIndex,
						key,
						index,
						"id"
					],
					message: "ID가 중복되었습니다."
				});
				ids.add(item.id);
			});
		}
	});
});
// server/security.ts
var HttpError = class extends Error {
	status;
	code;
	constructor(status, code, message) {
		super(message);
		this.status = status;
		this.code = code;
	}
};
var random = () => randomBytes(32).toString("base64url");
var digest = (value) => createHash("sha256").update(value).digest("hex");
function equal(a, b) {
	const x = Buffer.from(a);
	const y = Buffer.from(b);
	return x.length === y.length && timingSafeEqual(x, y);
}
function seal(value, purpose, config) {
	const iv = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", config.secret, iv);
	cipher.setAAD(Buffer.from(purpose));
	return [
		iv,
		Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]),
		cipher.getAuthTag()
	].map((part) => part.toString("base64url")).join(".");
}
function unseal(token, purpose, config) {
	if (!token || token.length > 4096) return null;
	try {
		const parts = token.split(".");
		if (parts.length !== 3) return null;
		const [iv, data, tag] = parts.map((part) => Buffer.from(part, "base64url"));
		if (iv.length !== 12 || tag.length !== 16) return null;
		const cipher = createDecipheriv("aes-256-gcm", config.secret, iv);
		cipher.setAAD(Buffer.from(purpose));
		cipher.setAuthTag(tag);
		return JSON.parse(Buffer.concat([cipher.update(data), cipher.final()]).toString("utf8"));
	} catch {
		return null;
	}
}
var SESSION_COOKIE = "__Host-session";
var OAUTH_COOKIE = "__Host-oauth";
function cookie(name, value, age) {
	return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
}
function cookies(header = "") {
	const result = {};
	for (const part of header.split(";")) {
		const at = part.indexOf("=");
		if (at > 0) result[part.slice(0, at).trim()] = part.slice(at + 1).trim();
	}
	return result;
}
var sessionSchema = z.object({
	id: z.number().int(),
	login: z.literal("exijn"),
	csrf: z.string().min(40),
	expires: z.number(),
	issued: z.number()
}).strict();
function readSession(token, config, now = Date.now()) {
	const session = sessionSchema.safeParse(unseal(token, "session", config));
	if (!session.success || session.data.id !== config.ownerId || session.data.expires <= now || session.data.issued > now || session.data.expires - session.data.issued > 36e5) return null;
	return session.data;
}
var Limiter = class {
	entries = /* @__PURE__ */ new Map();
	take(key, max, now = Date.now()) {
		for (const [id, value] of this.entries) if (value.until <= now) this.entries.delete(id);
		const value = this.entries.get(key) ?? {
			count: 0,
			until: now + 6e4
		};
		value.count++;
		this.entries.set(key, value);
		if (value.count > max) throw new HttpError(429, "RATE_LIMIT", "요청이 많습니다. 잠시 후 다시 시도하세요.");
	}
};
// server/github.ts
var GitHub = class {
	config;
	fetcher;
	constructor(config, fetcher = fetch) {
		this.config = config;
		this.fetcher = fetcher;
	}
	async request(path, method = "GET", data) {
		let response;
		try {
			response = await this.fetcher(`https://api.github.com/repos/${this.config.repository}${path}`, {
				method,
				headers: {
					Authorization: `Bearer ${this.config.contentToken}`,
					Accept: "application/vnd.github+json",
					"X-GitHub-Api-Version": "2022-11-28",
					"Content-Type": "application/json",
					"User-Agent": "euijun-content-editor"
				},
				body: data === void 0 ? void 0 : JSON.stringify(data),
				signal: AbortSignal.timeout(12e3),
				redirect: "error"
			});
		} catch {
			throw new HttpError(502, "GITHUB_UNCERTAIN", "GitHub 응답을 확인하지 못했습니다. 변경이 생성되었을 수 있으니 저장소의 PR·브랜치를 먼저 확인하세요.");
		}
		if (!response.ok) {
			if (response.status === 409) throw new HttpError(409, "GITHUB_CONFLICT", "저장소가 비어 있거나 변경이 충돌했습니다. 기본 브랜치를 확인하세요.");
			throw new HttpError(502, "GITHUB_ERROR", `GitHub 요청 실패 (${response.status}). 권한·요청 제한·저장소 상태를 확인하세요. 성공으로 처리하지 않았습니다.`);
		}
		return response.json();
	}
	async head() {
		const repo = await this.request("");
		const ref = await this.request(`/git/ref/heads/${encodeURIComponent(repo.default_branch)}`);
		return {
			branch: repo.default_branch,
			sha: ref.object.sha
		};
	}
	async snapshot() {
		const head = await this.head();
		const file = await this.request(`/contents/content/site.json?ref=${head.sha}`);
		if (file.encoding !== "base64") throw new HttpError(502, "CONTENT_FORMAT", "콘텐츠 파일 형식을 확인하세요.");
		return {
			...head,
			content: JSON.parse(Buffer.from(file.content, "base64").toString("utf8"))
		};
	}
	async status(number) {
		const pr = await this.request(`/pulls/${number}`);
		if (!pr.head.ref.startsWith("content/") || pr.head.repo.full_name !== this.config.repository || pr.base.repo.full_name !== this.config.repository) throw new HttpError(404, "NOT_FOUND", "Not found");
		if (!pr.merged || !pr.merge_commit_sha) return {
			phase: pr.state === "closed" ? "closed" : "review",
			message: pr.state === "closed" ? "병합하지 않고 종료되었습니다." : "PR 검토 대기 중입니다. 아직 공개 사이트에 반영되지 않았습니다.",
			url: pr.html_url
		};
		try {
			const production = (await this.request(`/deployments?sha=${pr.merge_commit_sha}&per_page=10`)).find((deployment) => deployment.environment.toLowerCase() === "production");
			if (!production) return {
				phase: "merged",
				message: "병합 완료. Production 배포 기록은 아직 없습니다.",
				url: pr.html_url
			};
			const state = (await this.request(`/deployments/${production.id}/statuses?per_page=1`))[0]?.state;
			return {
				phase: state === "success" ? "deployed" : ["failure", "error"].includes(state) ? "failed" : "deploying",
				message: state === "success" ? "GitHub Production 배포 성공 기록을 확인했습니다." : ["failure", "error"].includes(state) ? "배포가 실패했습니다. 배포 플랫폼 로그를 확인하세요." : "배포 진행 중입니다.",
				url: pr.html_url
			};
		} catch {
			return {
				phase: "unknown",
				message: "병합은 완료됐지만 배포 상태를 조회하지 못했습니다. 배포 플랫폼을 확인하세요.",
				url: pr.html_url
			};
		}
	}
};
// server/blob.ts
function getStoreId(token) {
	const storeId = token.split("_")[3] ?? "";
	if (!storeId) throw new Error("Invalid BLOB_READ_WRITE_TOKEN");
	return storeId;
}
function publicBlobHost(token) {
	return `${getStoreId(token)}.public.blob.vercel-storage.com`;
}
var MAX_PDF_BYTES = 20971520;
function portfolioUploadConstraints(pathname) {
	if (!/^portfolio\/[a-zA-Z0-9/_.-]+\.pdf$/.test(pathname) || pathname.includes("..")) throw new Error("포트폴리오 PDF는 portfolio/ 경로의 .pdf 파일만 업로드할 수 있습니다.");
	return {
		allowedContentTypes: ["application/pdf"],
		maximumSizeInBytes: MAX_PDF_BYTES,
		addRandomSuffix: true,
		tokenPayload: null
	};
}
async function verifyPortfolioUrl(url, blobToken, fetcher = fetch) {
	const expectedHost = publicBlobHost(blobToken).toLowerCase();
	let parsed;
	try {
		parsed = new URL(url);
	} catch {
		throw new HttpError(422, "PORTFOLIO_URL", "포트폴리오 PDF 주소가 올바르지 않습니다.");
	}
	if (parsed.protocol !== "https:" || parsed.host !== expectedHost || !parsed.pathname.startsWith("/portfolio/") || !parsed.pathname.endsWith(".pdf")) throw new HttpError(422, "PORTFOLIO_URL", "포트폴리오 PDF 주소가 이 프로젝트의 Blob 스토어 주소와 일치하지 않습니다.");
	let response;
	try {
		response = await fetcher(url, {
			headers: { Range: "bytes=0-15" },
			redirect: "error",
			signal: AbortSignal.timeout(12e3)
		});
	} catch {
		throw new HttpError(502, "PORTFOLIO_UNCERTAIN", "포트폴리오 PDF 주소를 확인하지 못했습니다.");
	}
	if (!response.ok) throw new HttpError(422, "PORTFOLIO_URL", "포트폴리오 PDF 파일을 찾을 수 없습니다.");
	if (!Buffer.from(await response.arrayBuffer()).subarray(0, 5).equals(Buffer.from("%PDF-", "ascii"))) throw new HttpError(422, "PORTFOLIO_FORMAT", "유효한 PDF 파일이 아닙니다.");
}
// server/content-service.ts
var RESIZE = {
	profilePhoto: {
		width: 800,
		height: 800
	},
	projectImage: {
		width: 1600,
		height: 900
	},
	projectScreenshot: {
		width: 1600,
		height: 1600
	}
};
var uploadItemSchema = z.object({
	kind: z.enum([
		"profilePhoto",
		"projectImage",
		"projectScreenshot"
	]),
	projectId: z.string().regex(/^[a-z0-9-]{1,40}$/).optional(),
	screenshotId: z.string().regex(/^[a-z0-9-]{1,40}$/).optional(),
	data: z.string().max(18e5).regex(/^[A-Za-z0-9+/]+={0,2}$/)
}).strict();
var inputSchema = z.object({
	baseSha: z.string().regex(/^[a-f0-9]{40}$/),
	content: contentSchema,
	uploads: z.array(uploadItemSchema).max(6),
	reviewToken: z.string().max(4096).optional()
}).strict();
function differences(before, after, path = "") {
	if (JSON.stringify(before) === JSON.stringify(after)) return [];
	if (before && after && typeof before === "object" && typeof after === "object" && !Array.isArray(before) && !Array.isArray(after)) {
		const a = before;
		const b = after;
		return [.../* @__PURE__ */ new Set([...Object.keys(a), ...Object.keys(b)])].flatMap((key) => differences(a[key], b[key], path ? `${path}.${key}` : key));
	}
	return [{
		path,
		before: JSON.stringify(before ?? null, null, 2),
		after: JSON.stringify(after ?? null, null, 2)
	}];
}
async function prepare(value, blobToken = null, fetcher = fetch) {
	const parsed = inputSchema.safeParse(value);
	if (!parsed.success) throw new HttpError(422, "VALIDATION", parsed.error.issues.map((item) => `${item.path.join(".")}: ${item.message}`).join("\n"));
	const input = parsed.data;
	const content = structuredClone(input.content);
	const files = [];
	const seen = /* @__PURE__ */ new Set();
	for (const upload of input.uploads) {
		const dedupeKey = upload.kind === "profilePhoto" ? "profilePhoto" : upload.kind === "projectImage" ? `projectImage:${upload.projectId}` : `projectScreenshot:${upload.projectId}:${upload.screenshotId}`;
		if (seen.has(dedupeKey)) throw new HttpError(422, "IMAGE_TARGET", "같은 이미지 대상에 중복된 업로드가 있습니다.");
		seen.add(dedupeKey);
		const bytes = Buffer.from(upload.data, "base64");
		if (bytes.length > 2097152) throw new HttpError(413, "IMAGE_SIZE", "이미지는 2 MB 이하여야 합니다.");
		if (!(bytes.subarray(0, 8).equals(Buffer.from([
			137,
			80,
			78,
			71,
			13,
			10,
			26,
			10
		])) || bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 || bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" || bytes.toString("ascii", 4, 8) === "ftyp" && ["avif", "avis"].includes(bytes.toString("ascii", 8, 12)))) throw new HttpError(422, "IMAGE_FORMAT", "지원하지 않는 이미지 형식입니다. SVG는 허용하지 않습니다.");
		let data;
		try {
			const image = sharp(bytes, {
				limitInputPixels: 24e6,
				animated: false,
				failOn: "warning"
			});
			const meta = await image.metadata();
			if (![
				"jpeg",
				"png",
				"webp",
				"avif",
				"heif"
			].includes(meta.format ?? "") || (meta.pages ?? 1) > 1) throw new Error("Invalid format");
			const bounds = RESIZE[upload.kind];
			data = await image.rotate().resize({
				width: bounds.width,
				height: bounds.height,
				fit: "inside",
				withoutEnlargement: true
			}).webp({ quality: 82 }).toBuffer();
		} catch {
			throw new HttpError(422, "IMAGE_FORMAT", "유효한 정적 JPEG·PNG·WebP·AVIF 이미지만 사용할 수 있습니다. SVG·애니메이션·과도한 해상도는 허용하지 않습니다.");
		}
		const path = `public/images/${upload.kind === "profilePhoto" ? "profile" : "projects"}/uploads/${digest(data)}.webp`;
		const publicPath = path.replace(/^public/, "");
		files.push({
			path,
			data
		});
		if (upload.kind === "profilePhoto") content.profile.photo.image = publicPath;
		else {
			const project = content.projects.find((item) => item.id === upload.projectId);
			if (!project) throw new HttpError(422, "IMAGE_PROJECT", "이미지의 프로젝트 ID를 찾을 수 없습니다.");
			if (upload.kind === "projectImage") project.image = publicPath;
			else {
				const shot = project.screenshots.find((item) => item.id === upload.screenshotId);
				if (!shot) throw new HttpError(422, "IMAGE_PROJECT", "이미지의 캡처 항목을 찾을 수 없습니다.");
				shot.image = publicPath;
			}
		}
	}
	if (content.profile.portfolio.url) {
		if (!blobToken) throw new HttpError(422, "PORTFOLIO_URL", "포트폴리오 PDF 저장소가 설정되지 않아 확인할 수 없습니다.");
		await verifyPortfolioUrl(content.profile.portfolio.url, blobToken, fetcher);
	}
	if (!contentSchema.safeParse(content).success) throw new HttpError(422, "VALIDATION", "업로드한 이미지에 설명(alt)을 입력하세요.");
	return {
		input,
		content,
		files,
		fingerprint: digest(JSON.stringify({
			baseSha: input.baseSha,
			content,
			files: files.map((file) => [file.path, digest(file.data)])
		}))
	};
}
var ContentService = class {
	github;
	config;
	blobToken;
	fetcher;
	constructor(github, config, blobToken = null, fetcher = fetch) {
		this.github = github;
		this.config = config;
		this.blobToken = blobToken;
		this.fetcher = fetcher;
	}
	async review(value) {
		const prepared = await prepare(value, this.blobToken, this.fetcher);
		const snapshot = await this.github.snapshot();
		if (snapshot.sha !== prepared.input.baseSha) throw new HttpError(409, "STALE_HEAD", "기본 브랜치가 변경되었습니다. 초안을 보관한 뒤 최신 내용을 다시 불러와 비교하세요.");
		const changes = differences(contentSchema.parse(snapshot.content), prepared.content);
		if (!changes.length && !prepared.files.length) throw new HttpError(422, "NO_CHANGES", "변경 사항이 없습니다.");
		const reviewToken = seal({
			digest: prepared.fingerprint,
			expires: Date.now() + 6e5
		}, "review", this.config);
		return {
			changes,
			images: prepared.files.map((file) => file.path),
			reviewToken
		};
	}
	async save(value) {
		const prepared = await prepare(value, this.blobToken, this.fetcher);
		const ticket = z.object({
			digest: z.string(),
			expires: z.number()
		}).safeParse(unseal(prepared.input.reviewToken, "review", this.config));
		if (!ticket.success || ticket.data.expires <= Date.now() || !equal(ticket.data.digest, prepared.fingerprint)) throw new HttpError(409, "REVIEW_REQUIRED", "변경 내용을 다시 확인한 뒤 저장하세요.");
		const head = await this.github.head();
		if (head.sha !== prepared.input.baseSha) throw new HttpError(409, "STALE_HEAD", "기본 브랜치가 변경되어 저장을 중단했습니다. 최신 내용을 다시 불러오세요.");
		const commit = await this.github.request(`/git/commits/${head.sha}`);
		const entries = [];
		for (const file of [{
			path: "content/site.json",
			data: Buffer.from(JSON.stringify(prepared.content, null, 2) + "\n")
		}, ...prepared.files]) {
			const blob = await this.github.request("/git/blobs", "POST", {
				content: file.data.toString("base64"),
				encoding: "base64"
			});
			entries.push({
				path: file.path,
				mode: "100644",
				type: "blob",
				sha: blob.sha
			});
		}
		const tree = await this.github.request("/git/trees", "POST", {
			base_tree: commit.tree.sha,
			tree: entries
		});
		const message = "content: update site content" + (prepared.files.length ? " and project images" : "");
		const next = await this.github.request("/git/commits", "POST", {
			message,
			tree: tree.sha,
			parents: [head.sha]
		});
		if ((await this.github.head()).sha !== head.sha) throw new HttpError(409, "STALE_HEAD", "저장 중 기본 브랜치가 변경되었습니다. 브랜치·PR을 생성하지 않았습니다.");
		const branch = `content/${prepared.fingerprint.slice(0, 24)}`;
		await this.github.request("/git/refs", "POST", {
			ref: `refs/heads/${branch}`,
			sha: next.sha
		});
		if ((await this.github.head()).sha !== head.sha) throw new HttpError(409, "STALE_HEAD", `기본 브랜치가 변경되어 PR 생성을 중단했습니다. ${branch} 브랜치는 보존했습니다.`);
		try {
			const pr = await this.github.request("/pulls", "POST", {
				title: message,
				head: branch,
				base: head.branch,
				body: `웹 편집기에서 검토한 콘텐츠 변경입니다.\n\n- 기준 SHA: ${head.sha}\n- 변경 파일: content/site.json${prepared.files.length ? ", 프로젝트 이미지" : ""}\n- 서버 스키마·권한·CSRF·이미지 검증 통과\n\n미리보기와 CI를 확인한 뒤 병합하세요. 기본 브랜치 병합 후 Git 연동 배포가 시작됩니다.`
			});
			return {
				number: pr.number,
				url: pr.html_url,
				commit: next.sha,
				phase: "review",
				message: "변경 PR을 만들었습니다. 병합 전까지 공개 콘텐츠는 바뀌지 않습니다."
			};
		} catch {
			throw new HttpError(502, "PR_UNCERTAIN", `콘텐츠 브랜치 ${branch}는 생성되었습니다. PR 결과를 확인하지 못했으므로 GitHub에서 먼저 확인하세요. 자동 재시도하지 않습니다.`);
		}
	}
};
// server/app.ts
var MAX_BODY = 4194304;
var contentTypes = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".svg": "image/svg+xml",
	".png": "image/png",
	".webp": "image/webp",
	".avif": "image/avif",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".xml": "application/xml",
	".txt": "text/plain; charset=utf-8"
};
function send(res, status, value) {
	res.statusCode = status;
	res.setHeader("Content-Type", "application/json; charset=utf-8");
	res.end(JSON.stringify(value));
}
async function body(req) {
	if (!req.headers["content-type"]?.startsWith("application/json")) throw new HttpError(415, "CONTENT_TYPE", "JSON 요청만 허용합니다.");
	if (Number(req.headers["content-length"] ?? 0) > MAX_BODY) throw new HttpError(413, "BODY_SIZE", "전체 요청은 4 MB 이하여야 합니다.");
	const supplied = req.body;
	if (supplied !== void 0) {
		if (Buffer.byteLength(JSON.stringify(supplied)) > MAX_BODY) throw new HttpError(413, "BODY_SIZE", "전체 요청은 4 MB 이하여야 합니다.");
		return supplied;
	}
	const chunks = [];
	let size = 0;
	for await (const chunk of req) {
		const bytes = Buffer.from(chunk);
		size += bytes.length;
		if (size > MAX_BODY) throw new HttpError(413, "BODY_SIZE", "전체 요청은 4 MB 이하여야 합니다.");
		chunks.push(bytes);
	}
	try {
		return JSON.parse(Buffer.concat(chunks).toString("utf8"));
	} catch {
		throw new HttpError(400, "JSON", "JSON 형식이 올바르지 않습니다.");
	}
}
function createHandler({ config, root = process.cwd(), fetcher = fetch, blobToken = null }) {
	const limiter = new Limiter();
	const github = config ? new GitHub(config, fetcher) : null;
	const service = github && config ? new ContentService(github, config, blobToken, fetcher) : null;
	async function serve(res, directory, path, head = false) {
		const base = resolve(root, directory);
		const filename = resolve(base, "." + path);
		if (!filename.startsWith(base + sep)) throw new HttpError(404, "NOT_FOUND", "Not found");
		let data;
		try {
			data = await readFile(filename);
		} catch {
			throw new HttpError(404, "NOT_FOUND", "Not found");
		}
		res.setHeader("Content-Type", contentTypes[extname(filename)] ?? "application/octet-stream");
		res.end(head ? void 0 : data);
	}
	return async (req, res) => {
		res.setHeader("X-Content-Type-Options", "nosniff");
		res.setHeader("X-Frame-Options", "DENY");
		res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
		try {
			const url = new URL(req.url ?? "/", "http://localhost");
			const path = decodeURIComponent(url.pathname);
			if (!(path === "/manage" || path.startsWith("/manage/") || path.startsWith("/api/") || path.startsWith("/auth/") || path.startsWith("/private-assets/"))) {
				if (!["GET", "HEAD"].includes(req.method ?? "")) throw new HttpError(405, "METHOD", "Method not allowed");
				if (!/^\/(?:$|index\.html$|favicon\.svg$|robots\.txt$|sitemap\.xml$|assets\/[a-zA-Z0-9_.-]+$|images\/[a-zA-Z0-9/_.-]+$|fonts\/[a-zA-Z0-9/_.-]+$)/.test(path) || path.includes("..") || path.includes("\\")) throw new HttpError(404, "NOT_FOUND", "Not found");
				return await serve(res, "dist", path === "/" ? "/index.html" : path, req.method === "HEAD");
			}
			res.setHeader("Cache-Control", "private, no-store, max-age=0");
			res.setHeader("Vary", "Cookie");
			res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
			res.setHeader("Referrer-Policy", "no-referrer");
			res.setHeader("Content-Security-Policy", "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src 'self' https://vercel.com; font-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
			if (!config || !github || !service) throw new HttpError(404, "NOT_FOUND", "Not found");
			const stored = cookies(req.headers.cookie);
			const session = readSession(stored[SESSION_COOKIE], config);
			const redirect = (location) => {
				res.statusCode = 303;
				res.setHeader("Location", location);
				res.end();
			};
			if (path === "/auth/github" && req.method === "GET") {
				limiter.take("oauth", 10);
				const state = random();
				const verifier = random();
				res.setHeader("Set-Cookie", cookie(OAUTH_COOKIE, seal({
					state,
					verifier,
					expires: Date.now() + 6e5
				}, "oauth", config), 600));
				return redirect("https://github.com/login/oauth/authorize?" + new URLSearchParams({
					client_id: config.clientId,
					redirect_uri: config.origin + "/auth/callback",
					state,
					scope: "read:user",
					code_challenge: createHash("sha256").update(verifier).digest("base64url"),
					code_challenge_method: "S256",
					allow_signup: "false"
				}));
			}
			if (path === "/auth/callback" && req.method === "GET") {
				limiter.take("oauth-callback", 10);
				res.setHeader("Set-Cookie", cookie(OAUTH_COOKIE, "", 0));
				const flow = z.object({
					state: z.string(),
					verifier: z.string(),
					expires: z.number()
				}).safeParse(unseal(stored[OAUTH_COOKIE], "oauth", config));
				const code = url.searchParams.get("code");
				if (!flow.success || flow.data.expires <= Date.now() || !equal(flow.data.state, url.searchParams.get("state") ?? "") || !code || code.length > 200) throw new HttpError(403, "OAUTH_STATE", "인증을 다시 시작하세요.");
				const tokenResponse = await fetcher("https://github.com/login/oauth/access_token", {
					method: "POST",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json"
					},
					redirect: "error",
					signal: AbortSignal.timeout(12e3),
					body: JSON.stringify({
						client_id: config.clientId,
						client_secret: config.clientSecret,
						code,
						redirect_uri: config.origin + "/auth/callback",
						code_verifier: flow.data.verifier
					})
				});
				if (!tokenResponse.ok) throw new HttpError(502, "OAUTH_EXCHANGE", "인증 공급자 응답을 확인하지 못했습니다.");
				const token = z.object({
					access_token: z.string().min(1),
					token_type: z.literal("bearer")
				}).safeParse(await tokenResponse.json());
				if (!token.success) throw new HttpError(403, "OAUTH_EXCHANGE", "GitHub 인증에 실패했습니다.");
				const userResponse = await fetcher("https://api.github.com/user", {
					headers: {
						Authorization: `Bearer ${token.data.access_token}`,
						Accept: "application/vnd.github+json",
						"User-Agent": "euijun-content-editor"
					},
					redirect: "error",
					signal: AbortSignal.timeout(12e3)
				});
				if (!userResponse.ok) throw new HttpError(403, "IDENTITY", "계정을 확인하지 못했습니다.");
				const user = z.object({
					id: z.number(),
					login: z.string()
				}).parse(await userResponse.json());
				if (user.id !== config.ownerId || user.login.toLowerCase() !== "exijn") throw new HttpError(403, "FORBIDDEN", "접근할 수 없습니다.");
				const now = Date.now();
				const value = seal({
					id: user.id,
					login: "exijn",
					csrf: random(),
					issued: now,
					expires: now + 36e5
				}, "session", config);
				res.setHeader("Set-Cookie", [cookie(OAUTH_COOKIE, "", 0), cookie(SESSION_COOKIE, value, 3600)]);
				return redirect("/manage");
			}
			if (path === "/manage" && req.method === "GET" && !session) {
				res.setHeader("Content-Type", "text/html; charset=utf-8");
				return res.end("<!doctype html><html lang=\"ko\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"robots\" content=\"noindex,nofollow\"><title>계속하기</title><body><main><h1>계속하기</h1><p><a href=\"/auth/github\">GitHub로 계속</a></p></main></body></html>");
			}
			if (!session) throw new HttpError(404, "NOT_FOUND", "Not found");
			limiter.take("session:" + session.csrf, 120);
			if (req.method === "POST") {
				if (req.headers.origin !== config.origin || !equal(String(req.headers["x-csrf-token"] ?? ""), session.csrf)) throw new HttpError(403, "CSRF", "요청 출처 또는 세션을 확인하세요.");
				limiter.take("write:" + session.csrf, 12);
			}
			if (path === "/manage" && req.method === "GET") return await serve(res, ".private", "/index.html");
			if (/^\/private-assets\/assets\/[a-zA-Z0-9_-]+\.(js|css)$/.test(path) && req.method === "GET") return await serve(res, ".private", path.replace("/private-assets", ""));
			if (path === "/api/manage/content" && req.method === "GET") {
				const snapshot = await github.snapshot();
				return send(res, 200, {
					content: contentSchema.parse(snapshot.content),
					baseSha: snapshot.sha,
					branch: snapshot.branch,
					csrf: session.csrf,
					blobEnabled: Boolean(blobToken)
				});
			}
			if (path === "/api/manage/review" && req.method === "POST") return send(res, 200, await service.review(await body(req)));
			if (path === "/api/manage/save" && req.method === "POST") return send(res, 201, await service.save(await body(req)));
			if (path === "/api/manage/logout" && req.method === "POST") {
				res.setHeader("Set-Cookie", cookie(SESSION_COOKIE, "", 0));
				return send(res, 200, { ok: true });
			}
			if (path === "/api/manage/status" && req.method === "GET" && /^\d{1,9}$/.test(url.searchParams.get("pr") ?? "")) return send(res, 200, await github.status(Number(url.searchParams.get("pr"))));
			if (path === "/api/manage/blob-upload" && req.method === "POST") {
				if (!blobToken) throw new HttpError(404, "NOT_FOUND", "Not found");
				const requestBody = await body(req);
				try {
					return send(res, 200, await handleUpload({
						request: req,
						body: requestBody,
						token: blobToken,
						onBeforeGenerateToken: async (pathname) => portfolioUploadConstraints(pathname)
					}));
				} catch (error) {
					throw new HttpError(422, "BLOB_UPLOAD", error instanceof Error ? error.message : "업로드 토큰을 만들지 못했습니다.");
				}
			}
			throw new HttpError(404, "NOT_FOUND", "Not found");
		} catch (error) {
			if (res.headersSent) {
				res.end();
				return;
			}
			if (error instanceof HttpError) return send(res, error.status, {
				code: error.code,
				error: error.message
			});
			return send(res, 500, {
				code: "SERVER_ERROR",
				error: "요청을 처리하지 못했습니다. 저장 결과가 불명확하다면 GitHub를 확인하세요."
			});
		}
	};
}
// server/config.ts
function loadConfig(env = process.env) {
	if ([
		"APP_ORIGIN",
		"GITHUB_CLIENT_ID",
		"GITHUB_CLIENT_SECRET",
		"GITHUB_OWNER_ID",
		"GITHUB_REPOSITORY",
		"GITHUB_CONTENT_TOKEN",
		"SESSION_SECRET"
	].some((key) => !env[key]?.trim())) return null;
	const origin = new URL(env.APP_ORIGIN);
	const local = ["localhost", "127.0.0.1"].includes(origin.hostname) && env.NODE_ENV !== "production" && !env.VERCEL;
	if (!["http:", "https:"].includes(origin.protocol) || !local && origin.protocol !== "https:" || origin.pathname !== "/" || origin.search || origin.hash || origin.username || origin.password) throw new Error("Invalid APP_ORIGIN");
	const secret = Buffer.from(env.SESSION_SECRET, "base64");
	if (secret.length !== 32 || secret.toString("base64") !== env.SESSION_SECRET) throw new Error("SESSION_SECRET must be 32 random bytes in base64");
	if (!/^exijn\/[a-zA-Z0-9_.-]+$/.test(env.GITHUB_REPOSITORY)) throw new Error("Repository must belong to exijn");
	const ownerId = Number(env.GITHUB_OWNER_ID);
	if (!Number.isSafeInteger(ownerId) || ownerId <= 0) throw new Error("Invalid owner ID");
	return {
		origin: origin.origin,
		clientId: env.GITHUB_CLIENT_ID,
		clientSecret: env.GITHUB_CLIENT_SECRET,
		ownerId,
		repository: env.GITHUB_REPOSITORY,
		contentToken: env.GITHUB_CONTENT_TOKEN,
		secret
	};
}
function loadBlobToken(env = process.env) {
	const token = env.BLOB_READ_WRITE_TOKEN?.trim();
	return token ? token : null;
}
// server/vercel.ts
var vercel_default = createHandler({
	config: loadConfig(),
	blobToken: loadBlobToken()
});
export { vercel_default as default };
