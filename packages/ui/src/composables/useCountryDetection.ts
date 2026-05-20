/**
 * Best-effort country detection chain: IP geolocation → timezone → navigator.language → fallback.
 * Every step is independent and degrades gracefully; the final fallback is always returned.
 *
 * The composable returns reactive state so consumers can swap in the detected ISO2 the moment it
 * resolves, while still rendering an input immediately on mount.
 */

import { onMounted, ref, type Ref } from 'vue';

export type DetectionStrategy = 'auto' | 'locale' | 'none';

export interface DetectCountryOptions {
  /**
   * - `'auto'` — try IP geolocation first, then timezone, then `navigator.language`, then default.
   * - `'locale'` — skip the network call, use timezone + locale only.
   * - `'none'` — return `defaultCountry` immediately.
   */
  strategy?: DetectionStrategy;
  /** Endpoint returning a JSON body with a `country_code` (or `country`) field. */
  ipEndpoint?: string;
  /** Fallback ISO2 used when every step fails. */
  defaultCountry?: string;
  /** Abort the IP request after this many ms. */
  timeoutMs?: number;
  /** Persist the resolved country in sessionStorage so re-mounts within the session skip detection. */
  cache?: boolean;
}

const SESSION_CACHE_KEY = 'ali_ui_country_detected';

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

/** Hand-rolled IANA timezone → ISO2 map. Covers the most-populated zones; falls through on miss. */
const TIMEZONE_TO_ISO2: Record<string, string> = {
  // Africa
  'Africa/Cairo': 'EG',
  'Africa/Johannesburg': 'ZA',
  'Africa/Lagos': 'NG',
  'Africa/Casablanca': 'MA',
  'Africa/Algiers': 'DZ',
  'Africa/Nairobi': 'KE',
  'Africa/Accra': 'GH',
  'Africa/Tunis': 'TN',
  // Americas
  'America/Argentina/Buenos_Aires': 'AR',
  'America/Bogota': 'CO',
  'America/Caracas': 'VE',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Halifax': 'CA',
  'America/Lima': 'PE',
  'America/Los_Angeles': 'US',
  'America/Mexico_City': 'MX',
  'America/New_York': 'US',
  'America/Phoenix': 'US',
  'America/Sao_Paulo': 'BR',
  'America/Santiago': 'CL',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  // Asia
  'Asia/Baghdad': 'IQ',
  'Asia/Bahrain': 'BH',
  'Asia/Bangkok': 'TH',
  'Asia/Beirut': 'LB',
  'Asia/Damascus': 'SY',
  'Asia/Dhaka': 'BD',
  'Asia/Dubai': 'AE',
  'Asia/Hong_Kong': 'HK',
  'Asia/Jakarta': 'ID',
  'Asia/Jerusalem': 'IL',
  'Asia/Karachi': 'PK',
  'Asia/Kolkata': 'IN',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Kuwait': 'KW',
  'Asia/Manila': 'PH',
  'Asia/Muscat': 'OM',
  'Asia/Qatar': 'QA',
  'Asia/Riyadh': 'SA',
  'Asia/Seoul': 'KR',
  'Asia/Shanghai': 'CN',
  'Asia/Singapore': 'SG',
  'Asia/Taipei': 'TW',
  'Asia/Tehran': 'IR',
  'Asia/Tokyo': 'JP',
  'Asia/Yangon': 'MM',
  // Europe
  'Europe/Amsterdam': 'NL',
  'Europe/Athens': 'GR',
  'Europe/Belgrade': 'RS',
  'Europe/Berlin': 'DE',
  'Europe/Brussels': 'BE',
  'Europe/Bucharest': 'RO',
  'Europe/Budapest': 'HU',
  'Europe/Copenhagen': 'DK',
  'Europe/Dublin': 'IE',
  'Europe/Helsinki': 'FI',
  'Europe/Istanbul': 'TR',
  'Europe/Kyiv': 'UA',
  'Europe/Lisbon': 'PT',
  'Europe/London': 'GB',
  'Europe/Madrid': 'ES',
  'Europe/Moscow': 'RU',
  'Europe/Oslo': 'NO',
  'Europe/Paris': 'FR',
  'Europe/Prague': 'CZ',
  'Europe/Rome': 'IT',
  'Europe/Sofia': 'BG',
  'Europe/Stockholm': 'SE',
  'Europe/Vienna': 'AT',
  'Europe/Warsaw': 'PL',
  'Europe/Zurich': 'CH',
  // Oceania
  'Australia/Brisbane': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Perth': 'AU',
  'Australia/Sydney': 'AU',
  'Pacific/Auckland': 'NZ',
  'Pacific/Honolulu': 'US',
};

