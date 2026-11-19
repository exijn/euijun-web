---
name: exijn.com
description: 한의준의 개인 활동 허브 — 명함 QR로 들어오는 방문자를 위한 차분한 그래파이트 톤 단일 페이지
colors:
  brand-1: "#dce2f0"
  brand-2: "#53586a"
  on-brand: "#282c36"
  bg: "#1f2128"
  surface: "#272a31"
  surface2: "#30333b"
  line: "#3d404a"
  line-strong: "#4a4e5a"
  text: "#eef0f5"
  muted: "#b9bdc8"
  soft: "#9da1ad"
  shade: "#17181d"
  danger: "#e8a08f"
typography:
  display:
    fontFamily: "'Pretendard', system-ui, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Segoe UI', sans-serif"
    fontSize: "52px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  display-sm:
    fontFamily: "'Pretendard', system-ui, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Segoe UI', sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: "'Pretendard', system-ui, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Segoe UI', sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.3
  xl:
    fontFamily: "'Pretendard', system-ui, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Segoe UI', sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.3
  lg:
    fontFamily: "'Pretendard', system-ui, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Segoe UI', sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.4
  title:
    fontFamily: "'Pretendard', system-ui, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Segoe UI', sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "'Pretendard', system-ui, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Segoe UI', sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.7
  xs:
    fontFamily: "'Pretendard', system-ui, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "'Pretendard', system-ui, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
  meta:
    fontFamily: "'Pretendard', system-ui, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  2xs: "3px"
  xs: "9px"
  sm: "10px"
  md: "12px"
  lg: "14px"
  xl: "16px"
  pill: "999px"
spacing:
  block: "32px"
  section-sm: "60px"
  section: "76px"
components:
  button-primary:
    backgroundColor: "{colors.brand-1}"
    textColor: "{colors.on-brand}"
    rounded: "{rounded.md}"
    padding: "0 18px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "0 18px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    padding: "{spacing.block}"
---

# Design System: exijn.com

## Overview

**Creative North Star: "The Quiet Business Card"**

A visitor arrives here having just scanned a QR code off a physical business card — they expect a fact sheet, not a pitch. The system is a single dark-graphite surface that behaves like calm paper: flat, text-led, evidence-first. It never performs; it discloses. There is no gradient, no glow, no motion beyond a short fade-in, no decorative shape — the only visual excitement allowed is typographic contrast and the restrained lavender-gray accent appearing exactly where it means "you can act here" (a link, a button, a selected tab).

Confirmed visual rejections: no gradients, no glow/neon, no grain texture, no custom cursors, no floating or parallax elements, no bounce easing, no glass/blur surfaces, no decorative circles or grid ornaments, no accent colors beyond the three brand tokens.

**Key Characteristics:**
- Flat graphite surfaces layered by lightness (`bg` → `surface` → `surface2`), never by shadow.
- One accent color (`brand-1`) reserved for interactive affordances only — never decoration.
- Generous, text-first spacing on a 3-step section/block rhythm; sections separated by a hairline rule, not a card boundary.
- Korean body copy set at 16px/1.7, letter-spacing 0, as the working default — self-hosted Pretendard now, not a Latin system-font afterthought.
- One shared token set (`:root` in `src/styles.css`) drives both the public site and the private editor — no parallel naming.

## Colors

A near-monochrome graphite palette with a single cool accent; color signals interactivity, not mood.

### Primary
- **Business-Card Lavender** (`#dce2f0`, `--brand-1`): the one accent in the system. Used only for primary buttons, link text/hover states, the selected-nav dot, and the focus ring. Reserved — appearing elsewhere would dilute its "you can act here" meaning.

### Secondary
- **Slate Indigo** (`#53586a`, `--brand-2`): used for small identity-bearing fills — the header mark icon, the contact avatar, and the selected project tab's border. Reads as the "brand ink" that pairs with the lavender accent.

