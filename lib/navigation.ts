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
  if (ctx.mode === 'viewer') {
    const base = `/view/${ctx.viewId}`;
    return section === 'cake' ? base : `${base}/${section}`;
  }
  return section === 'cake' ? '/' : `/${section}`;
}
