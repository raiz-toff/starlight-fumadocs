When working on any layout or component task, first read the equivalent source file from:
/reference/fumadocs/packages/fumadocs-ui/src/

For layout work → read: layouts/docs.tsx, layouts/page.tsx
For sidebar → read: components/layout/sidebar.tsx
For TOC → read: components/layout/toc.tsx
For header → read: components/layout/nav.tsx
For CSS vars → read: css/neutral.css, css/preset.css


# FumaDocs → Starlight Theme: Full Agile Plan

---

## How to Use This Document

This is your single source of truth. Each phase is a sprint. Each task inside a phase is a single prompt for Gemini Flash — one task, one output, verify before moving on. Never skip the Definition of Done.

---

## FumaDocs Layout: Deep Understanding

Before any code, you need to understand what you are replicating. FumaDocs layout is not a simple flexbox — it is a **CSS Grid with named areas and a sticky offset system driven entirely by CSS variables**.

### The Core Grid (`#nd-docs-layout`)

```
"sidebar  header      toc"
"sidebar  toc-popover toc"
"sidebar  main        toc"
   1fr  /  auto    / min-content
```

Three columns. Three rows. Every zone is a named grid area.

Column sizing:
- `sidebar` col → `minmax(--fd-sidebar-col, 1fr)`
- `main` col → `minmax(0, --fd-page-col)` where `page-col = layout-width - sidebar-width - toc-width`
- `toc` col → `minmax(min-content, 1fr)`

### The Row Offset System (Critical — this is what makes sticky work)

FumaDocs does NOT use hardcoded `top` values. It uses calculated CSS variables:

| Variable | Value | Purpose |
|---|---|---|
| `--fd-docs-row-1` | `--fd-banner-height` | Top of sidebar sticky |
| `--fd-docs-row-2` | `row-1 + --fd-header-height` | Top of TOC sticky |
| `--fd-docs-row-3` | `row-2 + --fd-toc-popover-height` | Top of main content offset |

Each sticky element hooks to one of these rows. If banner height changes, everything below re-offsets automatically. You need to replicate this system in Starlight using custom `--fuma-row-*` vars.

### Layout Variables You Need to Recreate in Starlight

| FumaDocs var | Starlight equivalent | Notes |
|---|---|---|
| `--fd-sidebar-width` | `--sl-sidebar-width` | Already exists in Starlight |
| `--fd-toc-width` | custom `--fuma-toc-width` | ~240px, does not exist in Starlight |
| `--fd-header-height` | `--sl-nav-height` | Already exists |
| `--fd-banner-height` | custom `--fuma-banner-height` | Add if you want a banner |
| `--fd-layout-width` | `--sl-content-width` (adjust) | FumaDocs default: 97rem |
| `--fd-docs-row-1` | custom `--fuma-row-1` | Calc var: banner height |
| `--fd-docs-row-2` | custom `--fuma-row-2` | Calc var: banner + nav height |
| `--fd-toc-popover-height` | custom `--fuma-toc-popover-height` | Set by the popover component via CSS |

---

### Breakpoint Behavior

#### Desktop (>1024px)
- Sidebar: visible, sticky left, full height, `top: --fuma-row-1`
- Header: sticky top, full width, `top: 0`
- TOC: visible, sticky right rail, `top: --fuma-row-2`
- TOC Popover: hidden
- Main: scrolls normally between sidebar and TOC

#### Medium (768px–1024px)
- Sidebar: still visible but may collapse to icon-only
- Header: sticky, same as desktop
- TOC: **disappears from right rail**
- TOC Popover: appears as a sticky bar below header — "On this page ↓" dropdown
- Main: fills full remaining width

#### Mobile (<768px)
- Sidebar: **fully hidden**, becomes an off-canvas drawer triggered by hamburger button
- Overlay: dark overlay behind open drawer
- Header: sticky, includes hamburger + search + theme toggle
- TOC Popover: sticky bar below header
- Main: full width

> **Critical Starlight gap:** Starlight's mobile sidebar uses a `<details>/<summary>` disclosure element. FumaDocs uses a slide-in drawer with a dark overlay. The Sidebar.astro and MobileMenuToggle.astro overrides must implement the drawer from scratch.

---

### Sticky Offset Map (Component → CSS top value)

