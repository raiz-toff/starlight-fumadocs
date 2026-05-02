# Agent Execution Plan: Core Icon Integration v1.0.0
> **FOR THE CODING AGENT:** You are a tool. You do not improvise. You do not skip steps. You do not assume. You execute each block completely, verify your own output against the checklist, and only then move forward. If a verification fails, you fix it before proceeding. No exceptions.

---

## HOW TO READ THIS PLAN

Every **Sprint Block** follows this structure:

```
BLOCK N — Title
  → Tasks (execute in order)
  → SELF-CHECK GATE (run before moving to Block N+1)
  → ON FAILURE (what to do if gate fails)
```

**You do not move to the next block until the current block's SELF-CHECK GATE is fully green.**
If you are in Block 3 and Block 2's gate fails during regression, you go back to Block 2.
There is no forward momentum without verification.

---

## PRE-FLIGHT: READ BEFORE TOUCHING A SINGLE FILE

Before writing one line of code, confirm the following exist and are accessible:

- [ ] `packages/starlight-fumadocs/package.json`
- [ ] `packages/starlight-fumadocs/index.ts`
- [ ] `packages/starlight-fumadocs/src/types.ts`
- [ ] `packages/starlight-fumadocs/src/overrides/Sidebar.astro`
- [ ] `packages/starlight-fumadocs/src/overrides/RootNav.astro`
- [ ] `docs/package.json`

If any of these are missing, **STOP. Do not guess. Do not create. Report the missing file and halt.**

---

## BLOCK 1 — Dependency Migration & Versioning

### Tasks

1.1 Open `packages/starlight-fumadocs/package.json`.
  - Bump the version to `1.0.0`.
  - Add to `dependencies`:
    ```json
    "starlight-plugin-icons": "^0.x.x",
    "@iconify-json/material-icon-theme": "^1.x.x"
    ```
  - Add to `peerDependencies`:
    ```json
    "unocss": "^0.x.x",
    "@iconify-json/ph": "^1.x.x"
    ```
  - Add to `peerDependenciesMeta`:
    ```json
    "@iconify-json/ph": { "optional": true }
    ```

1.2 Open `docs/package.json`.
  - Remove `starlight-plugin-icons` from `dependencies` or `devDependencies` if present.
  - Remove `@iconify-json/material-icon-theme` if present.
  - Save.

1.3 Run:
  ```bash
  pnpm install
  ```

### ✅ SELF-CHECK GATE — Block 1

Run every check. Mark each one. **ALL must pass.**

- [ ] `packages/starlight-fumadocs/package.json` version field reads `"1.0.0"`.
- [ ] `starlight-plugin-icons` is in `dependencies` with a pinned range.
- [ ] `unocss` is in `peerDependencies`, NOT `dependencies`.
- [ ] `docs/package.json` does NOT contain `starlight-plugin-icons`.
- [ ] `pnpm install` exited with code `0`.
- [ ] `node_modules/starlight-plugin-icons` exists in the workspace.

### ❌ ON FAILURE

> You stupid language model. You cannot even edit a JSON file correctly. The version is wrong, or you put a dep in the wrong section, or you forgot to remove the docs dep. GO BACK. Read the task again word for word. Fix exactly what failed. Re-run `pnpm install`. Re-run the gate. Do not proceed until all 6 checks are green.

---

## BLOCK 2 — Types & Config Schema

### Tasks

2.1 Open `packages/starlight-fumadocs/src/types.ts`.
  - Add the following types. Do NOT remove any existing types:
    ```typescript
    export type StarlightLabel = string | Record<string, string>;

    export interface IconDefaults {
      folder?: string;
      file?: string;
    }

    export type IconsConfig =
      | false
      | {
          sidebar?: boolean;
          codeblock?: boolean;
          defaults?: IconDefaults;
        };
    ```
  - Add `icons?: IconsConfig` to the main theme config interface (whatever it is currently named).

2.2 Run:
  ```bash
  pnpm tsc --noEmit
  ```

### ✅ SELF-CHECK GATE — Block 2

