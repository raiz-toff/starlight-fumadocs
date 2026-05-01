import { pluginIcon } from 'starlight-plugin-icons'
import { defineEcConfig as defineConfig } from 'astro-expressive-code'

export default defineConfig({
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
  plugins: [pluginIcon()],
})