| Component | `position` | `top` value | Starlight override |
|---|---|---|---|
| Sidebar | sticky | `--fuma-row-1` | `Sidebar.astro` |
| Header | sticky | `0` | `Header.astro` |
| TOC (desktop) | sticky | `--fuma-row-2` | `PageSidebar.astro` |
| TOC Popover bar | sticky | `--fuma-row-2` | `MobileTableOfContents.astro` |
| Main content | — | scrolls | no action |

---

### What Starlight Components You Must Override

Starlight lets you override specific components in `astro.config.mjs` under `components: {}`. Here is the full list needed for a FumaDocs replica, in dependency order (override upstream components first):

1. `Header` — top nav bar
2. `SiteTitle` — logo + title
3. `Search` — Cmd+K pill
4. `ThemeSelect` — dark/light toggle
5. `Sidebar` — left navigation + drawer behavior
6. `PageSidebar` — right TOC rail (desktop)
7. `TableOfContents` — TOC content inside right rail
8. `MobileTableOfContents` — TOC popover bar (medium + mobile)
9. `PageTitle` — page heading block
10. `Pagination` — prev/next at page bottom
11. `Footer` — bottom bar
12. `ContentPanel` — main content wrapper (for max-width and padding)

---

## The Agile Sprint Plan

---

### Sprint 0 — Repo Setup & Source Gathering

**Goal:** Everything is ready. You have sources to reference, project boots.

**Tasks:**
- [x] Clone fumadocs repo locally
- [x] Open `packages/fumadocs-ui/src/layouts/` — read every file
- [x] Open fumadocs.dev in Chrome DevTools — inspect `#nd-docs-layout` computed grid at all 3 breakpoints, screenshot it
- [x] Open Starlight's `props.css` on GitHub — read all `--sl-*` vars
- [x] Create blank Starlight project with Tailwind v4
- [x] Create folder: `src/overrides/`
- [x] Create file: `src/styles/fumadocs.css` (empty for now)

**Definition of Done:** Starlight dev server runs. Folder structure ready. Both repos cloned locally.

---

### Sprint 1 — Color Token Mapping

**Goal:** Full color system ported. Light and dark mode both work.

Each item below = one Gemini Flash task. Paste the relevant FumaDocs CSS + Starlight props list. Ask for only that block.

**Tasks:**
- [x] Map light mode background colors → `--sl-color-bg`, `--sl-color-bg-sidebar`
- [x] Map dark mode background colors
- [x] Map accent/primary → `--sl-color-accent-low`, `--sl-color-accent`, `--sl-color-accent-high`
- [x] Map gray scale → `--sl-color-gray-1` through `--sl-color-gray-7`
- [x] Map text/foreground colors → `--sl-color-text`, `--sl-color-text-accent`, `--sl-color-text-invert`
- [x] Map border colors
- [x] Set font vars: Geist Sans + Geist Mono + `--sl-font`, `--sl-font-mono`
- [x] Visual check: toggle light/dark, compare to fumadocs.dev

**Definition of Done:** Colors match fumadocs.dev in both modes when you toggle.

---

### Sprint 2 — Typography & Prose CSS

**Goal:** MDX content renders with FumaDocs prose styling.

**Tasks:**
- [x] h1 style (size, weight, tracking, margin) inside `.sl-markdown-content`
- [x] h2 style
- [x] h3 style
- [x] h4 style
- [x] Paragraph style (size, line-height, color)
- [x] Link style (color, underline behavior, hover)
- [x] `strong` and `em` styles
- [x] Blockquote (left border, background, padding)
- [x] `ul` / `ol` list styles
- [x] Table styles (border, header bg, row hover)
- [x] `hr` divider style
- [x] `details` / `summary` disclosure element
- [x] Heading anchor link styles (`.anchor-link` hover reveal)
- [x] Test MDX page created at `/examples/typography/` — verified in browser

**Definition of Done:** A test MDX page with all element types looks identical to fumadocs.dev prose. ✅

---

### Sprint 3 — Code Block Styles

**Goal:** Code blocks are visually identical to FumaDocs.

**Tasks:**
- [x] Configure Expressive Code in `astro.config.mjs` with FumaDocs-matching dark theme
- [x] Code block container: border, border-radius, background color
- [x] Filename / title bar styles
- [x] Copy button style (position, icon, hover)
- [x] Inline `code` element style
- [x] Line highlight / diff highlight styles

**Definition of Done:** Code blocks with filename, copy button, and highlights look identical to fumadocs.dev. ✅

---

### Sprint 3B — Layout Analysis & Blueprint (COMPLETE AUDIT)

**Goal:** Complete technical specification of the FumaDocs layout system. Every zone, every question from the audit prompt answered.