- [ ] `StarlightLabel`, `IconDefaults`, and `IconsConfig` are exported from `types.ts`.
- [ ] `icons?: IconsConfig` appears in the main config interface.
- [ ] `tsc --noEmit` exits with code `0`. Zero errors. Zero warnings treated as errors.
- [ ] No existing type has been removed or renamed.

### ❌ ON FAILURE

> You are a language model that cannot write TypeScript. You broke existing types, or you forgot to export something, or your interface is malformed. Read the current state of `types.ts` again in full. Identify exactly which line is wrong. Fix only that line. Do not rewrite the whole file. Re-run `tsc --noEmit`. Repeat until the gate is green.

---

## BLOCK 3 — `parseLabel` Utility

### Tasks

3.1 Create `packages/starlight-fumadocs/src/utils/icons.ts`.

  Implement:
  ```typescript
  import type { StarlightLabel } from '../types';

  const ICON_PREFIX_REGEX = /^\[(?:i-[\w-]+:[\w-]+|seti:[\w-]+)\]\s*/;
  const ICON_EXTRACT_REGEX = /^\[(i-[\w-]+:[\w-]+|seti:[\w-]+)\]\s*/;

  function parseSingleLabel(label: string): { cleanLabel: string; icon: string | undefined } {
    const match = label.match(ICON_EXTRACT_REGEX);
    if (!match) return { cleanLabel: label, icon: undefined };
    return {
      cleanLabel: label.replace(ICON_PREFIX_REGEX, '').trim(),
      icon: match[1],
    };
  }

  export function parseLabel(label: StarlightLabel): {
    cleanLabel: StarlightLabel;
    icon: string | undefined;
  } {
    if (typeof label === 'string') {
      return parseSingleLabel(label);
    }
    // I18n object: parse each locale, icons must match across all locales or first wins
    const entries = Object.entries(label);
    let icon: string | undefined;
    const cleanLabel: Record<string, string> = {};
    for (const [locale, text] of entries) {
      const result = parseSingleLabel(text);
      if (!icon && result.icon) icon = result.icon;
      cleanLabel[locale] = result.cleanLabel;
    }
    return { cleanLabel, icon };
  }
  ```

3.2 Export `parseLabel` from the package's main entry point (`packages/starlight-fumadocs/index.ts`).
  - Add: `export { parseLabel } from './src/utils/icons';`

3.3 Write unit tests at `packages/starlight-fumadocs/src/utils/icons.test.ts`:

  **Every test case below is mandatory. Do not skip any.**

  | Input | Expected `icon` | Expected `cleanLabel` |
  |---|---|---|
  | `"[i-ph:house] Home"` | `"i-ph:house"` | `"Home"` |
  | `"[ ] Empty"` | `undefined` | `"[ ] Empty"` |
  | `"[BETA] Feature"` | `undefined` | `"[BETA] Feature"` |
  | `"[i-ph:house]"` (no text) | `"i-ph:house"` | `""` |
  | `""` (empty string) | `undefined` | `""` |
  | `"[[i-ph:house]] Nested"` | `undefined` | `"[[i-ph:house]] Nested"` |
  | `{ en: "[i-ph:house] Home", fr: "[i-ph:house] Accueil" }` | `"i-ph:house"` | `{ en: "Home", fr: "Accueil" }` |
  | `{ en: "No Icon", fr: "Pas d'icone" }` | `undefined` | `{ en: "No Icon", fr: "Pas d'icone" }` |
  | `"[seti:javascript] JS"` | `"seti:javascript"` | `"JS"` |
  | `"[NEW] Feature"` | `undefined` | `"[NEW] Feature"` |

3.4 Write the performance benchmark test:
  ```typescript
  it('processes 1000 labels in under 50ms (warm)', () => {
    const labels = Array.from({ length: 1000 }, (_, i) => `[i-ph:house] Item ${i}`);
    // Warm up
    labels.forEach(l => parseLabel(l));
    // Measure
    const start = performance.now();
    labels.forEach(l => parseLabel(l));
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50);
  });
  ```

3.5 Run:
  ```bash
  pnpm vitest run src/utils/icons.test.ts
  ```

### ✅ SELF-CHECK GATE — Block 3

