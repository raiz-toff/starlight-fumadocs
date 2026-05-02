import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightFumadocs from 'starlight-fumadocs'
import astroD2 from 'astro-d2'
import starlightImageZoom from 'starlight-image-zoom'
import UnoCSS from 'unocss/astro'
import { starlightIconsPlugin, defineSidebar, starlightIconsIntegration } from 'starlight-plugin-icons'

export default defineConfig({
  vite: {
    plugins: [],
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
    UnoCSS(),
    starlightIconsIntegration({
      extractSafelist: true,
    }),
    starlight({
      editLink: {
        baseUrl: 'https://github.com/raiz-toff/starlight-fumadocs/edit/main/docs/',
      },
      plugins: [
        starlightFumadocs({
          rootNav: {
            title: 'My Docs',
            groups: {
              'Start Here': {
                description: 'Get started with the theme',
              },
              'Examples': {
                description: 'Explore live examples',
              }
            }
          }
        }),
        starlightIconsPlugin({
          sidebar: true,
          codeblock: false,
        }),
        starlightImageZoom(),
      ],
      customCss: [
        './src/styles/tailwind.css',
        'starlight-plugin-icons/styles/main.css'
      ],
      sidebar: defineSidebar([
        {
          label: 'Start Here',
          items: [
            { label: 'Getting Started', slug: 'getting-started', icon: 'i-ph:hand-waving-duotone' },
            { label: 'Customization', slug: 'customization', icon: 'i-ph:palette-duotone' }
          ],
        },
        {
          label: 'Examples',
          autogenerate: { directory: 'examples' },
        },
      ]),
      social: [
        { href: 'https://github.com/raiz-toff/starlight-fumadocs', icon: 'github', label: 'GitHub' },
      ],
      title: 'Starlight-Fumadocs',
      components: {
        TableOfContents: './src/components/ConnectTOC.astro',
      },
    }),
  ],
})
