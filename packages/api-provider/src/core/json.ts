/**
 * Parse a `Response` into JSON, with two safety nets:
 * - 204 / 205 status codes return `undefined` (no body to parse).
 * - If the body is not valid JSON, the raw text is returned instead.
 */
export async function safeParseJson<T>(response: Response): Promise<T | undefined> {
  if (response.status === 204 || response.status === 205) return undefined;
  try {
    const text = await response.text();
    if (!text) return undefined;
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  } catch {
    return undefined;
  }
}