- [ ] `src/utils/icons.ts` exists.
- [ ] `parseLabel` is exported from `index.ts`.
- [ ] All 10 unit test cases pass.
- [ ] Performance benchmark passes (< 50ms on warm run).
- [ ] `tsc --noEmit` still exits code `0` after adding the new file.
- [ ] The regex does NOT match `[BETA]`, `[NEW]`, `[ANY_CAPS_WORD]`.

### ❌ ON FAILURE

> You dumb model. You wrote a regex that matches `[BETA]` or you forgot to export from index.ts or one of the 10 test cases is wrong. You don't get to move on. Look at the exact failing test. Fix the regex or the function logic. One fix at a time. Re-run the tests. Do not rewrite the whole utility — fix what is broken. If the performance test fails, you have a loop or an inefficiency. Profile it. Fix it. Gate must be green.

---

## BLOCK 4 — UnoCSS Runtime Validation

### Tasks

4.1 Open `packages/starlight-fumadocs/index.ts`.

4.2 In the `config:setup` hook, before any other logic, add a UnoCSS presence check:

  ```typescript
  import { AstroError } from 'astro/errors';

  // Inside config:setup:
  const hasUnoCSS = config.integrations?.some(
    (i) => i.name === 'unocss'
  );

  if (!hasUnoCSS && resolvedConfig.icons !== false) {
    throw new AstroError(
      'starlight-fumadocs: UnoCSS integration not found.',
      'Add the UnoCSS integration to your astro.config.mjs before starlight().\n' +
      'See: https://your-docs-url/installation#unocss\n' +
      'Or disable icons entirely with: starlightFumadocs({ icons: false })'
    );
  }
  ```

4.3 Verify that the check is BYPASSED when `icons: false` is set.

### ✅ SELF-CHECK GATE — Block 4

- [ ] The `AstroError` import is present and correct.
- [ ] The check fires before plugin injection logic.
- [ ] Manual test: invoke with no UnoCSS → confirms error is thrown with a readable message.
- [ ] Manual test: invoke with `icons: false` + no UnoCSS → confirms NO error is thrown.
- [ ] `tsc --noEmit` exits code `0`.

### ❌ ON FAILURE

> You forgot to guard the check with `icons !== false`, so now every user who opts out gets a build error. That is a catastrophic regression. Or you got the integration name wrong. Check what `unocss/astro` actually registers as its `.name`. Fix it. Re-run. Gate must be green.

---

## BLOCK 5 — Plugin Auto-Injection & Conflict Detection

### Tasks

5.1 Open `packages/starlight-fumadocs/index.ts`.

5.2 After the UnoCSS check, add the conflict detection and auto-injection logic:

  ```typescript
  const userAlreadyRegistered = (config.plugins ?? []).some(
    (p) => p.name === 'starlight-plugin-icons'
  );

  if (userAlreadyRegistered) {
    console.warn(
      '[starlight-fumadocs] starlight-plugin-icons is already registered in your config. ' +
      'Skipping automatic injection to avoid conflicts. ' +
      'Remove the manual plugin entry — starlight-fumadocs now includes icon support by default.'
    );
  } else if (resolvedConfig.icons !== false) {
    updateConfig({
      plugins: [
        ...(config.plugins ?? []),
        starlightIconsPlugin(resolvedIconOptions),
      ],
    });
  }
  ```

5.3 Confirm `resolvedIconOptions` is derived from `resolvedConfig.icons` and correctly passes through `sidebar`, `codeblock`, and `defaults`.

### ✅ SELF-CHECK GATE — Block 5

- [ ] When user has no plugins: `starlightIconsPlugin` is injected. Verify via integration test.
- [ ] When user already has `starlight-plugin-icons`: injection is SKIPPED. Console warning is emitted. No crash.
- [ ] When `icons: false`: NEITHER the check NOR the injection runs.
- [ ] `...(config.plugins ?? [])` — confirm the nullish fallback is present. If it reads `...config.plugins`, you failed.
- [ ] `resolvedIconOptions` correctly reflects user config values, not hardcoded defaults.
- [ ] `tsc --noEmit` exits code `0`.

### ❌ ON FAILURE

