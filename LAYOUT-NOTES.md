# FumaDocs Layout Analysis (Verified)

This document contains the verified CSS architecture of the FumaDocs layout system as of April 2026.

## The Grid Container (`#nd-docs-layout`)

FumaDocs uses a **5-column, 3-row CSS Grid**. The structure remains identical across breakpoints, but sizing variables hide or reveal columns/rows.

```css
#nd-docs-layout {
  display: grid;
  grid-template: 
    "sidebar sidebar header      toc toc"
    "sidebar sidebar toc-popover toc toc"
    "sidebar sidebar main        toc toc" 
    1fr / 
    minmax(min-content, 1fr) 
    var(--fd-sidebar-col) 
    minmax(0, calc(var(--fd-layout-width, 97rem) - var(--fd-sidebar-width) - var(--fd-toc-width))) 
    var(--fd-toc-width) 
    minmax(min-content, 1fr);
}
```

### Breakpoint Matrix (Verified)

| Breakpoint | Viewport | Grid Columns (Verified) | Grid Rows (Verified) | Active Areas |
| :--- | :--- | :--- | :--- | :--- |
| **Desktop** | > 1280px | `0px 268px 888px 268px 0px` | `0px 0px 1fr` | Sidebar, Main, TOC Rail |
| **Tablet** | 768px - 1280px | `0px 268px 516px 0px 0px` | `0px 40px 1fr` | Sidebar, TOC Popover, Main |
| **Mobile** | < 768px | `0px 0px 500px 0px 0px` | `56px 40px 1fr` | Header, TOC Popover, Main |

---

## CSS Variable Dictionary (`--fd-*`) — Task 2 Analysis

This section analyzes how FumaDocs uses CSS variables to drive its layout logic.

| Variable | Set By | Read By | Behavior / Logic |
| :--- | :--- | :--- | :--- |
| `--fd-sidebar-width` | `sidebar.tsx` | `Container` grid, `Sidebar` width | Sets the base width for the left sidebar. Defaults to `0px` below `md` breakpoint, `268px` above. |
| `--fd-sidebar-col` | `container.tsx` | `Container` grid (Col 2) | Effectively `collapsed ? 0px : var(--fd-sidebar-width)`. Controls the actual grid track width. |
| `--fd-toc-width` | `toc.tsx` | `Container` grid, `TOC` width | Sets the base width for the right TOC rail. Defaults to `268px` above `xl`, `0px` below. |
| `--fd-header-height` | `header.tsx` | `Container` row calc, `Header` height | Sets height of mobile header. `56px` below `md`, `0px` above. |
| `--fd-toc-popover-height` | `toc.tsx` (popover) | `Container` row calc, `Popover` height | Sets height of "On this page" bar. `40px` below `xl`, `0px` above. |
| `--fd-layout-width` | `container.tsx` | `Container` grid (Main Col) | The max-width of the entire content area. Default: `97rem`. Centered by gutters. |
| `--fd-banner-height` | `banner.tsx` | `Container` row calc | Set if a top banner is present. Shoves the entire grid down. |
| `--fd-docs-height` | `container.tsx` | `Container` min-height | Defaults to `100dvh`. Used for full-height sticky sidebars. |

### The Sticky Offset Chain (Calculation Logic)

FumaDocs uses a cascading calculation for sticky offsets. This ensures that if a component above is hidden, the ones below automatically slide up.

| Row Variable | Calculation | Used By |
| :--- | :--- | :--- |
| `--fd-docs-row-1` | `var(--fd-banner-height, 0px)` | Sidebar `top`, Header `top`, TOC Rail `top` |
| `--fd-docs-row-2` | `calc(var(--fd-docs-row-1) + var(--fd-header-height))` | TOC Popover `top` |
| `--fd-docs-row-3` | `calc(var(--fd-docs-row-2) + var(--fd-toc-popover-height))` | (Auxiliary offsets) |

### Key Observations for Task 2

1. **The `layout:` modifier**: FumaDocs uses a custom Tailwind modifier to set these variables on the `#nd-docs-layout` container from within child components (Header, Sidebar, TOC).
2. **Implicit Dependency**: The `Container` doesn't know what the header height is; it just reads the variable. The `Header` is responsible for setting its own height variable on the parent.
3. **Transition Support**: `data-column-changed` attribute on the container triggers transitions for `grid-template-columns` when the sidebar is collapsed.

---

## Sticky Tracing & Z-Index

Every layout component uses `position: sticky` and binds to a specific row row.

| Component | `grid-area` | `position` | `top` | `z-index` |
| :--- | :--- | :--- | :--- | :--- |
| **Sidebar** | `sidebar` | sticky | `--fd-docs-row-1` | 20 |
| **Header** | `header` | sticky | `--fd-docs-row-1` | 30 |
| **TOC Rail** | `toc` | sticky | `--fd-docs-row-1` | (inherits) |
| **TOC Popover** | `toc-popover` | sticky | `--fd-docs-row-2` | 10 |
| **Mobile Drawer** | (overlay) | fixed | `0` | 40 |

---

## Implementation Plan for Starlight

We will replicate this system using `--fuma-` prefixed variables.

