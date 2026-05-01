import { defineRouteMiddleware, type StarlightRouteData } from '@astrojs/starlight/route-data';

export const onRequest = defineRouteMiddleware(async (context) => {
  const { sidebar } = context.locals.starlightRoute;

  // 1. Identify all top-level groups
  const groups = sidebar.filter((entry: StarlightRouteData['sidebar'][number]) => entry.type === 'group');

  if (groups.length === 0) return;

  // 2. Find which group contains the current page
  // Recursive helper to check if a sidebar entry or any of its children is the current page
  const isCurrentInGroup = (entry: StarlightRouteData['sidebar'][number]): boolean => {
    if (entry.type === 'link') return entry.isCurrent;
    return entry.entries.some((child) => isCurrentInGroup(child));
  };

  const activeGroup = groups.find((group: StarlightRouteData['sidebar'][number]) => isCurrentInGroup(group)) ?? groups[0];


  // 3. Find breadcrumbs (before sidebar is mangled)
  // Recursive helper to find the first link in a group
  const getFirstLink = (item: StarlightRouteData['sidebar'][number]): string | undefined => {
    if (item.type === 'link') return item.href;
    for (const entry of item.entries) {
      const href = getFirstLink(entry);
      if (href) return href;
    }
    return undefined;
  };

  const getBreadcrumbs = (items: StarlightRouteData['sidebar'], path: any[] = []): any[] | null => {
    for (const item of items) {
      if (item.type === 'link' && item.isCurrent) return [...path, item];
      if (item.type === 'group') {
        const found = getBreadcrumbs(item.entries, [...path, { 
          type: 'group', 
          label: item.label,
          href: getFirstLink(item)
        }]);
        if (found) return found;
      }
    }
    return null;
  };
  const breadcrumbs = getBreadcrumbs(sidebar) || [];


  // 4. Store active group info for components (like RootNav and Breadcrumb)
  // @ts-ignore
  const { getPluginConfig } = await import('starlight-fumadocs');
  const config = getPluginConfig?.() ?? {};

  context.locals.starlightFumadocs = {
    activeGroup,
    allGroups: groups,
    breadcrumbs,
    config,
  };

  // 4. Transform the sidebar to ONLY show the items within the active group
  // This effectively "switches" the sidebar to that folder/group
  context.locals.starlightRoute.sidebar = activeGroup.type === 'group' ? activeGroup.entries : [];
});
