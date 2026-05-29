/**
 * Default flag URL builder — flagcdn.com hosts PNG flags at multiple widths and is
 * generous with caching + no API key required. Swap via the `flagUrl` prop on
 * ATellInput / ACountrySelect / ACountryFlag to use any other source.
 */
export function defaultFlagUrl(iso2: string, width = 40): string {
  return `https://flagcdn.com/w${width}/${iso2.toLowerCase()}.png`;
}

export type FlagUrlBuilder = (iso2: string, width: number) => string;
