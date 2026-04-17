/**
 * Join an endpoint to a base URL.
 *
 * - Absolute URLs (`http://...`, `https://...`) are returned as-is.
 * - If both sides have a leading/trailing slash, duplicates are collapsed.
 */
export function joinUrl(endpoint: string, baseURL: string): string {
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  if (!baseURL) return endpoint;
  if (endpoint.startsWith('/') && baseURL.endsWith('/')) return baseURL + endpoint.slice(1);
  if (!endpoint.startsWith('/') && !baseURL.endsWith('/')) return `${baseURL}/${endpoint}`;
  return baseURL + endpoint;
}
