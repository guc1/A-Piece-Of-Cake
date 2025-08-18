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
  if (sectionOrPath === 'people') {
    return ctx.mode === 'viewer'
      ? `/view/${ctx.viewId}/people`
      : '/people';
  }
  if (sectionOrPath.startsWith('/')) {
    // raw path case
    return ctx.mode === 'viewer'
      ? `/view/${ctx.viewId}${sectionOrPath === '/' ? '' : sectionOrPath}`
      : sectionOrPath;
  }
  if (ctx.mode === 'viewer') {
    const base = `/view/${ctx.viewId}`;
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
      case 'visibility':
        return base; // no visibility route for viewers
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
    case 'visibility':
      return '/visibility';
  }
}