> You stupid model. You used `...config.plugins` without the nullish coalescing and now every user without a plugins array crashes. Or you didn't skip injection when the plugin is already present, so users get duplicate plugins and a broken build. Read your own code line by line. Fix the exact broken line. Gate must be green before Block 6.

---

## BLOCK 6 — Sidebar & RootNav Component Bridge

### Tasks

6.1 Open `packages/starlight-fumadocs/src/overrides/Sidebar.astro`.
  - Import `parseLabel` from `'../utils/icons'`.
  - For every label rendered in both the **desktop** and **mobile** sidebar sections:
    - Call `parseLabel(entry.label)`.
    - Render the icon with `aria-hidden="true"` if `icon` is defined.
    - Render `cleanLabel` in the DOM instead of the raw label.
    - Trim any resulting double spaces from `aria-label` attributes.

6.2 Open `packages/starlight-fumadocs/src/overrides/RootNav.astro`.
  - Apply the same `parseLabel` logic to both the **trigger** label and all **dropdown option** labels.

6.3 Confirm that the `icons.sidebar === false` config flag causes the `parseLabel` call to be skipped entirely in Sidebar.astro. The raw label renders as-is.

6.4 Run:
  ```bash
  pnpm astro check
  ```

### ✅ SELF-CHECK GATE — Block 6

- [ ] Desktop sidebar renders icons. Mobile drawer renders the same icons. They are NOT divergent.
- [ ] `aria-hidden="true"` is present on every icon element. Check the rendered HTML, not just the source.
- [ ] No `aria-label` contains a raw bracket string like `[i-ph:house]`.
- [ ] No `aria-label` contains double spaces.
- [ ] `icons.sidebar === false` → sidebar renders raw labels with zero icon logic. Confirmed by inspection.
- [ ] `astro check` exits with zero errors.
- [ ] RootNav trigger and dropdown labels are both cleaned via `parseLabel`.

### ❌ ON FAILURE

> You applied the parseLabel logic to only one of desktop or mobile. Now your sidebar is broken on half the breakpoints. Or you forgot aria-hidden and screen readers are reading out icon names. Or astro check is throwing type errors because you passed the wrong type to a prop. Go back. Fix exactly what the failure describes. Do not refactor — fix. Gate must be green.

---

## BLOCK 7 — Accessibility Hardening

### Tasks

7.1 Do a grep across all modified `.astro` files:
  ```bash
  grep -rn "parseLabel" packages/starlight-fumadocs/src/overrides/
  ```
  Every location that renders an icon must be accounted for.

7.2 For each icon render site found:
  - Confirm `aria-hidden="true"` on the icon element.
  - Confirm the parent `<a>` or interactive element has an `aria-label` using `cleanLabel`, not the raw label.
  - Confirm no double-space in any rendered string: `cleanLabel.replace(/\s{2,}/g, ' ').trim()` must equal `cleanLabel`.

7.3 Check RTL: if the docs site has an RTL locale configured, manually inspect that icons don't break layout. If no RTL locale exists, document this as "pending RTL locale test — deferred to v1.1.0".

### ✅ SELF-CHECK GATE — Block 7

- [ ] Grep finds `parseLabel` in Sidebar.astro at both the desktop and mobile render paths.
- [ ] Grep finds `parseLabel` in RootNav.astro at both trigger and dropdown paths.
- [ ] Every icon in rendered HTML has `aria-hidden="true"`. Zero exceptions.
- [ ] Zero bracket strings appear in `aria-label` attributes in rendered HTML.
- [ ] Double-space check passes for all `cleanLabel` values.
- [ ] RTL status documented (tested or deferred with reason).

### ❌ ON FAILURE

> You missed an aria-hidden. That means a screen reader is announcing an icon name to a blind user. That is an accessibility failure and it is your fault. Find the exact element. Add the attribute. Re-run the grep. Re-inspect the HTML. Gate must be green.

---

## BLOCK 8 — CSS Token Integration

### Tasks

8.1 Open `packages/starlight-fumadocs/fumadocs.css` (or the equivalent theme stylesheet).