1. **Phase 1:** Add `.fumadocs-layout` and variables to `src/styles/fumadocs.css`.
2. **Phase 2:** Override `Page.astro` to wrap content in `#nd-docs-layout`.
3. **Phase 3:** Override components and assign `grid-area` + `sticky` behavior.

### Variable Mapping (Target)

| Starlight Var (Custom) | Value / Expression |
| :--- | :--- |
| `--fuma-docs-row-1` | `var(--fuma-banner-height, 0px)` |
| `--fuma-docs-row-2` | `calc(var(--fuma-docs-row-1) + var(--fuma-header-height))` |
| `--fuma-docs-row-3` | `calc(var(--fuma-docs-row-2) + var(--fuma-toc-popover-height))` |
| `--fuma-sidebar-width` | `268px` (media queried) |
| `--fuma-toc-width` | `268px` (media queried) |
| `--fuma-header-height` | `56px` (media queried) |
| `--fuma-toc-popover-height`| `40px` (media queried) |

## Starlight Variable Overrides

To align Starlight with FumaDocs, we will override these standard `--sl-` variables in our global CSS:

| Starlight Variable | FumaDocs Alignment | Value |
| :--- | :--- | :--- |
| `--sl-nav-height` | Matches `--fd-header-height` | `3.5rem` (56px) |
| `--sl-sidebar-width` | Matches `--fd-sidebar-width` | `268px` |
| `--sl-content-width` | Matches central grid col | `calc(var(--fuma-layout-width) - var(--sl-sidebar-width) - var(--fuma-toc-width))` |
| `--sl-z-index-navbar` | Align with Header | `30` |
| `--sl-z-index-menu` | Align with Mobile Drawer | `40` |

### New Component-Specific Vars

- `--fuma-toc-width`: `268px` (used for right rail)
- `--fuma-banner-height`: `0px` (default)
- `--fuma-toc-popover-height`: `40px` (used for "On this page" bar)

## Breakpoint Specification — Task 8 Final

This section defines the authoritative breakpoints for the FumaDocs layout conversion. All component-level media queries must align with these values.

### 1. XL Breakpoint (`1280px`) — TOC Transition
- **Above 1280px**: 
  - TOC Rail is visible (`268px`).
  - TOC Popover bar is hidden (`0px`).
- **Below 1280px**:
  - TOC Rail is hidden (`0px`).
  - TOC Popover bar is visible (`40px`).

### 2. MD Breakpoint (`768px`) — Sidebar Transition
- **Above 768px**:
  - Sidebar is visible (`268px`).
  - Header is hidden (`0px`).
- **Below 768px**:
  - Sidebar is hidden (`0px`) in the grid.
  - Header is visible (`56px`).
  - Mobile Menu Toggle becomes active.

### 3. Cumulative Row Calculation Spec
- **Mobile**: Row 1 (0px) -> Row 2 (56px Header) -> Row 3 (40px Popover) -> Main.
- **Tablet**: Row 1 (0px) -> Row 2 (0px Header) -> Row 3 (40px Popover) -> Main.
- **Desktop**: Row 1 (0px) -> Row 2 (0px Header) -> Row 3 (0px Popover) -> Main.

## Component Override Map — Task 9 Final

This map identifies exactly which Starlight components must be modified to fit into our grid architecture.

| Grid Area | Starlight Component | Strategy | Key CSS Changes |
| :--- | :--- | :--- | :--- |
| **Shell** | `PageFrame.astro` | Root Grid | Replace flex container with `.fumadocs-layout`. |
| **Sidebar** | `Sidebar.astro` | Grid Area | `grid-area: sidebar`, `position: sticky`, `top: var(--fuma-row-1)`. |
| **Header** | `Header.astro` | Grid Area | `grid-area: header`, `position: sticky`, `top: 0`. |
| **TOC Rail** | `PageSidebar.astro` | Grid Area | `grid-area: toc`, `position: sticky`, `top: var(--fuma-row-1)`. |
| **TOC Popover**| `MobileTableOfContents.astro` | Grid Area | `grid-area: toc-popover`, `position: sticky`, `top: var(--fuma-row-2)`. |
| **Main** | `TwoColumnContent.astro` | Central Track | `grid-area: main`, remove Starlight flex columns. |
| **Prose** | `ContentPanel.astro` | Track Alignment | Remove `max-width` constraints. |

## Override Execution Order — Task 10 Final

To prevent layout breakages during migration, overrides MUST be implemented in this order:

1. **`PageFrame.astro` (Foundation)**: Establish the grid container and root variables.
2. **`Header.astro` (Anchor)**: Set the primary height variable for the Row Offset system.
3. **`Sidebar.astro` (Left Rail)**: Bind the left sidebar to the grid and Row 1 sticky.
4. **`TwoColumnContent.astro` (Splitter)**: Distribute main content and TOC rail tracks.
5. **`PageSidebar.astro` & `MobileTableOfContents.astro` (TOC)**: Finalize sticky TOC behavior using cumulative row offsets.
6. **`ContentPanel.astro` (Polish)**: Align internal prose padding with the grid tracks.
