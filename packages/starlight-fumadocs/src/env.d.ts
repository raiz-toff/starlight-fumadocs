/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    t: any;
    starlightRoute: any;
    starlightFumadocs: {
      activeGroup: any;
      allGroups: any[];
      breadcrumbs: any[];
    };

  }
}

declare module 'virtual:starlight/*' {
  const Component: any;
  export default Component;
  export const logos: any;
  export const pagefindUserConfig: any;
  export const siteTitle: any;
}

declare module '@pagefind/default-ui' {
  export const PagefindUI: any;
}

declare const StarlightThemeProvider: {
  updatePickers(theme?: string): void;
};