#### 1. Grid System & Core Structure

- [x] **Grid Area Map**: `#nd-docs-layout` named grid areas:
  - `sidebar` — left column
  - `header` — top strip (**mobile/tablet only**; does NOT exist on desktop)
  - `toc-popover` — sticky bar below header (medium/mobile only)
  - `main` — center scrolling content column
  - `toc` — right column (desktop only)
- [x] **Column Definitions** (desktop):
  - `sidebar`: `268px` (`--fd-sidebar-width`)
  - `main`: `1fr` with `max-width: ~900px` centered inside
  - `toc`: `268px` (`--fd-toc-width`)
- [x] **Row Definitions**:
  - Row 1: header row — `0` on desktop (no header), `~56px` on mobile
  - Row 2: toc-popover row — hidden on desktop, `~40px` on medium/mobile
  - Row 3: main content — fills remaining height

#### 2. CSS Variable Specification (--fd-*)

- [x] **Color Tokens** (from DevTools extraction):
  - `--color-fd-background`: `#f5f5f5` (Light) / `#0a0a0a` (Dark)
  - `--color-fd-foreground`: `#0a0a0a` / `#f5f5f5`
  - `--color-fd-primary`: `#171717` (Brand, near-black)
  - `--color-fd-accent`: `#d1d1d180` (hover bg, semi-transparent)
  - `--color-fd-muted-foreground`: `#737373`
  - `--color-fd-border`: `#cccccc80`
  - `--color-fd-popover`: `#fafafa`
  - `--color-fd-card`: `#f1f1f1`
- [x] **Layout Tokens**:
  - `--fd-sidebar-width`: `268px`
  - `--fd-toc-width`: `268px`
  - `--fd-header-height`: `3.5rem` (~56px) — only on mobile
  - `--fd-banner-height`: `0px` (default, no banner)
  - `--fd-sidebar-drawer-offset`: `100%`
  - `--fd-docs-row-1`: = `--fd-banner-height` (sidebar sticky top)
  - `--fd-docs-row-2`: = `--fd-banner-height` + `--fd-header-height` (TOC/popover sticky top)
- [x] **Animation Tokens**:
  - `--animate-fd-accordion-down`: `fd-accordion-down 0.2s ease-out`
  - `--animate-fd-accordion-up`: `fd-accordion-up 0.2s ease-out`
  - `--animate-fd-fade-in`: `fd-fade-in 0.3s ease`
  - `--animate-fd-dialog-in`: `fd-dialog-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)`
  - `--animate-fd-popover-in`: `fd-popover-in 0.1s ease`

#### 3. Sticky & Z-Index Chain

- [x] **Sticky Positioning**:
  - Desktop header: **DOES NOT EXIST** — no header on desktop
  - Mobile header: `position: sticky`, `top: 0`, `z-index: 50`
  - Desktop Sidebar: `position: sticky`, `top: var(--fd-docs-row-1)`, `height: calc(100dvh - var(--fd-docs-row-1))`
  - Desktop TOC: `position: sticky`, `top: var(--fd-docs-row-2)`, `height: fit-content`
  - TOC Popover bar: `position: sticky`, `top: var(--fd-docs-row-2)` (= `3.5rem` on mobile), `z-index: 30`
- [x] **Z-Index Layering**:
  - Mobile Header: `z-index: 50`
  - Mobile Drawer: `z-index: 40`
  - TOC Popover: `z-index: 30`
  - Sidebar Overlay (backdrop): `z-index: 20`

#### 4. Zone 1 — Sidebar Full Spec

- [x] **Position**: `sticky` grid item. NOT `position: fixed`.
- [x] **Top**: `var(--fd-docs-row-1)` (banner height; default `0px`). Never hardcode `top: 0`.
- [x] **Width**: `268px` computed.
- [x] **Background**: `rgb(245, 245, 245)` light / `rgb(10, 10, 10)` dark. **SAME as page body** — no visual contrast difference.
- [x] **Right border**: `1px solid rgba(102, 102, 102, 0.2)`. No box-shadow.
- [x] **Scroll**: Sidebar nav scrolls independently within the sidebar column.
- [x] **Sidebar header area** (very top):
  - Logo: SVG icon + site title. Clickable → links to `/`.
  - Site title: `font-size: 14px`, `font-weight: 600`.
  - Collapse toggle: positioned at **top-RIGHT** of the sidebar header row.
  - Toggle icon: a panel/sidebar icon (not a simple chevron or X).
