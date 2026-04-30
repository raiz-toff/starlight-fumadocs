import type { StarlightPlugin } from '@astrojs/starlight/types'

export default function starlightFumadocs(): StarlightPlugin {
  return {
    name: 'starlight-fumadocs',
    hooks: {
      'config:setup'({ config, logger, updateConfig, addRouteMiddleware }) {
        /**
         * This is the entry point of your Starlight plugin.
         * The `config:setup` hook is called when Starlight is initialized (during the Astro `astro:config:setup`
         * integration hook).
         * To learn more about the Starlight plugin API and all available options in this hook, check the Starlight
         * plugins reference.
         *
         * @see https://starlight.astro.build/reference/plugins/
         */
        logger.info('Hello from the starlight-fumadocs plugin!')

        addRouteMiddleware({
          entrypoint: 'starlight-fumadocs/middleware',
          order: 'post',
        })

        /**
         * Update the provided Starlight user configuration by appending the theme CSS file to the `customCss` array.
         * To start customizing your theme, edit the `packages/starlight-fumadocs/styles.css` file.
         *
         * @see https://starlight.astro.build/reference/plugins/#updateconfig
         * @see https://starlight.astro.build/reference/configuration/#customcss
         */
        updateConfig({
          customCss: [...(config.customCss ?? []), 'starlight-fumadocs/styles'],
          components: {
            ...config.components,
            Header: 'starlight-fumadocs/overrides/Header.astro',
            PageFrame: 'starlight-fumadocs/overrides/PageFrame.astro',
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
          },
        })
      },
    },
  }
}
