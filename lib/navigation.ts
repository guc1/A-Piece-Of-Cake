import type { ViewContext } from './profile';

export type Section =
  | 'cake'
  | 'planning'
  | 'flavors'
  | 'ingredients'
  | 'review'
  | 'people'
  | 'visibility';

export function hrefFor(
  sectionOrPath: Section | string,
  ctx: ViewContext,
): string {
  if (sectionOrPath.startsWith('/')) {
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
      case 'people':
        return `${base}/people`;
      case 'visibility':
        return `${base}/visibility`;
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
