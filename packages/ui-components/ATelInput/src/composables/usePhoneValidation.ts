/**
 * Country list + phone validation, framework-agnostic.
 *
 * Country data sources (in order):
 *  1. **Sync baseline (always on)** — built at first call from
 *     `libphonenumber-js.getCountries()` + `getCountryCallingCode()` for the
 *     ISO2 + dial-digits map, `Intl.DisplayNames` for localized names, and
 *     `flagcdn.com` for the flag URLs. No network, no auth, SSR-safe, ~250 entries.
 *  2. **Optional REST Countries v5 upgrade (opt-in)** — when an `apiKey` is
 *     configured, one `fetch()` per page to `api.restcountries.com/countries/v5`,
 *     cached to `localStorage` for 30 days, then reactively swapped in over the
 *     sync baseline. CORS requires the consumer to allowlist their origin on the
 *     REST Countries dashboard. Cache + in-flight Promise are deduped across every
 *     `<ATelInput>` / `<ACountrySelect>` / `useTelField()` / `zPhone()` instance.
 */

import { ref, type Ref } from 'vue';
import {
  type CountryCode,
  type Examples,
  getCountries as getLibphonenumberCountries,
  getCountryCallingCode,
  getExampleNumber,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from 'libphonenumber-js';
import examples from 'libphonenumber-js/examples.mobile.json';
import { normalizeDigits } from '../utils/digits';

/* -----------------------------------------------------------------------------
 * Public types
 * -------------------------------------------------------------------------- */
export interface CountryOption<T = unknown> {
  /** Display label, e.g. "Egypt (+20)". */
  label: string;
  /** Stable unique ID — the ISO 3166-1 alpha-2 code, e.g. "EG". */
  value: string;
  /** Precomputed normalized string for fast substring search. */
  search_key: string;
  raw_data: {
    iso2: string;
    dial_code: string;
    dial_digits: string;
    name: string;
    flag: string | null;
    source: 'libphonenumber' | 'restcountries-v5' | 'fallback';
    original: T;
  };
}

export interface PhoneRequiredInfo {
  iso2: string;
  dial_code: string;
  /** Empty by default — consumer passes a placeholder via the component prop. */
  placeholder: string;
  example_national: string;
  example_e164: string;
  national_number_length: { min: number | null; max: number | null };
  format_hint: string;
}

export type PhoneValidationReason =
  | 'missing_country'
  | 'country_not_supported'
  | 'phone_has_non_digits'
  | 'too_short'
  | 'too_long'
  | 'invalid_phone'
  | 'parse_failed';

export interface PhoneValidationResult {
  ok: boolean;
  reason: PhoneValidationReason | null;
  country: { iso2: string; dial_code: string } | null;
  phone: { raw: string | null; digits: string };
  full_phone: string | null;
  required: PhoneRequiredInfo | null;
  details?: Record<string, unknown>;
}

export type ValidateArgs =
  | {
      country: { iso2: string; dial_code?: string } | null | undefined;
      phone?: undefined;
      /** BCP-47 locale — localizes the numerals in the returned `required.format_hint`. */
      locale?: string;
    }
  | {
      country: { iso2: string; dial_code?: string } | null | undefined;
      phone: string | null;
      /** BCP-47 locale — localizes the numerals in the returned `required.format_hint`. */
      locale?: string;
    };

export interface UsePhoneValidationOptions {
  /**
   * Optional REST Countries v5 API key. When set, the composable fires one fetch
   * per browser to `https://api.restcountries.com/countries/v5` and caches the
   * normalized list to `localStorage` for 30 days. Without a key the list is
   * built synchronously from `libphonenumber-js` + `Intl.DisplayNames` — zero
   * network, zero auth.
   */
  apiKey?: string;
  /** Override the v5 base URL (rarely useful; defaults to the official endpoint). */
  restCountriesBaseUrl?: string;
}

const DEFAULT_V5_BASE_URL = 'https://api.restcountries.com/countries/v5';
const CACHE_KEY_V2 = 'ali_ui_phone_countries_v2';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

/* -----------------------------------------------------------------------------
 * One-shot cleanup of the v3.1 REST Countries cache shipped by 1.x. The shape
 * (entries with `source: 'restcountries'` and the old field set) no longer
 * matches the current type union; nothing reads the key anymore. Removing it
 * reclaims ~80 KB and prevents stale reads if a future cache-key collision
 * happens. Idempotent — runs once per page load.
 * -------------------------------------------------------------------------- */
if (typeof window !== 'undefined') {
  try {
    window.localStorage.removeItem('ali_ui_phone_countries_v1');
  } catch {
    /* private mode / quota — best effort */
  }
}

/* -----------------------------------------------------------------------------
 * Module-level singletons for the v5 upgrade. With one composable instance per
 * `<ATelInput>` / `<ACountrySelect>` / `useTelField()` / `zPhone()`, a single
 * page can spin up four or more simultaneous callers. These slots collapse the
 * fetch + normalize work to **one** network request per page lifetime.
 * -------------------------------------------------------------------------- */
let sharedV5: readonly CountryOption[] | null = null;
let inflightV5: Promise<readonly CountryOption[] | null> | null = null;

const EX = examples as unknown as Examples;

function toDigits(v: unknown) {
  // Fold alternative numeral systems (Arabic-Indic, Persian, Devanagari, Bengali) down to
  // ASCII first, so a number typed in the user's own script still validates.
  return normalizeDigits(String(v ?? '')).replace(/\D/g, '');
}

/**
 * Render an ASCII digit string in a locale's numeral system (e.g. `'ar'` → `٠-٩`).
 * Used only for display hints — falls back to ASCII if the locale is unknown.
 */
function localizeDigits(digits: string, locale?: string): string {
  if (!locale) return digits;
  try {
    const fmt = new Intl.NumberFormat(locale, { useGrouping: false });
    return digits.replace(/[0-9]/g, (d) => fmt.format(Number(d)));
  } catch {
    return digits;
  }
}

function ensurePlusDial(dial: unknown) {
  const d = toDigits(dial);
  return d ? `+${d}` : '';
}

function normalizeIso2(iso2: unknown) {
  return String(iso2 ?? '')
    .trim()
    .toUpperCase();
}

function dropLeadingZeros(digits: string) {
  return String(digits ?? '').replace(/^0+/, '');
}

function buildFullE164(dial: string, digits: string) {
  const dialClean = ensurePlusDial(dial);
  const nsn = dropLeadingZeros(toDigits(digits));
  return dialClean && nsn ? `${dialClean}${nsn}` : null;
}

function inferLengthFromExample(national: string) {
  const d = toDigits(national);
  if (!d) return { min: null, max: null };
  const n = d.length;
  return { min: Math.max(4, n - 2), max: n + 2 };
}

function normalizeSearchKey(input: string) {
  return (
    String(input ?? '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
      // Keep letters of every script (so localized names — Arabic, etc. — stay searchable),
      // digits, `+`, and spaces; drop punctuation/symbols.
      .replace(/[^\p{L}\p{N}+ ]/gu, '')
  );
}

/* -----------------------------------------------------------------------------
 * Sync baseline — built from libphonenumber-js + Intl.DisplayNames + flagcdn.
 * Per-locale memoized at module scope so the ~250-entry build runs at most once
 * per locale per page.
 * -------------------------------------------------------------------------- */
const localeCache = new Map<string, readonly CountryOption[]>();

function safeDisplayNames(locale: string): Intl.DisplayNames | null {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' });
  } catch {
    return null;
  }
}

function resolveLocalName(
  iso2: string,
  primary: Intl.DisplayNames | null,
  englishFallback: Intl.DisplayNames | null
): string {
  if (primary) {
    try {
      const v = primary.of(iso2);
      if (v && v.trim() && v !== iso2) return v.trim();
    } catch {
      /* unknown region — fall through */
    }
  }
  if (englishFallback) {
    try {
      const v = englishFallback.of(iso2);
      if (v && v.trim() && v !== iso2) return v.trim();
    } catch {
      /* unknown region — fall through */
    }
  }
  return iso2;
}

function buildLocalCountryList(locale?: string): readonly CountryOption[] {
  const primary = safeDisplayNames(locale ?? 'en');
  const englishFallback = locale && locale !== 'en' ? safeDisplayNames('en') : primary;
  const collator = (() => {
    try {
      return new Intl.Collator(locale ?? 'en');
    } catch {
      return new Intl.Collator('en');
    }
  })();

  const iso2s = getLibphonenumberCountries();
  const out: CountryOption[] = [];
  for (const iso2 of iso2s) {
    let digits: string;
    try {
      digits = getCountryCallingCode(iso2);
    } catch {
      continue;
    }
    if (!digits) continue;
    const name = resolveLocalName(iso2, primary, englishFallback);
    const dial = `+${digits}`;
    out.push({
      label: `${name} (${dial})`,
      value: iso2,
      search_key: normalizeSearchKey(`${name} ${dial} ${iso2} ${digits}`),
      raw_data: {
        iso2,
        dial_code: dial,
        dial_digits: digits,
        name,
        flag: `https://flagcdn.com/w40/${iso2.toLowerCase()}.png`,
        source: 'libphonenumber',
        original: null,
      },
    });
  }

  out.sort((a, b) => collator.compare(a.raw_data.name, b.raw_data.name));
  return Object.freeze(out);
}

function getLocalCountryListFor(locale?: string): readonly CountryOption[] {
  const key = locale ?? '__none__';
  let cached = localeCache.get(key);
  if (!cached) {
    cached = buildLocalCountryList(locale);
    localeCache.set(key, cached);
  }
  return cached;
}

/**
 * Return a copy of the country list with display names localized to `locale` via
 * `Intl.DisplayNames`. `search_key` is rebuilt (keeping the source name too) so
 * search still matches either spelling. Fast path: when the input list matches
 * the per-locale memo's unlocalized entry, return the cached localized array
 * verbatim — no per-item mapping.
 */
export function localizeCountries(list: CountryOption[], locale?: string): CountryOption[] {
  if (!locale) return list;
  const cachedUnlocalized = localeCache.get('__none__');
  if (cachedUnlocalized && list === cachedUnlocalized) {
    return [...getLocalCountryListFor(locale)];
  }
  const display = safeDisplayNames(locale);
  if (!display) return list;
  return list.map((c) => {
    let localized = c.raw_data.name;
    try {
      localized = display.of(c.raw_data.iso2) || c.raw_data.name;
    } catch {
      /* region not in CLDR data — keep source name */
    }
    if (localized === c.raw_data.name) return c;
    const dial = c.raw_data.dial_code;
    return {
      ...c,
      label: `${localized} (${dial})`,
      search_key: normalizeSearchKey(
        `${localized} ${c.raw_data.name} ${dial} ${c.raw_data.iso2} ${c.raw_data.dial_digits}`
      ),
      raw_data: { ...c.raw_data, name: localized },
    };
  });
}

/* -----------------------------------------------------------------------------
 * Optional REST Countries v5 fetch path. Activated only when `apiKey` is set.
 * Returns null (caller stays on the sync baseline) on any failure path — never
 * throws.
 *
 * v5 response shape (per /docs): `{ data: V5Country[] }`. Field allowlist:
 *   names.common, codes.alpha_2, calling_codes (array of bare-digit strings),
 *   flag.url_png, flag.url_svg.
 * -------------------------------------------------------------------------- */
interface V5Country {
  names?: { common?: string };
  codes?: { alpha_2?: string };
  calling_codes?: string[];
  flag?: { url_png?: string; url_svg?: string };
}

interface V5CachePayload {
  cachedAt: number;
  list: CountryOption[];
}

function readV5Cache(): readonly CountryOption[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY_V2);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as V5CachePayload;
    if (!parsed || !Array.isArray(parsed.list) || !parsed.list.length) return null;
    if (typeof parsed.cachedAt !== 'number') return null;
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null;
    return Object.freeze(parsed.list);
  } catch {
    return null;
  }
}

