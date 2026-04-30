# starlight-fumadocs

A premium, high-fidelity Starlight theme that brings the modern, architectural look and feel of [FumaDocs](https://fumadocs.dev) to your Starlight documentation.

## Features

- **Elastic Worm TOC Glide**: A sophisticated Table of Contents navigation indicator with asymmetric physics that lunges and contracts as you scroll.
- **Architectural Sidebar Rails**: Vertical hierarchy connectors with active-state accent bars for a clean, structural navigation experience.
- **Unified Design System**: All components are mathematically linked to a global `--fuma-radius` design token (defaulting to 8px).
- **Responsive "Worm" Dropdown**: A custom mobile TOC with circular progress tracking and its own vertical "tracker" line.
- **Matte Focal Dot**: A precision-engineered active section indicator without distracting glows, ensuring sub-pixel smoothness.
- **Full Theme Support**: Pixel-perfect parity across both Light and Dark modes with curated, high-contrast color palettes.
- **Accessibility First**: Unified `2px` focus ring system across all interactive elements for total keyboard navigability.

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
