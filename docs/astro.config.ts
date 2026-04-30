import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightFumadocs from 'starlight-fumadocs'
import tailwind from '@tailwindcss/vite'
import astroD2 from 'astro-d2'
import starlightImageZoom from 'starlight-image-zoom'

export default defineConfig({
  vite: {
    plugins: [tailwind()],
  },
  integrations: [
    astroD2({
      experimental: {
        useD2js: true,
      },
      theme: {
        default: '0',
        dark: '200',
      },
    }),
    starlight({
      editLink: {
        baseUrl: 'https://github.com/raiz-toff/starlight-fumadocs/edit/main/docs/',
      },
      plugins: [
        starlightFumadocs(),
        starlightImageZoom(),
      ],
      expressiveCode: {
        themes: ['github-dark', 'github-light'],
        styleOverrides: {
          textMarkers: {
            markBackground: 'var(--ec-codeMarkBg)',
            markBorderColor: 'var(--ec-codeMarkBrd)',
            insBackground: 'var(--ec-codeInsBg)',
            insBorderColor: 'var(--ec-codeInsBrd)',
            delBackground: 'var(--ec-codeDelBg)',
            delBorderColor: 'var(--ec-codeDelBrd)',
          },
        },
      },
      customCss: ['./src/styles/tailwind.css'],
      sidebar: [
        {
          label: 'Start Here',
          items: ['getting-started', 'customization'],
        },
        {
          label: 'Examples',
          autogenerate: { directory: 'examples' },
        },

      ],
      social: [
        { href: 'https://github.com/raiz-toff/starlight-fumadocs', icon: 'github', label: 'GitHub' },
      ],
      title: 'Starlight-Fumadocs',
    }),
  ],
})