function writeV5Cache(list: readonly CountryOption[]) {
  if (typeof window === 'undefined') return;
  try {
    const payload: V5CachePayload = { cachedAt: Date.now(), list: [...list] };
    window.localStorage.setItem(CACHE_KEY_V2, JSON.stringify(payload));
  } catch {
    /* quota or storage disabled — fine, in-memory copy is still served */
  }
}

function normalizeV5(list: V5Country[]): readonly CountryOption[] {
  const out: CountryOption[] = [];
  for (const c of list) {
    const iso2 = normalizeIso2(c?.codes?.alpha_2);
    if (!iso2) continue;
    const digits = toDigits(c?.calling_codes?.[0]);
    if (!digits) continue;
    const dial = `+${digits}`;
    const sourceName = c?.names?.common?.trim() || iso2;
    const flag =
      c?.flag?.url_png?.trim() ||
      c?.flag?.url_svg?.trim() ||
      `https://flagcdn.com/w40/${iso2.toLowerCase()}.png`;
    out.push({
      label: `${sourceName} (${dial})`,
      value: iso2,
      search_key: normalizeSearchKey(`${sourceName} ${dial} ${iso2} ${digits}`),
      raw_data: {
        iso2,
        dial_code: dial,
        dial_digits: digits,
        name: sourceName,
        flag,
        source: 'restcountries-v5',
        original: c,
      },
    });
  }

  // Deduplicate on ISO2 — v5 should never emit duplicates, but be defensive.
  const dedup = new Map<string, CountryOption>();
  for (const item of out) {
    const prev = dedup.get(item.value);
    if (!prev) {
      dedup.set(item.value, item);
      continue;
    }
    const score = (x: CountryOption) => (x.raw_data.flag ? 1 : 0) + (x.raw_data.dial_code ? 1 : 0);
    if (score(item) > score(prev)) dedup.set(item.value, item);
  }
  return Object.freeze(
    Array.from(dedup.values()).sort((a, b) => a.raw_data.name.localeCompare(b.raw_data.name))
  );
}