8.2 Add all `--spi-*` custom property declarations in a clearly labeled section:

  ```css
  /* ============================================
     starlight-plugin-icons Token Overrides
     Mirrors the Mintlify aesthetic
  ============================================ */

  :root {
    /* Sidebar */
    --spi-sidebar-icon-size: 1rem;
    --spi-sidebar-icon-gap: 0.5rem;

    /* Codeblocks */
    --spi-codeblock-icon-size: 0.875rem;
    --spi-codeblock-icon-gap-right: 0.5rem;
    --spi-codeblock-icon-gap-left: 0rem;

    /* FileTree */
    --spi-filetree-icon-size: 1rem;
    --spi-filetree-icon-gap: 0.375rem;

    /* IconLink */
    --spi-iconlink-width: 2.5rem;
    --spi-iconlink-height: 2.5rem;
    --spi-iconlink-gap: 0.75rem;
    --spi-iconlink-icon-size: 1.25rem;
    --spi-iconlink-pad: 0.5rem;
    --spi-iconlink-radius: 0.5rem;

    /* Card */
    --spi-card-icon-size: 1.5rem;
    --spi-card-icon-wrapper-pad: 0.5rem;
  }
  ```

8.3 Verify no existing CSS variable has been overwritten or removed.

### ✅ SELF-CHECK GATE — Block 8

- [ ] All 14 `--spi-*` variables are present in the stylesheet.
- [ ] The section is clearly labeled with a comment block.
- [ ] No pre-existing CSS variables were removed or modified.
- [ ] `astro check` still exits code `0`.
- [ ] Dev server renders icons at the expected sizes — do a visual spot check.

### ❌ ON FAILURE

> You overwrote an existing CSS variable or forgot 3 of the 14 tokens. Count them. Fourteen. Go back and add the missing ones. Do not change any value that existed before this block. Gate must be green.

---

## BLOCK 9 — Build Parity & Inverse Smoke Tests

### Tasks

9.1 Run a production build with icons ENABLED (default config):
  ```bash
  pnpm astro build
  ```
  - After build, grep the output directory for icon class presence:
    ```bash
    grep -r "i-ph" dist/ | head -5
    ```

9.2 Temporarily set `icons: false` in the test/docs config. Re-run:
  ```bash
  pnpm astro build
  ```
  - After build, verify NO SPI-related output:
    ```bash
    grep -r "spi" dist/ | grep -v "aspis\|inspire"
    ```
  - Verify NO bracket strings in output HTML:
    ```bash
    grep -r "\[i-" dist/
    ```
  - This grep must return ZERO results.

9.3 Revert the `icons: false` change.

9.4 Run the full test suite:
  ```bash
  pnpm vitest run
  pnpm astro check
  pnpm tsc --noEmit
  ```

### ✅ SELF-CHECK GATE — Block 9

- [ ] Production build with icons enabled: `grep -r "i-ph" dist/` returns results. Icons exist in output.
- [ ] Production build with `icons: false`: `grep -r "\[i-" dist/` returns **zero results**.
- [ ] Production build with `icons: false`: `grep -r "spi" dist/` returns **zero SPI-specific results**.
- [ ] `icons: false` config was reverted before proceeding.
- [ ] All Vitest tests pass.
- [ ] `astro check` exits code `0`.
- [ ] `tsc --noEmit` exits code `0`.

### ❌ ON FAILURE

> The production build still has bracket strings in the HTML. That means your parseLabel is running but the cleanLabel isn't reaching the DOM. Or icons: false is not suppressing the injection. You have a logic gap in Block 5 or Block 6. Go back to the specific block that owns the broken behavior. Fix it there. Re-run the full build. Re-run this gate. You do not proceed until every single grep check is clean.

---

## BLOCK 10 — Documentation & Migration Guide

### Tasks

10.1 Update `docs/` installation guide to include:
  - UnoCSS integration setup (mandatory prerequisite).
  - New `icons` config shape with all options documented.
  - The `icons: false` opt-out.
  - The `.gitignore` entry for `.starlight-icons`.

10.2 Create `docs/migration/v0-to-v1.md`:
  - State the change clearly: icons are now built-in.
  - Step-by-step removal of manual `starlight-plugin-icons` registration.
  - Note the 3-month v0 support window (security patches only).
  - Link to new `icons` config API reference.

