# Agent Task: Deep Layout Analysis of FumaDocs

## Your Mission

Go to **https://fumadocs.dev/docs/ui** and perform a complete layout, UX, and behavior audit.
You must understand every zone, every breakpoint, every interactive state, and every transition.
Do NOT assume anything. Observe and document only what you actually see.

Use your browser tool to:
1. Open the page
2. Take screenshots at specific viewport widths (listed below)
3. Interact with elements (click, hover, resize)
4. Inspect computed CSS on key elements using DevTools
5. make sure to add all the finding in a detailied oneby one task on the plan.md file with sprint 3B and task as many as needed. don't summarize, be as detailed as possible.

## Viewport Widths to Test — Take a Screenshot at Each

| Label | Width | What to look for |
|---|---|---|
| Large desktop | 1440px | Full 3-column layout |
| Small desktop | 1024px | Columns may compress |
| Medium / tablet | 768px | TOC disappears from right rail |
| Large mobile | 480px | Sidebar becomes drawer |
| Small mobile | 375px | Everything stacked |

---

## Zone 1 — The Sidebar (Left Panel on Desktop)

### What to observe:

**Default open state (desktop):**
- Where exactly is it positioned? Left edge of viewport or offset?
- What is its width in pixels?
- What is its background color? Is it different from the page background?
- Does it have a right border or shadow?
- Is it `position: sticky`, `position: fixed`, or part of a CSS grid?
- What is its `top` value? Does it account for any top banner/bar?
- Does it scroll independently when content is long?

**Sidebar header area (very top of sidebar):**
- Logo + site title treatment — font size, weight, color
- Is the logo clickable? Where does it link?
- Is there a sidebar collapse/toggle button? Where exactly — top-left or top-right of the sidebar?
- What icon is used for the toggle? What happens visually when clicked?

**Search bar:**
- Position within sidebar — right below the logo?
- Visual style: border, background, placeholder text, keyboard shortcut badge (Ctrl+K)
- Is it a real input or a button that opens a modal?

**Root navigation selector (the "Framework" dropdown):**
- What does it look like? Icon + label + chevron?
- What happens when clicked — dropdown menu or modal?
- Is this a multi-root/version switcher?

**Navigation tree:**
- How are section group headers styled? (e.g. "Introduction", "Writing", "Configurations") — uppercase? bold? muted color? font size?
- How are regular nav items styled? Icon + label? No icon?
- How is the ACTIVE/current page item styled? Background color? Left border? Text color change?
- How are items with children (expandable) indicated? Chevron on the right?
- When a parent is expanded, how are children indented? How far?
- Is there a hover state on nav items? What changes?

**Sidebar footer (bottom of sidebar):**
- What lives at the bottom? GitHub icon link? Theme toggle? Sidebar toggle?
- How are they laid out — flex row?
- Exact position: are they sticky to the bottom even when nav scrolls?

**Collapsed state:**
- When collapsed on desktop, does the sidebar fully disappear or shrink to an icon rail?
- Is there a hover-to-expand behavior? If yes: does it overlay the content or push it?
- What triggers the collapse — a button click? What is the button icon?

---

## Zone 2 — The Header / Top Navigation Bar

### What to observe:

- Is there a full-width top navigation bar at all on desktop? Or does the header live INSIDE the sidebar only?
- If a top nav exists: height in px, background, border-bottom, sticky behavior, z-index (does it sit above sidebar?)
- On medium screens: does a top nav bar appear that wasn't there on desktop?
- What elements are in the top nav on medium/mobile: logo, hamburger, search icon, theme toggle?
- Is there any "breadcrumb" or current-page indicator in a top bar?

---

## Zone 3 — The TOC (Table of Contents — Right Side on Desktop)

### What to observe:

**Desktop right rail:**
- Width in pixels
- Background — same as page or different?
- Left border or separator from main content?
- "On this page" header — font size, color, weight
- TOC item styles — font size, color, line height
- Active item treatment — yellow/gold left border line? Color change on text?
- Indented sub-items — how far indented? Different color from top-level items?
- Is it `position: sticky`? What is its `top` offset?
- Does it scroll independently?

**When does the right TOC disappear?**
- At exactly what viewport width does it stop showing?
- Note the exact pixel breakpoint.

---

## Zone 4 — TOC Popover (Medium and Mobile)

When the right TOC rail is gone, a different TOC mechanism appears.

### What to observe:

**The sticky bar:**
- Where does it appear? Directly below the top nav bar? Or at the very top of the main content area?
- What does it look like? Icon + "On this page" text + chevron?
- OR does it show the current heading the user has scrolled to?
- Is it `position: sticky`? What is its `top` value?
- Background color, border, height in px

**When clicked/tapped:**
- Does a dropdown appear below the bar? Or a full overlay/modal?
- What is the animation — slide down? Fade in?
- How are TOC items displayed inside the dropdown?
- Active item styling — same yellow border as desktop?
- How do you close it — click outside? Click the bar again?

---

## Zone 5 — Mobile Sidebar Drawer

This is critical — observe very carefully.

### What to observe:

