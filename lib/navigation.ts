import type { ViewContext } from './profile';

export type Section =
  | 'cake'
  | 'planning'
  | 'flavors'
  | 'ingredients'
  | 'review'
  | 'people'
  | 'visibility';

export function getSectionHref(section: Section, ctx: ViewContext): string {
  const base = ctx.mode === 'viewer' && ctx.viewId ? `/view/${ctx.viewId}` : '';
  if (section === 'cake') {
    return base || '/';
  }
  return `${base}/${section}`;
}