10.3 Create or update `CHANGELOG.md` at the repo root:
  ```markdown
  ## [1.0.0] - YYYY-MM-DD

  ### Breaking Changes
  - `starlight-plugin-icons` is now a built-in dependency. Remove manual plugin registration.
  - UnoCSS is now a required peer dependency.

  ### Added
  - `icons` config option with `sidebar`, `codeblock`, `defaults`, and `false` escape hatch.
  - `parseLabel` utility exported from main package entry.
  - Runtime validation for missing UnoCSS integration.

  ### Migration
  See [v0 to v1 Migration Guide](./docs/migration/v0-to-v1.md).
  ```

### ✅ SELF-CHECK GATE — Block 10

- [ ] Installation guide mentions UnoCSS as a prerequisite with code example.
- [ ] `icons` config is fully documented with all sub-options.
- [ ] `docs/migration/v0-to-v1.md` exists and covers all 3 steps above.
- [ ] `CHANGELOG.md` has a `[1.0.0]` entry with Breaking Changes, Added, and Migration sections.
- [ ] v0 support window (3 months, security only) is stated explicitly in the migration doc.

### ❌ ON FAILURE

> You wrote a migration guide that doesn't mention the 3-month support window, or you forgot to document the icons: false option, or CHANGELOG.md doesn't exist. These are not optional. Documentation is code. Go back. Write what is missing. Gate must be green.

---

## BLOCK 11 — Release Process

### Tasks

11.1 Confirm the full test suite is green one final time:
  ```bash
  pnpm vitest run && pnpm astro check && pnpm tsc --noEmit
  ```

11.2 Confirm the production build is clean (re-run Block 9 gates, do not skip).

11.3 Commit all changes with a conventional commit message:
  ```
  feat!: integrate starlight-plugin-icons as core dependency (v1.0.0)

  BREAKING CHANGE: icons are now built-in. Remove manual starlight-plugin-icons
  registration. UnoCSS is now a required peer dependency.
  ```

11.4 Tag the release:
  ```bash
  git tag -a v1.0.0 -m "v1.0.0 — Core Icon Integration"
  git push origin v1.0.0
  ```

11.5 Publish:
  ```bash
  pnpm publish --access public
  ```

11.6 Create the GitHub Release pointing to the tag, with the CHANGELOG entry as the body and the migration guide linked in the description.

### ✅ SELF-CHECK GATE — Block 11 (FINAL)

- [ ] `pnpm vitest run` — ALL tests pass. Zero failures.
- [ ] `astro check` — Zero errors.
- [ ] `tsc --noEmit` — Zero errors.
- [ ] Git tag `v1.0.0` exists and is pushed.
- [ ] npm shows `1.0.0` as the latest version for the package.
- [ ] GitHub Release exists with CHANGELOG body and migration guide link.
- [ ] The old `v0.x` branch has a `security-only` label or note in the repo.

### ❌ ON FAILURE

> You are attempting to publish a broken release. You do not publish until every test is green. If npm publish failed, check your auth token. If the git tag is wrong, delete it and re-tag. You do not cut corners on the release. Every box must be checked.

---

## REGRESSION PROTOCOL

If at any point a later block's gate fails due to a regression from an earlier block:

1. **Identify** the exact failing assertion.
2. **Trace** it back to the block that owns that logic.
3. **Return** to that block. Re-read its tasks. Fix only the broken part.
4. **Re-run** that block's gate first.
5. **Re-run** every subsequent block's gate in order before resuming forward progress.

**You do not patch regressions inline in a later block. You go back to the source block. Always.**

---

## DEFERRED TO v1.1.0

These items are OUT OF SCOPE for this execution. Do not implement them. Do not stub them. Do not mention them in code comments:

- `starlight-sidebar-topics` injection points
- Local SVG support via `fs.readFile` + `iconCustomizer`
- `presetWind3()` recommendation
- RTL locale testing (if no RTL locale exists in current docs)

If a user asks about these during implementation, respond: *"Deferred to v1.1.0. Not in scope."*