### Neutral
- **Graphite Floor** (`#1f2128`, `--bg`): page background and header.
- **Graphite Surface** (`#272a31`, `--surface`): the project detail panel and the contact card — the system's only two permitted card surfaces.
- **Graphite Surface 2** (`#30333b`, `--surface2`): nested emphasis inside a surface — selected tab fill, tech chips, the pull-quote note block.
- **Hairline** (`#3d404a`, `--line`): every divider, border, and section rule.
- **Hairline Strong** (`#4a4e5a`, `--line-strong`): hover-state border on buttons/links — one step brighter than the resting hairline.
- **Shade** (`#17181d`, `--shade`): the empty-image background behind the hero shot and screenshot thumbnails, one step darker than the page floor.
- **Scrim** (`rgba(10, 11, 14, .78)`, `--scrim`): the lightbox backdrop only.
- **Primary Text** (`#eef0f5`, `--text`): headings and body copy.
- **Muted Text** (`#b9bdc8`, `--muted`): secondary copy — role lines, descriptions, nav labels.
- **Soft Text** (`#9da1ad`, `--soft`): tertiary copy and icon strokes — timestamps, field labels, decorative icon glyphs.
- **Danger** (`#e8a08f`, `--danger`): editor-only destructive action / error state (delete buttons, validation errors). No public-site equivalent; not a decorative accent.

### Named Rules
**The One Accent Rule.** `--brand-1` only ever appears on something clickable or selected. If a shape needs color and isn't interactive, it uses a neutral, never the accent.

## Typography

**Body/Display Font:** 'Pretendard' (self-hosted, OFL), falling back to system-ui, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Segoe UI', sans-serif if the webfont fails to load.

**Character:** Pretendard was designed to unify the look of Apple SD Gothic Neo and Malgun Gothic across platforms, so the swap is a deliberate refinement of the same character rather than a personality change — crisper stroke contrast and more consistent Hangul/Latin pairing than any one system font gives alone.

**Self-hosting:** Subset to exactly the characters used in `content/site.json` and the UI copy (4 weights × ~41.5 KB woff2, `font-display: swap`, no external request). Regenerate with `npm run fonts:subset` after adding content with Hangul syllables outside the current subset — until then, only the new syllables fall back to the system font, not the whole page. License: `public/fonts/pretendard/LICENSE` (SIL OFL 1.1).

### Hierarchy
9-step scale (`--fs-3xs` … `--fs-display`), shared by the public site and the editor so no element declares a one-off size:
- **Display** (700, 52px / 40px mobile, line-height 1.2): hero `<h1>` name only.
- **Headline** (700, 28px, line-height 1.3): section titles (`.sec-hd h2`) and the project-detail name (`.pd-top h3`) — unified to one size (previously 28 vs 30).
- **XL** (24px): contact-card name/avatar initials, and the mobile-collapsed headline tier.
- **LG** (20px): hero role line, "해 온 일" item titles.
- **Title** (700, 18px, line-height 1.4): project tab names, hero lede, editor section titles.
- **Body** (400, 16px, line-height 1.7): work-list items, facts, way descriptions; word-break tuned for Korean (`word-break: keep-all`).
- **XS** (15px): nav links, buttons, contact-card links, school/oss-more meta.
- **Label** (600, 14px): status pills, chips, board/tab secondary text, editor form inputs.
- **Meta** (13px): the smallest tier — fact labels, repo paths, footnote text.

### Named Rules
**The Subset Discipline Rule.** Pretendard ships only the glyphs this site actually renders, not full Hangul coverage. A new syllable the subset lacks is a cue to run `npm run fonts:subset`, not a reason to widen the subset preemptively.

**The One Mono Exception.** `ui-monospace, 'Cascadia Code', Consolas, monospace` is the one deliberate departure from the system sans, used only on `.orepo` to set a GitHub `owner/repo` path in a code-like register. It is not drift and should not be expanded to other labels.

## Layout

Single-column content constrained to `max-width: 1120px` (`.wrap`), centered, with 32px side padding on desktop collapsing to 20px under 760px. Sections stack vertically, each separated by a 1px hairline top border rather than a card boundary — the page reads as one continuous sheet, not a stack of panels. The hero is the one two-column layout (`1.1fr` intro / `1fr` project board), collapsing to a single column under 960px. Responsive behavior is driven by CSS container queries (`@container site`) at 960px and 760px, not viewport media queries, so the layout also adapts correctly inside the admin preview iframe.

Section/block rhythm is now a 3-step token scale: `--space-section` (76px, section and hero vertical padding), `--space-section-sm` (60px, same role under the 760px container query), and `--space-block` (32px, card padding and the gap below a section heading). Element-internal micro-padding (chip padding, row gaps, icon sizes) is intentionally excluded from this scale — it varies by component, not by page rhythm.

## Elevation & Depth

