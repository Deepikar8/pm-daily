export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function compareIsoDate(a: string, b: string): number {
  return a.localeCompare(b);
}