- [x] **Search bar**: Is a `<button>` element. Clicking opens a modal. Not a real `<input>`. Has `Ctrl K` badge.
- [x] **Root nav selector** ("Fumadocs UI" or "Framework" picker):
  - Appearance: icon + label text + double-chevron (`⇅`) on right.
  - On click: opens a **dropdown popup**, NOT a modal.
- [x] **Nav tree items**: Each has a **small SVG icon before the text label** (icon + label style).
- [x] **Group headers**: `font-size: ~11-12px`, uppercase, `font-weight: 500`, `color: --color-fd-muted-foreground`.
- [x] **Active nav item**: background tint (`--color-fd-accent`), text `--color-fd-primary`. **No left border on nav active item.**
- [x] **Expandable items**: Chevron on the right. **Rotates 90°** (right→down) on expand.
- [x] **Children indent**: `1.5rem` extra indent from parent.
- [x] **Hover state**: Background → `--color-fd-accent` tint. Smooth transition.
- [x] **Sidebar footer** (GitHub + Theme toggle):
  - **Sticky to viewport bottom** inside the sidebar. Does NOT scroll away with the nav tree.
  - Has `border-top: 1px solid var(--color-fd-border)`.
  - Layout: `flex`, `items-center`, `justify-between`.
- [x] **Collapsed state**:
  - Does **NOT fully disappear**. Shrinks to a **narrow icon rail** (sidebar toggle button + search icon remain visible).
  - Main content width expands to fill freed space. Animated.
  - **Hover while collapsed: NO auto-expand** on `fumadocs.dev`. Must click toggle to re-expand.

#### 5. Zone 2 — Header / Top Navigation Bar

- [x] **Desktop (≥1025px)**: **NO top header bar**. The page has no full-width header on desktop. Top of page = top of sidebar. This is a critical difference from most doc sites.
- [x] **Mobile/tablet (≤1024px)**: A full-width sticky header appears containing:
  - Logo on **LEFT**.
  - Search icon button on **RIGHT**.
  - Sidebar trigger button on **RIGHT** (rightmost). NOT on the left.
  - Height: `~56px`.
  - Background: same as page background.
  - Border-bottom: `1px solid var(--color-fd-border)`.
  - `position: sticky`, `top: 0`, `z-index: 50`.
- [x] **No breadcrumb or page title in the header bar** — header is nav-only.

#### 6. Zone 3 — TOC Right Rail (Desktop)

- [x] **Width**: `268px` computed.
- [x] **Background**: Same as page. No visual difference.
- [x] **Left border/separator**: **None**. No divider between main and TOC.
- [x] **"On this page" header**: `font-size: 12px`, `font-weight: 600`, uppercase, `letter-spacing: 0.05em`, color `--color-fd-muted-foreground`.
- [x] **TOC items**: `font-size: 13px`, `line-height: 1.5`, color `--color-fd-muted-foreground`.
- [x] **Active TOC item**: `color: --color-fd-primary` (NOT yellow — this is the primary brand color). Left border: `2px solid var(--color-fd-primary)`.
- [x] **Sub-items indent**: `0.75rem` additional. Same color as top-level.
- [x] **Sticky top**: `var(--fd-docs-row-2)` (banner + header height).
- [x] **Exact breakpoint where TOC disappears**: **1024px** (the `lg` breakpoint). At ≤1024px it hides. It is NOT 768px.

#### 7. Zone 4 — TOC Popover (Medium/Mobile)

- [x] **Appears at**: ≤1024px width.
- [x] **Position**: In `toc-popover` grid area. `position: sticky`, `top: var(--fd-docs-row-2)` (`3.5rem` on mobile), `z-index: 30`.
- [x] **What the bar shows**: The **current section heading** the user has scrolled to (dynamic). NOT a static "On this page" text.
- [x] **Height**: `~40px`. Background: same as page. Border-bottom: `1px solid var(--color-fd-border)`.
- [x] **On click**: A **dropdown list** appears directly below (NOT a sheet, NOT a modal).
- [x] **Animation**: `fd-accordion-down`, `0.2s ease-out`.
- [x] **Active item in dropdown**: `color: --color-fd-primary`, left border `2px solid`. Same as desktop rail.
- [x] **Close**: Click the bar again to collapse, OR click outside the dropdown.

#### 8. Zone 5 — Mobile Sidebar Drawer