Flat by default — no `box-shadow` anywhere in the stylesheet. Depth is conveyed entirely through tonal layering (`bg` → `surface` → `surface2`) and 1px hairline borders, never through shadow or blur.

### Named Rules
**The Flat-By-Default Rule.** Nothing lifts off the page. A surface reads as "elevated" only by being one step lighter than what's behind it, bounded by a hairline border — never by a shadow, glow, or blur.

## Shapes

A 7-step rounding scale (`--radius-2xs` 3px … `--radius-xl` 16px, plus `--radius-pill` 999px) covers every rectangular corner; perfect circles (dots, the mobile avatar fallback) use `50%` directly and sit outside the scale. 16px on the two card surfaces (project detail, contact card), 14px on project tabs, 12px on buttons/shot frames/the note block/contact links, 10px on list rows and small chrome, 9px on nav pills and the header mark, 3px on micro icon accents (tab/row identity dots). No sharp (0px) corners and no heavy pill-shaped buttons except the status badge.

## Components

### Buttons
- **Shape:** 12px radius, 44px minimum height (1px border by default).
- **Primary:** `background: var(--brand-1)`, `color: var(--on-brand)`, no border contrast beyond the fill itself — the one filled, high-contrast button in the system. The editor's primary button now shares this exact pair (previously a divergent `#161616` text color).
- **Ghost/Secondary:** transparent background, `var(--line)` border, `var(--text)` label; hovers to `var(--surface)` with the border brightening to `var(--line-strong)`.
- **Hover/Focus:** ghost buttons darken-fill on hover; primary brightens slightly (`filter: brightness(1.06)`); focus-visible gets a 2px `--brand-1` outline with 3px offset on every interactive element.

### Chips
- **Style:** `var(--surface2)` background, `var(--line)` 1px border, 7px radius, no fill color — used for tech-stack tags only.

### Cards / Containers
- **Corner Style:** 16px radius.
- **Background:** `var(--surface)`.
- **Shadow Strategy:** none (see Elevation & Depth) — bounded by a 1px `var(--line)` border instead.
- **Permitted surfaces:** exactly two — the project-detail panel (`.pdetail`) and the contact card (`.card`). The hero project board (`.board`) no longer carries card styling: it is a plain hairline-topped list, matching `.ways`/`.acts` elsewhere on the page, both demoting its visual weight next to the hero's one primary CTA and resolving the card-misuse this file used to flag.

### Inputs / Fields
- The editor's field styling now references the same tokens as the public site (`var(--surface)`, `var(--line-strong)`, `var(--text)`, the shared `--fs-*` scale) instead of a parallel `--accent`/`--secondary`/`--elevated` set. Its interaction flow is unchanged — only the token source and type scale converged.

### Navigation
- **Style:** header nav links in `var(--muted)`, 15px, becoming `var(--text)` on a `var(--surface)` hover pill; the active link additionally gets a small `var(--brand-1)` dot and a `var(--surface2)` fill. Mobile collapses to a hamburger-triggered full-width panel with 52px-tall rows.

## Do's and Don'ts

### Do:
- **Do** keep `--brand-1` exclusively on interactive/selected elements (links, primary buttons, the active nav dot, focus rings).
- **Do** build new surfaces from the `bg → surface → surface2` tonal ladder plus hairline borders instead of shadows.
- **Do** keep Korean body copy at 1.6–1.75 line-height and headings at 1.2–1.3.
- **Do** limit card styling (background + border + radius together) to the project-detail panel and the contact card only.
- **Do** pull every font-size from the shared `--fs-*` scale and every section/block gap from `--space-*` — in both the public site and the editor.

### Don't:
- **Don't** add a gradient, glow/neon effect, grain texture, custom cursor, floating/parallax element, bounce easing, glass/blur surface, or decorative circle/grid — all explicitly rejected for this surface.
- **Don't** introduce a new accent color beyond `--brand-1`, `--brand-2`, and `--on-brand`.
- **Don't** give the hero project board (or any other non-detail, non-contact block) a card background+border+radius treatment; a plain list with hairline dividers is the correct pattern there.
- **Don't** port Latin-centric type-scale or line-length assumptions onto Korean body copy without checking character-count line length (~35–45자) first.
- **Don't** redeclare a color or font-size token under a different name in `admin/editor.css`; it shares `:root` with the public site on purpose.