**Trigger:**
- What button opens the mobile sidebar? Where is it in the top nav — left side or right side?
- What icon is used — hamburger (☰)? Or a different icon?

**Drawer position:**
- Does the drawer slide in from the LEFT or from the RIGHT?
  *(Based on screenshots provided: it appears to open from the RIGHT — confirm this)*
- Does it cover the full height of the viewport?
- Does it cover the full width or partial width?
- What is the drawer's background color?

**Overlay:**
- Is there a dark overlay behind the open drawer?
- What opacity is the overlay?
- Can you click the overlay to close the drawer?

**Drawer contents:**
- What is at the very top of the drawer? GitHub icon? Theme toggles? Collapse button?
- Is the layout of the drawer contents the same as the desktop sidebar or different?
- Is the "Framework" root selector inside the drawer?
- Is the full navigation tree inside the drawer?
- Is there a search bar inside the drawer?

**Close behavior:**
- Button to close — where is it? Top-right of drawer? Top-left?
- What icon — X? Arrow?
- Animation when closing — slide out? Fade?

---

## Zone 6 — Main Content Area

### What to observe:

**Layout:**
- Max width of the content column — pixels
- Left and right padding inside the content area
- Does the content area have a background different from the page?

**Page header block (top of each page):**
- Page title — font size, weight, color
- Page description (subtitle) — font size, color, margin below title
- "Copy Markdown" and "Open" buttons — what do they look like? Style, border, icon?

**Breadcrumb:**
- Is there a breadcrumb above the title? What does it look like?
- Is it on all pages or only nested pages?

**Pagination (bottom of page):**
- Previous / Next page links — card style? Just links?
- What information is shown — just the page title? Section label too?
- Are there arrow icons?

---

## Zone 7 — Specific UX Interactions to Test

Go through each of these and document what happens:

1. **Collapse sidebar on desktop** — click the toggle button. Does the sidebar fully hide or go to icon-only rail? Does the main content expand to fill the space? Is the transition animated?

2. **Hover on collapsed sidebar** — if the sidebar is collapsed, hover over where it was. Does it re-expand temporarily? Does it overlay or push content?

3. **Scroll down a long page on desktop** — does the sidebar stay fixed? Does the TOC update its active item as you scroll? Is there a scroll progress indicator anywhere?

4. **Click a TOC item** — does it smooth scroll to the heading? Does the URL hash update?

5. **Open mobile drawer** — tap the trigger. Document the animation direction and speed. Is it instant or does it slide?

6. **Resize from desktop to mobile slowly** — at what pixel width does each zone change: TOC disappears, sidebar becomes drawer, top nav changes?

7. **Theme toggle** — click light/dark toggle. Is the transition animated? Does it apply instantly or fade?

8. **Search** — click the Ctrl+K search. Does it open a modal overlay? Does it dim the background? What does the modal look like?

9. **Expand a nav group with children** — click an item with a chevron. Does it expand inline with animation? Does the chevron rotate?

---

## What to Output After Your Observation

Write a structured report with these exact sections:

### 1. Grid System
- What CSS layout method is used for the overall page (grid, flexbox, other)?
- Exact column definitions at each breakpoint
- Named grid areas if CSS grid is used

### 2. CSS Variable List
- Every `--fd-*` CSS variable you can find via DevTools
- What each one controls
- Its computed value at desktop viewport

### 3. Sticky Offset Chain
- For each sticky element: what is its `position`, `top` value, `z-index`
- How they stack on top of each other

### 4. Breakpoint Map
- Exact pixel values where layout changes
- What changes at each breakpoint

### 5. Sidebar Behavior Spec
- Desktop open: dimensions, position, scroll behavior
- Desktop collapsed: what it looks like, hover behavior
- Mobile drawer: which side, dimensions, animation, overlay

### 6. TOC Behavior Spec
- Desktop right rail: dimensions, sticky offset, active indicator
- Popover trigger bar: position, appearance, click behavior
- Popover dropdown: appearance, animation, close behavior

### 7. Interaction Spec
- Every hover state you observed
- Every click/tap behavior
- Every animation (direction, duration estimate, easing)

### 8. Anything Unexpected
- Anything that does not match common documentation site patterns
- Any behavior that would be easy to miss or implement incorrectly

---

## Critical Things NOT to Assume

- Do NOT assume the mobile drawer opens from the left. Verify which side.
- Do NOT assume the sidebar is `position: fixed`. It may be CSS grid + sticky.
- Do NOT assume the TOC popover is a simple dropdown. It may be a sheet or overlay.
- Do NOT assume the header bar exists on desktop — it may only exist at smaller breakpoints.
- Do NOT assume collapse means icon-only rail. It may fully disappear.
- Do NOT assume the bottom of the sidebar (GitHub, theme, toggle) scrolls with the nav. It may be sticky to the bottom independently.

---

## Reference URL

Primary: **https://fumadocs.dev/docs/ui**
Also check: **https://fumadocs.dev/docs/ui/layouts/docs** for layout documentation
Also check: **/reference/fumadocs/** for source

Start with the live site. Source code is secondary confirmation only.