- [x] **Trigger**: Located on **RIGHT** side of top nav header (rightmost element).
- [x] **Trigger icon**: Panel/sidebar icon. NOT a hamburger ☰.
- [x] **Slide direction**: Slides in from **RIGHT**.
- [x] **Height**: Full viewport (`100dvh`).
- [x] **Width**: Partial — `~255px` on 375px screen (`left: 120px`, `right: 0`).
- [x] **Background**: `rgb(245, 245, 245)` light / `rgb(10, 10, 10)` dark.
- [x] **Overlay**: Dark overlay on the exposed left portion of the screen. `opacity: ~0.5`. Clicking overlay closes drawer.
- [x] **Drawer top row**: GitHub link + Theme toggle on left, Close button on **top-RIGHT**.
- [x] **Close button icon**: Same panel/sidebar icon as trigger (NOT an X icon).
- [x] **Drawer contents** (top to bottom): Close/icon row → Root nav selector → Full navigation tree.
- [x] **Search inside drawer**: **NO search bar inside the drawer**. Search stays in the top nav bar.
- [x] **Closing animation**: Slides out to right, ~`0.3s`.

#### 9. Zone 6 — Main Content Area

- [x] **Max-width**: `~900px` for the `<article>` element.
- [x] **Padding**: `padding-left: 1.5rem`, `padding-right: 1.5rem` (~24px). Mobile: reduced.
- [x] **Background**: Same as page. No visual difference.
- [x] **Page title**: `font-size: 2.25rem`, `font-weight: 700`, `letter-spacing: -0.02em`.
- [x] **Page description**: `font-size: 1.125rem`, color `--color-fd-muted-foreground`, `margin-top: 0.5rem`.
- [x] **Action buttons** ("Copy Markdown" / "Open"): Row below description. Small `font-size: ~12px`. `border: 1px solid var(--color-fd-border)`, `border-radius: 4-6px`. Icon + text.
- [x] **Breadcrumb**: Exists as a **standalone row above the title**. Present on **nested pages only** (not root-level pages like `/docs/ui`). Muted color. Separator: `›`. Current page item is not a link.
- [x] **Pagination**: Card style with border. Shows small "Previous" / "Next" label + page title. **Arrow icons present** (← / →). Hover changes border color to `--color-fd-primary`.

#### 10. Zone 7 — Interaction Tests

- [x] **Sidebar collapse**: Shrinks to icon rail. Content expands. Animated `~0.2s` width.
- [x] **Hover on collapsed sidebar**: **No hover-expand**. Button-toggle only.
- [x] **Scroll long page**: Sidebar stays sticky. TOC updates active item as you scroll. **No scroll progress bar**.
- [x] **Click TOC item**: Smooth scroll to heading. **URL hash updates** (e.g. `#overview`).
- [x] **Open mobile drawer**: Slides from right. ~`0.3s ease`. Not instant.
- [x] **Resize breakpoints** (exact):
  - TOC rail disappears at **1024px** and below.
  - TOC popover bar appears at **1024px** and below.
  - Top header bar appears at **1024px** and below.
  - Sidebar drawer activates at **768px** and below.
- [x] **Theme toggle**: **Animated** CSS transition (~`0.2s`). Not instant snap.
- [x] **Search**: Opens centered modal with `backdrop-filter`. Has text input + results list. Keyboard shortcut `Ctrl K`.
- [x] **Expand nav group**: Chevron rotates **90°**. Accordion animation `0.2s ease-out`.

**Definition of Done:** All 7 zones fully documented. Every question from the original audit prompt answered with confirmed values. ✅

---

### Sprint 4 — Layout Shell Component Overrides
**Goal:** The structural shell of the layout matches FumaDocs. No content styling yet — just positioning, sizing, and sticky behavior.

Build in this exact order. Each item = one Gemini Flash task. Do not start the next until the previous is verified in browser.

**Tasks (in order):**

- [x] `PageFrame.astro` — apply the master grid class, set `--fuma-*` vars at root
- [x] `Header.astro` — sticky, backdrop blur, bottom border, correct height, sets `--fuma-row-2`
- [x] `SiteTitle.astro` — logo + title typography
- [x] `Search.astro` — Cmd+K pill button (style only, keep Pagefind wired)
- [x] `ThemeSelect.astro` — sun/moon toggle styled to FumaDocs
- [x] `Sidebar.astro` — sticky left, correct width, scrollable nav tree, `top: --fuma-row-1`
- [x] `RootNav.astro` — Version/Framework selector below search; icon, label, description, chevron
- [x] Mobile drawer behavior — hamburger open/close with overlay (inside Sidebar.astro)
- [x] Sidebar collapse button — toggle-only; NO hover-expand (confirmed: fumadocs.dev does not auto-expand on hover)
- [x] `PageSidebar.astro` — sticky right rail, correct width, `top: --fuma-row-2`, hidden on mobile
- [x] `MobileTableOfContents.astro` — sticky popover bar, hidden on desktop
- [x] `TableOfContents.astro` — TOC content inside right rail with `--color-fd-primary` active indicator (left border + text color; NOT yellow)