function tryTimezone(): string | null {
  if (!isBrowser()) return null;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONE_TO_ISO2[tz] ?? null;
  } catch {
    return null;
  }
}

function tryLocale(): string | null {
  if (!isBrowser()) return null;
  try {
    const lang = navigator.language ?? '';
    const m = lang.match(/^[a-z]{2,3}-([A-Z]{2})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

async function tryIp(endpoint: string, timeoutMs: number): Promise<string | null> {
  if (!isBrowser() || typeof fetch !== 'function') return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(endpoint, { signal: controller.signal, credentials: 'omit' });
    if (!res.ok) return null;
    const data = (await res.json()) as { country_code?: string; country?: string };
    const code = (data.country_code ?? data.country ?? '').toString().toUpperCase();
    return /^[A-Z]{2}$/.test(code) ? code : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function readCache(): string | null {
  if (!isBrowser()) return null;
  try {
    const v = sessionStorage.getItem(SESSION_CACHE_KEY);
    return v && /^[A-Z]{2}$/.test(v) ? v : null;
  } catch {
    return null;
  }
}

function writeCache(iso2: string) {
  if (!isBrowser()) return;
  try {
    sessionStorage.setItem(SESSION_CACHE_KEY, iso2);
  } catch {
    /* quota or storage disabled — silently ignore */
  }
}

/**
 * Imperative API. Use this when you want to call detection from outside Vue (e.g. inside a
 * non-component composable, server middleware, or unit test).
 */
export async function detectCountry(opts: DetectCountryOptions = {}): Promise<string> {
  const {
    strategy = 'auto',
    ipEndpoint = 'https://ipapi.co/json/',
    defaultCountry = 'US',
    timeoutMs = 2000,
    cache = true,
  } = opts;

  if (cache) {
    const cached = readCache();
    if (cached) return cached;
  }

  if (strategy === 'none') {
    return defaultCountry.toUpperCase();
  }

  if (strategy === 'auto') {
    const ipResult = await tryIp(ipEndpoint, timeoutMs);
    if (ipResult) {
      if (cache) writeCache(ipResult);
      return ipResult;
    }
  }

  const localResult = tryTimezone() ?? tryLocale();
  const final = (localResult ?? defaultCountry).toUpperCase();
  if (cache) writeCache(final);
  return final;
}

export interface UseCountryDetectionReturn {
  /** Resolved ISO2 code. Initially `null` until detection completes. */
  country: Ref<string | null>;
  /** True while detection is in flight. */
  isLoading: Ref<boolean>;
  /** Manually re-run detection (e.g. after the user changes their VPN). */
  refresh: () => Promise<string>;
}

/**
 * Reactive wrapper. Kicks off detection in `onMounted` so SSR renders an empty value and the
 * client patches in the real country once resolved.
 */
export function useCountryDetection(opts: DetectCountryOptions = {}): UseCountryDetectionReturn {
  const country = ref<string | null>(null);
  const isLoading = ref(false);

  async function run() {
    isLoading.value = true;
    try {
      country.value = await detectCountry(opts);
    } finally {
      isLoading.value = false;
    }
    return country.value!;
  }

  onMounted(() => {
    void run();
  });

  return { country, isLoading, refresh: run };
}
