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

### Sprint 3B — Layout Analysis & Blueprint ⭐ NEW PHASE
**Goal:** You fully understand the FumaDocs grid system and have a written implementation plan for Starlight before writing a single component. This sprint is documentation and architecture only — no component code.

**Why this sprint exists:** The FumaDocs layout is a custom CSS Grid with a sticky offset system that Starlight has no equivalent of. Building components before you understand the grid will cause cascading layout bugs. This sprint prevents that.

**Tasks:**

- [ ] **Task 1 — Audit the grid in DevTools**
  Open fumadocs.dev. Inspect `#nd-docs-layout`. Record the exact `grid-template-areas`, column widths, and row heights at desktop, medium, and mobile. Take screenshots or write them down.

- [ ] **Task 2 — Document all `--fd-*` vars**
  In the cloned repo, search for every `--fd-` variable. Note what sets it, what reads it, and what happens when it changes. Write this into a local `LAYOUT-NOTES.md` file.

- [ ] **Task 3 — Trace each sticky element**
  For sidebar, header, TOC, and TOC popover — write down the exact `position`, `top`, `height`, and `z-index` values computed in the browser. Do this for all 3 breakpoints.

- [ ] **Task 4 — Audit Starlight's layout source**
  On GitHub, open `packages/starlight/components/`. Read: `Header.astro`, `Sidebar.astro`, `PageSidebar.astro`, `MobileTableOfContents.astro`, `Page.astro`. Note what CSS each one applies for positioning.

- [ ] **Task 5 — Write your custom CSS var plan**
  Define the full set of `--fuma-*` variables you will add to Starlight. Map each one to its FumaDocs equivalent. This is your contract for the rest of the build.

- [ ] **Task 6 — Write the master grid CSS (no components)**
  Write a single `.fumadocs-layout { }` CSS block that reproduces the FumaDocs 3-column 3-row grid, using your `--fuma-*` vars. Put it in `src/styles/fumadocs.css`. No Astro components yet.

- [ ] **Task 7 — Test the grid skeleton on a blank page**
  Create a throwaway `src/pages/grid-test.astro`. Apply `.fumadocs-layout` to a div. Put colored placeholder divs in each grid area. Confirm the grid works at all 3 breakpoints in the browser.

- [ ] **Task 8 — Write the responsive breakpoint spec**
  Document the exact `px` values where: sidebar collapses, TOC rail disappears, TOC popover appears, drawer activates. Write the media queries (not yet applied to components).

- [ ] **Task 9 — Map every Starlight override needed**
  For each grid area (sidebar, header, toc, toc-popover, main), write which Starlight component must be overridden, and what specifically changes from the Starlight default.

- [ ] **Task 10 — Write the override execution order**
  Order the component overrides by dependency. You can't style the sidebar correctly until the grid is right. You can't style TOC until header height is set. Write the chain.

**Definition of Done:** A blank Astro page shows the FumaDocs 3-column grid with placeholder divs in the correct positions at all 3 breakpoints. You have a written spec for every component before you write any of them.

---

### Sprint 4 — Layout Shell Component Overrides
**Goal:** The structural shell of the layout matches FumaDocs. No content styling yet — just positioning, sizing, and sticky behavior.

Build in this exact order. Each item = one Gemini Flash task. Do not start the next until the previous is verified in browser.

**Tasks (in order):**
- [ ] `ContentPanel.astro` — apply the master grid class, set `--fuma-*` vars at root
- [ ] `Header.astro` — sticky, backdrop blur, bottom border, correct height, sets `--fuma-row-2`
- [ ] `SiteTitle.astro` — logo + title typography
- [ ] `Search.astro` — Cmd+K pill button (style only, keep Pagefind wired)
- [ ] `ThemeSelect.astro` — sun/moon toggle styled to FumaDocs
- [ ] `Sidebar.astro` — sticky left, correct width, scrollable nav tree, `top: --fuma-row-1`
- [ ] Mobile drawer behavior — hamburger open/close with overlay (inside Sidebar.astro)
- [ ] `PageSidebar.astro` — sticky right rail, correct width, `top: --fuma-row-2`, hidden on mobile
- [ ] `MobileTableOfContents.astro` — sticky popover bar, hidden on desktop
- [ ] `TableOfContents.astro` — TOC content inside right rail with active-line indicator

**Definition of Done:** At all 3 breakpoints, the layout grid positions match fumadocs.dev. Sidebar opens/closes on mobile. TOC appears in right rail on desktop, collapses to popover on medium/mobile.

---

### Sprint 5 — Page Content Components
**Goal:** The page-level content area matches FumaDocs.

**Tasks:**
- [ ] `PageTitle.astro` — title, description, breadcrumb block
- [ ] `Pagination.astro` — prev/next cards at page bottom
- [ ] `Footer.astro` — last updated, edit link, minimal styling
- [ ] Breadcrumb styling (can be inside PageTitle.astro)

**Definition of Done:** A full doc page from top breadcrumb to bottom pagination looks like fumadocs.dev.

---

### Sprint 6 — MDX Components
**Goal:** Custom MDX components match FumaDocs components visually.

Each = one Gemini Flash task. Paste the FumaDocs component source + ask for the Astro equivalent only.

**Tasks:**
- [ ] `Callout.astro` — info / warn / error / tip variants with left border + icon
- [ ] `Card.astro` — icon + title + description card
- [ ] `Cards.astro` — responsive grid wrapper for cards
- [ ] `Steps.astro` — numbered step list with vertical connector line
- [ ] `Tabs.astro` — tab strip with border-bottom active style
- [ ] `FileTree.astro` — directory tree with icons

**Definition of Done:** Each component renders in a test MDX file and matches the fumadocs.dev equivalent.

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

---

## Sprint Tracker

| Sprint | Focus | Status |
|---|---|---|
| 0 | Repo Setup | ✅ Done |
| 1 | Color Tokens | ✅ Done |
| 2 | Typography | ✅ Done |
| 3 | Code Blocks | ✅ Done |
| 3B | Layout Blueprint | ⬜ Not started |
| 4 | Layout Shell Components | ⬜ Not started |
| 5 | Page Content Components | ⬜ Not started |
| 6 | MDX Components | ⬜ Not started |
| 7 | Polish & Publish | ⬜ Not started |