**Definition of Done:** At all 3 breakpoints, the layout grid positions match fumadocs.dev. Sidebar opens/closes on mobile. TOC appears in right rail on desktop, collapses to popover on medium/mobile.

**Sprint 4 Fixes Applied (2026-04-30):**
- [x] All breakpoints corrected: 1280px → 1024px across fumadocs.css, PageSidebar, MobileTableOfContents
- [x] Header.astro: now hides at ≥1024px (was 768px)
- [x] Tablet breakpoint (768px–1023px) now correctly sets `--fuma-header-height: 56px`
- [x] PageSidebar.astro: TOC sticky top corrected to `--fuma-docs-row-2` (was row-1)
- [x] Sidebar.astro: mobile drawer direction fixed — now slides from RIGHT (was left)
- [x] RootNav.astro created — icon + label + chevron ⇅ + dropdown, wired into Sidebar.astro

---

### Sprint 5 — Page Content Components
**Goal:** The page-level content area matches FumaDocs.

**Tasks:**
- [x] `Breadcrumb.astro` — standalone task; muted color, separator treatment, above title
- [x] `PageTitle.astro` — title, description block
- [x] Page action buttons — "Copy Markdown" and "Open" strip (style only, no JS needed)
- [x] `Pagination.astro` — prev/next cards at page bottom
- [x] `Footer.astro` — last updated, edit link, minimal styling

**Definition of Done:** A full doc page from top breadcrumb to bottom pagination looks like fumadocs.dev. ✅

---- [x] `Callout.astro` — info / warn / error / tip variants with left border + icon
- [x] `Card.astro` — icon + title + description card
- [x] `Cards.astro` — responsive grid wrapper for cards
- [x] `Steps.astro` — numbered step list with vertical connector line
- [x] `Tabs.astro` — tab strip with border-bottom active style
- [x] `FileTree.astro` — directory tree with icons

**Definition of Done:** Each component renders in a test MDX file and matches the fumadocs.dev equivalent. ✅

---

### Sprint 7 — Polish & Packaging
**Goal:** Shippable theme plugin.

**Tasks:**
- [ ] Cross-browser check: Chrome, Firefox, Safari
- [ ] Light mode full review pass
- [ ] Dark mode full review pass
- [ ] Mobile full review pass (real device or DevTools)
- [ ] Accessibility check: keyboard nav, focus rings, contrast ratios
- [ ] Extract into a Starlight plugin (`starlight-theme-fumadocs`)
- [ ] Write `README.md` with install steps and config options
- [ ] Publish to npm

**Definition of Done:** Someone can `npm install starlight-theme-fumadocs` and have the FumaDocs look in their Starlight site.

---

## Gemini Flash Prompt Rules (Pin These)

1. **One file per prompt.** Never "write the sidebar and the header."
2. **Paste both sources inline.** Give it the FumaDocs source + Starlight default for that component.
3. **Constrain the output.** "Write only the Astro component. No explanation."
4. **Verify before continuing.** Check in browser before the next task.
5. **Never hardcode colors.** All colors must use `--sl-*` or `--fuma-*` CSS vars.
6. **Never hardcode layout dimensions.** All widths, heights, and offsets must use CSS vars.
7. **Reference the sticky offset map.** Every sticky element must use the correct `--fuma-row-*` top value.
8. **Check /reference/fumadocs first, always.** Before writing any component, read the matching source file from the cloned repo. Never guess at FumaDocs internals from memory.

---

## Sprint Tracker

| Sprint | Focus | Status |
|---|---|---|
| 0 | Repo Setup | ✅ Done |
| 1 | Color Tokens | ✅ Done |
| 2 | Typography | ✅ Done |
| 3 | Code Blocks | ✅ Done |
| 3B | Layout Blueprint | ✅ Done |
| 4 | Layout Shell Components | ✅ Done (fixes applied 2026-04-30) |
| 5 | Page Content Components | ✅ Done |
| 6 | MDX Components | ✅ Done |
| 7 | Polish & Publish | ⬜ Not started |
