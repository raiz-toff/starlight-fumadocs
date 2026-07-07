import type { StarlightPlugin } from '@astrojs/starlight/types'
import type { StarlightFumadocsConfig } from './src/types'


export function getPluginConfig() {
  // @ts-ignore
  return globalThis.starlightFumadocsConfig ?? {}
}

export default function starlightFumadocs(options?: StarlightFumadocsConfig): StarlightPlugin {
  if (options) {
    // @ts-ignore
    globalThis.starlightFumadocsConfig = options
  }
  return {
    name: 'starlight-fumadocs',
    hooks: {
      'config:setup'(options: any) {
        const { config, logger, updateConfig, addRouteMiddleware } = options
        logger.info('Hello from the starlight-fumadocs plugin!')

        addRouteMiddleware({
          entrypoint: 'starlight-fumadocs/middleware',
          order: 'post',
        })

        updateConfig({
          customCss: [...(config.customCss ?? []), 'starlight-fumadocs/styles'],
          components: {
            Header: 'starlight-fumadocs/overrides/Header.astro',
            PageFrame: 'starlight-fumadocs/overrides/PageFrame.astro',
            Breadcrumbs: 'starlight-fumadocs/overrides/Empty.astro',
            SiteTitle: 'starlight-fumadocs/overrides/SiteTitle.astro',
            Search: 'starlight-fumadocs/overrides/Search.astro',
            ThemeSelect: 'starlight-fumadocs/overrides/ThemeSelect.astro',
            Sidebar: 'starlight-fumadocs/overrides/Sidebar.astro',
            PageSidebar: 'starlight-fumadocs/overrides/PageSidebar.astro',
            MobileTableOfContents: 'starlight-fumadocs/overrides/MobileTableOfContents.astro',
            TableOfContents: 'starlight-fumadocs/overrides/TableOfContents.astro',
            PageTitle: 'starlight-fumadocs/overrides/PageTitle.astro',
            Pagination: 'starlight-fumadocs/overrides/Pagination.astro',
            Footer: 'starlight-fumadocs/overrides/Footer.astro',
            MobileMenuToggle: 'starlight-fumadocs/overrides/MobileMenuToggle.astro',
            Banner: 'starlight-fumadocs/overrides/Banner.astro',
            Aside: 'starlight-fumadocs/overrides/Aside.astro',
            Card: 'starlight-fumadocs/overrides/Card.astro',
            LinkCard: 'starlight-fumadocs/overrides/LinkCard.astro',
            ...config.components,
          },
        })
      },
    },
  }
}