async function fetchRestCountriesV5(
  apiKey: string,
  baseUrl: string
): Promise<readonly CountryOption[] | null> {
  const cached = readV5Cache();
  if (cached) return cached;

  const url = `${baseUrl}?response_fields=names.common,codes.alpha_2,calling_codes,flag.url_png,flag.url_svg&limit=500`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: V5Country[] };
    const data = Array.isArray(body?.data) ? body.data : [];
    if (!data.length) return null;
    const normalized = normalizeV5(data);
    if (!normalized.length) return null;
    writeV5Cache(normalized);
    return normalized;
  } catch {
    return null;
  }
}

/* -----------------------------------------------------------------------------
 * Composable
 * -------------------------------------------------------------------------- */
export interface UsePhoneValidationReturn {
  countries: Ref<CountryOption[]>;
  isCountriesLoading: Ref<boolean>;
  getCountries(options?: { force?: boolean }): Promise<CountryOption[]>;
  searchCountries(keyword: string, limit?: number): CountryOption[];
  getCountryByValue(value: string): CountryOption | null;
  getCountriesByDial(dial: string): CountryOption[];
  getRequiredInfo(
    country: { iso2: string; dial_code?: string },
    locale?: string
  ): PhoneRequiredInfo | null;
  validate(input: ValidateArgs): PhoneValidationResult;
}

