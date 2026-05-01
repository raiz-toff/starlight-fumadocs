import { defineConfig, presetIcons, presetUno } from 'unocss'
import { presetStarlightIcons } from 'starlight-plugin-icons/uno'

export default defineConfig({
  content: {
    pipeline: {
      include: [
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html|ts)($|\?)/,
      ],
    },
  },
  presets: [
    presetUno(),
    presetIcons({
      scale: 1.2,
      prefix: 'i-',
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
    presetStarlightIcons(),
  ],
})
