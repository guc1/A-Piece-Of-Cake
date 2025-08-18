import type { ViewContext } from './profile';

export type Section =
  | 'cake'
  | 'planning'
  | 'flavors'
  | 'ingredients'
  | 'review'
  | 'people'
  | 'visibility';

/**
 * Compute an href for a navigation target. Accepts either a known section name
 * or an arbitrary path starting with "/". When in viewer mode, the helper
 * ensures the `/view/{viewId}` prefix persists so navigation stays within the
 * viewed account.
 */
export function hrefFor(
  sectionOrPath: Section | string,
  ctx: ViewContext,
): string {
  if (sectionOrPath.startsWith('/')) {
    // raw path case
    if (ctx.mode === 'viewer') {
      return `/view/${ctx.viewId}${sectionOrPath === '/' ? '' : sectionOrPath}`;
    }
    if (ctx.mode === 'historical') {
      const base =
        ctx.viewerId === ctx.ownerId
          ? `/history/self/${ctx.snapshotDate}`
          : `/history/${ctx.viewId}/${ctx.snapshotDate}`;
      return `${base}${sectionOrPath === '/' ? '' : sectionOrPath}`;
    }
    return sectionOrPath;
  }
  if (ctx.mode === 'viewer' || ctx.mode === 'historical') {
    const base =
      ctx.mode === 'viewer'
        ? `/view/${ctx.viewId}`
        : ctx.viewerId === ctx.ownerId
          ? `/history/self/${ctx.snapshotDate}`
          : `/history/${ctx.viewId}/${ctx.snapshotDate}`;
    switch (sectionOrPath) {
      case 'cake':
      default:
        return base;
      case 'planning':
        return `${base}/planning`;
      case 'flavors':
        return `${base}/flavors`;
      case 'ingredients':
        return `${base}/ingredients`;
      case 'review':
        return `${base}/review`;
      case 'people':
        return `${base}/people`;
      case 'visibility':
        return base; // no visibility route for viewers/historical
    }
  }
  switch (sectionOrPath) {
    case 'cake':
    default:
      return '/';
    case 'planning':
      return '/planning';
    case 'flavors':
      return '/flavors';
    case 'ingredients':
      return '/ingredients';
    case 'review':
      return '/review';
    case 'people':
      return '/people';
    case 'visibility':
      return '/visibility';
  }
}
