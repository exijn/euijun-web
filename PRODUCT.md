# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: someone who scanned a QR code on 한의준's physical business card (recruiter, collaborator, teacher, or peer) and lands on the site with brief attention and often on a phone. Their job is to quickly answer "who is this person, what have they actually built, and how do I reach them" — not to browse at length.

## Product Purpose

A calm personal activity hub: profile, project portfolio, categorized work history ("해 온 일"), open-source contributions, school activities, and contact information, all sourced from a single structured content file. Success means a visitor can, within a short visit, understand the person's role and concrete work and take one action (open a project, view a GitHub profile, or make contact).

## Positioning

Not a commercial product and not competing on marketing polish. Its differentiator versus a generic resume page is that claims are backed by verifiable evidence — linked, merged GitHub PRs for open-source contributions, and named team/role/tech facts for each project — rather than unverifiable prose.

## Operating Context

Discovered via a QR code on a physical business card, so first contact is frequently mobile. Content is maintained through a separate, GitHub-OAuth-authenticated admin editor that writes `content/site.json` via a review → PR → merge flow; the public site always reflects the last merged state, not unmerged edits. `published: false` hides draft or unverified items from the public build without deleting them.

## Capabilities and Constraints

- Fixed section order: hero → projects (tabbed, with a detail panel) → 해 온 일 (work-by-category) → 오픈소스 기여 → 학교 활동 → 연락.
- All displayed facts come from `content/site.json` via the `shared/content.ts` schema; design work must not add, remove, or alter facts, only how they are presented.
- Functional constraints to preserve: project tabs, screenshot lightbox, mobile hamburger menu, scroll-position nav indicator, hero/project image at 16:9 with `object-fit: contain`, conditional display of photo/PDF/document links, and the editor's auth + review + PR save flow.
- Visual constraints (binding, not open to skill-driven override): no gradient backgrounds, glow/neon, grain, custom cursors, floating/parallax elements, bounce easing, glass/blur effects, or decorative circles/grids anywhere on the site.
- Color is fixed to three tokens: `--brand-1 #dce2f0` (buttons/links/selection only), `--brand-2 #53586a`, `--on-brand #282c36`, over a cool graphite background; no new accent hues.
- Currently no profile photo and no portfolio PDF are set (both fields present in the schema but empty); the contact card falls back to initials.

## Brand Commitments

Name: 한의준 (English metadata name: Euijun Han). Visual identity is deliberately restrained — cool graphite/gray, not colorful or playful. Korean is the primary language throughout; typography and reading-rhythm decisions are judged for Korean text first, not inherited from Latin-centric defaults.

## Evidence on Hand

`content/site.json` is the sole factual source: profile (school, role, two-line intro, GitHub/LinkedIn/email/domain, now including a profile photo; no portfolio PDF yet), three projects (GOMS, Washer, GSMC) each with team size, role, tech stack, a short work list, and now a representative cover mockup image (no additional in-app screenshots yet), a "해 온 일" list grouped by category, five published open-source PR contributions plus one unpublished, two school activities (one published, one unpublished), and a `skills` list that is not rendered on the public site. No testimonials, pricing, or case-study claims exist and none should be invented.

## Product Principles

1. Calm over flashy — this is a text-first personal hub, not a marketing landing page; restraint is the brand, not a placeholder for missing polish.
2. Evidence over claims — every project and contribution should read as traceable to something real (a PR link, a named role), not generic resume language.
3. Korean readability first — line length, line height, and type scale are tuned for Korean body text, never assumed from a Latin system-font default.
4. One primary action at a time — the hero and each section should lead the eye toward exactly one next step rather than competing calls to action.
5. Content and code stay separable — `content/site.json` remains the only place facts live; design and copy-polish work never changes what it says, only how it's presented.

## Accessibility & Inclusion

Standard target: WCAG AA text contrast, 44px minimum touch targets, visible focus rings, `prefers-reduced-motion` support, correct heading order, and zero axe-core violations (wcag2a/wcag2aa/wcag21aa) — already enforced by the existing Playwright + axe-core test suite and treated as a hard floor for this design pass.
