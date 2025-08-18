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
  const path = section === 'cake' ? (base || '/') : `${base}/${section}`;
  if (ctx.mode === 'owner') {
    const sep = path.includes('?') ? '&' : '?';
    return `${path}${sep}uid=${ctx.ownerId}`;
  }
  return path;
}
