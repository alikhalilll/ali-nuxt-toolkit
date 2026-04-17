export function normalizeProvideName(provideName: string | undefined, fallback: string): string {
  const name = (provideName ?? fallback).trim();
  const stripped = name.startsWith('$') ? name.slice(1) : name;
  return stripped || fallback;
}
