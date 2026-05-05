# starlight-fumadocs

A premium, high-fidelity Starlight theme that brings the modern, architectural look and feel of [FumaDocs](https://fumadocs.dev) to your Starlight documentation.

## Features

- **Fluid Spring-Based TOC**: A high-performance Table of Contents indicator using spring-physics for a "stretchy" natural feel. Includes directional "lead dots" that intelligently switch positions based on scroll direction.
- **Premium Search UI**: A custom-engineered search interface with Astro-inspired aesthetics, smooth transitions, and theme-aware styling.
- **Architectural Sidebar Rails**: Vertical hierarchy connectors with active-state accent bars for a clean, structural navigation experience.
- **Minimal Mobile Popover**: A streamlined mobile TOC bar with circular scroll-progress tracking and a clean, responsive dropdown.
- **Compact Architectural Layout**: Optimized vertical whitespace and reduced gaps between title, breadcrumbs, and content for a professional, high-density reading experience.
- **Unified Design System**: All components are mathematically linked to global design tokens like `--fuma-radius` and leverage Tailwind CSS for styling.
- **Full Theme Support**: Pixel-perfect parity across both Light and Dark modes with curated, high-contrast color palettes.

## Prerequisites

This theme requires **Tailwind CSS** to be installed and configured in your Astro project.

```bash
npx astro add tailwind
```

## Installation

```bash
# Using npm
npm install starlight-fumadocs

# Using pnpm
pnpm add starlight-fumadocs

# Using yarn
yarn add starlight-fumadocs
```

## Usage

1. Configure the plugin in your `astro.config.mjs` file:

```javascript
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightFumadocs from 'starlight-fumadocs';

export default defineConfig({
  integrations: [
    starlight({
      title: 'My Documentation',
      plugins: [
        starlightFumadocs(),
      ],
    }),
  ],
});
```

## Configuration

You can customize the theme's core aesthetics using CSS variables in your global stylesheet:

```css
:root {
  /* Change the global border radius */
  --fuma-radius: 12px;

  /* Customize the glide indicator color */
  --glide-indicator-color: var(--sl-color-accent);
  
  /* Adjust the sidebar rail visibility */
  --glide-track-color: var(--sl-color-gray-4);
}
```

## Credits

Inspired by the exceptional design of [FumaDocs](https://fumadocs.dev).

## License

MIT