export function usePhoneValidation(
  options: UsePhoneValidationOptions = {}
): UsePhoneValidationReturn {
  const apiKey = options.apiKey?.trim() || '';
  const baseUrl = options.restCountriesBaseUrl?.trim() || DEFAULT_V5_BASE_URL;

  // Sync baseline seeds the reactive state at setup — instant first paint, ~250
  // entries. The v5 upgrade (when enabled) replaces this list once it resolves.
  const seedList = getLocalCountryListFor(undefined);
  const countries = ref<CountryOption[]>([...seedList]);
  const isCountriesLoading = ref(false);

  function buildIndexes(list: readonly CountryOption[]) {
    const valueMap = new Map<string, CountryOption>();
    const dialMap = new Map<string, CountryOption[]>();
    for (const item of list) {
      valueMap.set(item.value, item);
      const dial = item.raw_data.dial_digits;
      if (dial) {
        const bucket = dialMap.get(dial) ?? [];
        bucket.push(item);
        dialMap.set(dial, bucket);
      }
    }
    return { valueMap, dialMap };
  }

  const _seed = buildIndexes(seedList);
  const byValue = ref<Map<string, CountryOption>>(_seed.valueMap);
  const byDialDigits = ref<Map<string, CountryOption[]>>(_seed.dialMap);

  function rebuildIndexes(list: readonly CountryOption[]) {
    const { valueMap, dialMap } = buildIndexes(list);
    byValue.value = valueMap;
    byDialDigits.value = dialMap;
  }

  function upsertCountries(list: readonly CountryOption[]) {
    countries.value = [...list];
    rebuildIndexes(list);
  }

  async function getCountries(options?: { force?: boolean }) {
    const force = Boolean(options?.force);

    // Sync baseline — instant, no I/O. Always served. The `force` flag rebuilds
    // the per-locale memo to honor an explicit refresh request.
    if (force) localeCache.clear();
    upsertCountries(getLocalCountryListFor(undefined));

    if (!apiKey) return countries.value;

    // v5 upgrade path. Already resolved on this page → adopt it directly.
    if (!force && sharedV5) {
      upsertCountries(sharedV5);
      return countries.value;
    }

    if (force && typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(CACHE_KEY_V2);
      } catch {
        /* quota / private mode */
      }
      sharedV5 = null;
      inflightV5 = null;
    }

    // Share one in-flight request across every sibling composable instance.
    if (!inflightV5) inflightV5 = fetchRestCountriesV5(apiKey, baseUrl);

    isCountriesLoading.value = true;
    try {
      const v5 = await inflightV5;
      if (v5 && v5.length) {
        sharedV5 = v5;
        upsertCountries(v5);
      }
    } finally {
      isCountriesLoading.value = false;
    }
    return countries.value;
  }

  function searchCountries(keyword: string, limit = 50) {
    const q = normalizeSearchKey(keyword);
    if (!q) return countries.value.slice(0, limit);
    const res: CountryOption[] = [];
    for (const item of countries.value) {
      if (item.search_key.includes(q)) {
        res.push(item);
        if (res.length >= limit) break;
      }
    }
    return res;
  }

  function getCountryByValue(value: string) {
    return byValue.value.get(normalizeIso2(value)) ?? null;
  }

  function getCountriesByDial(dial: string) {
    return byDialDigits.value.get(toDigits(dial)) ?? [];
  }

  function getRequiredInfo(
    country: { iso2: string; dial_code?: string },
    locale?: string
  ): PhoneRequiredInfo | null {
    const iso2 = normalizeIso2(country.iso2);
    if (!iso2) return null;
    try {
      const example = getExampleNumber(iso2 as CountryCode, EX);
      const exampleNational = example?.formatNational?.() ?? '';
      const exampleE164 = example?.format?.('E.164') ?? '';
      const inferred = inferLengthFromExample(exampleNational);
      const dial_code = country.dial_code
        ? ensurePlusDial(country.dial_code)
        : exampleE164
          ? `+${example?.countryCallingCode}`
          : '';
      const digitsExample = toDigits(exampleNational);
      return {
        iso2,
        dial_code,
        placeholder: '',
        example_national: exampleNational,
        example_e164: exampleE164,
        national_number_length: inferred,
        format_hint: digitsExample ? `e.g. ${localizeDigits(digitsExample, locale)}` : '',
      };
    } catch {
      return null;
    }
  }

  function validate(input: ValidateArgs): PhoneValidationResult {
    const country = input.country ?? null;
    if (!country?.iso2) {
      return {
        ok: false,
        reason: 'missing_country',
        country: null,
        phone: { raw: ('phone' in input ? input.phone : null) ?? null, digits: '' },
        full_phone: null,
        required: null,
      };
    }

    const iso2 = normalizeIso2(country.iso2);
    const required = getRequiredInfo({ iso2, dial_code: country.dial_code }, input.locale);
    if (!required) {
      return {
        ok: false,
        reason: 'country_not_supported',
        country: { iso2, dial_code: ensurePlusDial(country.dial_code) },
        phone: { raw: ('phone' in input ? input.phone : null) ?? null, digits: '' },
        full_phone: null,
        required: null,
      };
    }

    if (!('phone' in input)) {
      return {
        ok: true,
        reason: null,
        country: { iso2: required.iso2, dial_code: required.dial_code },
        phone: { raw: null, digits: '' },
        full_phone: null,
        required,
      };
    }

    const raw = input.phone;
    const digits = toDigits(raw);

    if (!raw || !String(raw).trim()) {
      return {
        ok: true,
        reason: null,
        country: { iso2: required.iso2, dial_code: required.dial_code },
        phone: { raw: raw ?? null, digits: '' },
        full_phone: null,
        required,
      };
    }

    if (
      String(raw)
        .replace(/\s+/g, '')
        .match(/[^\d+]/)
    ) {
      return {
        ok: false,
        reason: 'phone_has_non_digits',
        country: { iso2: required.iso2, dial_code: required.dial_code },
        phone: { raw, digits },
        full_phone: buildFullE164(required.dial_code, digits),
        required,
      };
    }

    const nsn = dropLeadingZeros(digits);
    const { min, max } = required.national_number_length;

    if (min !== null && nsn.length < min) {
      return {
        ok: false,
        reason: 'too_short',
        country: { iso2: required.iso2, dial_code: required.dial_code },
        phone: { raw, digits },
        full_phone: buildFullE164(required.dial_code, digits),
        required,
        details: { min, actual: nsn.length },
      };
    }

    if (max !== null && nsn.length > max) {
      return {
        ok: false,
        reason: 'too_long',
        country: { iso2: required.iso2, dial_code: required.dial_code },
        phone: { raw, digits },
        full_phone: buildFullE164(required.dial_code, digits),
        required,
        details: { max, actual: nsn.length },
      };
    }

    const full = buildFullE164(required.dial_code, digits) ?? String(raw);

    try {
      const ok = isValidPhoneNumber(full, iso2 as CountryCode);
      if (!ok) {
        const parsed = parsePhoneNumberFromString(full, iso2 as CountryCode);
        return {
          ok: false,
          reason: 'invalid_phone',
          country: { iso2: required.iso2, dial_code: required.dial_code },
          phone: { raw, digits },
          full_phone: parsed?.number ?? null,
          required,
          details: {
            type: parsed?.getType?.() ?? null,
            possible: parsed?.isPossible?.() ?? null,
            country: parsed?.country ?? null,
          },
        };
      }
      const parsed = parsePhoneNumberFromString(full, iso2 as CountryCode);
      return {
        ok: true,
        reason: null,
        country: { iso2: required.iso2, dial_code: required.dial_code },
        phone: { raw, digits },
        full_phone: parsed?.number ?? full,
        required,
      };
    } catch (e) {
      return {
        ok: false,
        reason: 'parse_failed',
        country: { iso2: required.iso2, dial_code: required.dial_code },
        phone: { raw, digits },
        full_phone: buildFullE164(required.dial_code, digits),
        required,
        details: { error: (e as Error)?.message ?? String(e) },
      };
    }
  }

  return {
    countries,
    isCountriesLoading,
    getCountries,
    searchCountries,
    getCountryByValue,
    getCountriesByDial,
    getRequiredInfo,
    validate,
  };
}
