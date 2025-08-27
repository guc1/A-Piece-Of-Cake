export function toDmy(ymd: string): string {
  if (!/\d{4}-\d{2}-\d{2}/.test(ymd)) return ymd;
  const [y, m, d] = ymd.split('-');
  return `${d}${m}${y}`;
}

export function fromDmy(dmy: string): string {
  if (!/\d{8}/.test(dmy)) return dmy;
  const d = dmy.slice(0, 2);
  const m = dmy.slice(2, 4);
  const y = dmy.slice(4, 8);
  return `${y}-${m}-${d}`;
}
