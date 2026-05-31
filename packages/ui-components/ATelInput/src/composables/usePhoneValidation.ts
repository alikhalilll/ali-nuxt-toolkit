/**
 * Country list + phone validation, framework-agnostic.
 *
 * Ported from the reference @pkgs/ui ATelInput composable with these cleanups:
 *  - Drop Nuxt-only `process.client` checks → use plain `typeof window !== 'undefined'`.
 *  - Drop Arabic default placeholder; let consumers pass their own.
 *  - Expand the offline fallback list from 2 → ~20 of the most-populated countries.
 *  - Keep REST Countries fetch + localStorage cache + libphonenumber-js examples + fast `search_key`.
 */

import { ref, type Ref } from 'vue';
import {
  type CountryCode,
  type Examples,
  getExampleNumber,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from 'libphonenumber-js';
import examples from 'libphonenumber-js/examples.mobile.json';
import { normalizeDigits } from '../utils/digits';

/* -----------------------------------------------------------------------------
 * Public types
 * -------------------------------------------------------------------------- */
export interface RestCountry {
  name?: { common?: string };
  cca2?: string;
  idd?: { root?: string; suffixes?: string[] };
  flags?: { png?: string; svg?: string };
}

export interface CountryOption<T = RestCountry> {
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
    source: 'restcountries' | 'fallback';
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

const STORAGE_KEY = 'ali_ui_phone_countries_v1';
const REST_COUNTRIES_URL = 'https://restcountries.com/v3.1/all?fields=name,cca2,idd,flags';

/* -----------------------------------------------------------------------------
 * Module-level singleton state for country data.
 *
 * `usePhoneValidation()` is called once per `<ATelInput>`, once per `<ACountrySelect>`,
 * once per `useTelField()`, once per `zPhone()` — so a single page can spin up four
 * or more instances. Without deduplication, each instance would independently:
 *   - JSON.parse the localStorage cache,
 *   - fire the REST Countries fetch (~80KB),
 *   - parse + normalise the response.
 *
 * Sharing the result via these module-level slots collapses every concurrent call
 * to **one** network request and **one** cache parse for the lifetime of the page.
 * Each `usePhoneValidation()` instance still gets its own reactive `countries` ref,
 * so consumers can mutate their local view (e.g., `props.countries` override) without
 * affecting siblings — the singleton is only consulted as a data source.
 * -------------------------------------------------------------------------- */
let sharedCountries: CountryOption[] | null = null;
let inflightFetch: Promise<CountryOption[]> | null = null;

const EX = examples as unknown as Examples;

const isBrowser = () => typeof window !== 'undefined';

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

function buildDialCode(idd?: RestCountry['idd']): string | null {
  const root = idd?.root?.trim();
  if (!root || !root.startsWith('+')) return null;
  const suffix = idd?.suffixes?.[0]?.trim() ?? '';
  const out = `${root}${suffix}`;
  return out.startsWith('+') ? out : null;
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

/**
 * Return a copy of the country list with display names localized to `locale` via
 * `Intl.DisplayNames`. `search_key` is rebuilt (keeping the English name too) so search
 * still matches either spelling. Unknown locales / regions fall back to the English name.
 */
export function localizeCountries(list: CountryOption[], locale?: string): CountryOption[] {
  if (!locale) return list;
  let display: Intl.DisplayNames;
  try {
    display = new Intl.DisplayNames([locale], { type: 'region' });
  } catch {
    return list;
  }
  return list.map((c) => {
    let localized = c.raw_data.name;
    try {
      localized = display.of(c.raw_data.iso2) || c.raw_data.name;
    } catch {
      /* region not in CLDR data — keep English name */
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
 * Offline fallback — used when the REST Countries fetch fails. ~20 most-populated
 * countries so the picker is still useful when offline.
 * -------------------------------------------------------------------------- */
function makeFallback(iso2: string, name: string, dial: string): CountryOption {
  const dialDigits = toDigits(dial);
  return {
    label: `${name} (+${dialDigits})`,
    value: iso2,
    search_key: normalizeSearchKey(`${name} +${dialDigits} ${iso2}`),
    raw_data: {
      iso2,
      dial_code: `+${dialDigits}`,
      dial_digits: dialDigits,
      name,
      flag: `https://flagcdn.com/w40/${iso2.toLowerCase()}.png`,
      source: 'fallback',
      original: {},
    },
  };
}

const FALLBACK_COUNTRIES: CountryOption[] = [
  makeFallback('SA', 'Saudi Arabia', '+966'),
  makeFallback('EG', 'Egypt', '+20'),
  makeFallback('AE', 'United Arab Emirates', '+971'),
  makeFallback('US', 'United States', '+1'),
  makeFallback('GB', 'United Kingdom', '+44'),
  makeFallback('DE', 'Germany', '+49'),
  makeFallback('FR', 'France', '+33'),
  makeFallback('ES', 'Spain', '+34'),
  makeFallback('IT', 'Italy', '+39'),
  makeFallback('TR', 'Turkey', '+90'),
  makeFallback('RU', 'Russia', '+7'),
  makeFallback('CN', 'China', '+86'),
  makeFallback('IN', 'India', '+91'),
  makeFallback('JP', 'Japan', '+81'),
  makeFallback('KR', 'South Korea', '+82'),
  makeFallback('BR', 'Brazil', '+55'),
  makeFallback('MX', 'Mexico', '+52'),
  makeFallback('CA', 'Canada', '+1'),
  makeFallback('AU', 'Australia', '+61'),
  makeFallback('NG', 'Nigeria', '+234'),
  makeFallback('PK', 'Pakistan', '+92'),
  makeFallback('ID', 'Indonesia', '+62'),
];

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

export function usePhoneValidation(): UsePhoneValidationReturn {
  const countries = ref<CountryOption[]>([]);
  const isCountriesLoading = ref(false);

  // Pre-seed the lookup indexes with the bundled fallback (~22 most-populated countries).
  // This makes country *detection* (matchLeadingDialCode, getCountryByValue) work
  // synchronously from first paint — without it, typing a +20/+1/+44 etc. number while
  // the REST Countries fetch is in flight would silently fail every matcher tier because
  // `parsePhoneNumberFromString('+201066105963').country = 'EG'` can't resolve to a
  // `CountryOption` (empty index → null) and tier 3's `getCountriesByDial('20')` also
  // returns []. `countries.value` stays `[]` so `getCountries()` still runs its
  // localStorage → network upgrade path; once that resolves the indexes are rebuilt
  // wholesale with the full ~250-entry list.
  function buildIndexes(list: CountryOption[]) {
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

  const _seed = buildIndexes(FALLBACK_COUNTRIES);
  const byValue = ref<Map<string, CountryOption>>(_seed.valueMap);
  const byDialDigits = ref<Map<string, CountryOption[]>>(_seed.dialMap);

  function rebuildIndexes(list: CountryOption[]) {
    const { valueMap, dialMap } = buildIndexes(list);
    byValue.value = valueMap;
    byDialDigits.value = dialMap;
  }

  function upsertCountries(list: CountryOption[]) {
    countries.value = list;
    rebuildIndexes(list);
  }

  function normalizeRestCountries(list: RestCountry[]): CountryOption[] {
    const out: CountryOption[] = [];
    for (const c of list) {
      const name = c?.name?.common?.trim();
      const iso2 = normalizeIso2(c?.cca2);
      const dial = buildDialCode(c?.idd);
      const flag = c?.flags?.png?.trim() || c?.flags?.svg?.trim() || null;
      if (!name || !iso2 || !dial) continue;
      const dialDigits = toDigits(dial);
      const search_key = normalizeSearchKey(`${name} ${dial} ${iso2} ${dialDigits}`);
      out.push({
        label: `${name} (${dial})`,
        value: iso2,
        search_key,
        raw_data: {
          iso2,
          dial_code: dial,
          dial_digits: dialDigits,
          name,
          flag,
          source: 'restcountries',
          original: c,
        },
      });
    }

    const map = new Map<string, CountryOption>();
    for (const item of out) {
      const prev = map.get(item.value);
      if (!prev) {
        map.set(item.value, item);
        continue;
      }
      const prevScore = (prev.raw_data.flag ? 1 : 0) + (prev.raw_data.dial_code ? 1 : 0);
      const nextScore = (item.raw_data.flag ? 1 : 0) + (item.raw_data.dial_code ? 1 : 0);
      if (nextScore > prevScore) map.set(item.value, item);
    }
    return Array.from(map.values()).sort((a, b) => a.raw_data.name.localeCompare(b.raw_data.name));
  }

  async function getCountries(options?: { force?: boolean }) {
    const force = Boolean(options?.force);
    if (!force && countries.value.length) return countries.value;

    // Shared module-level cache — if any sibling instance already loaded the list,
    // adopt it without re-parsing localStorage or hitting the network.
    if (!force && sharedCountries) {
      upsertCountries(sharedCountries);
      return countries.value;
    }

    // Shared in-flight promise — if another instance fired the fetch first, await
    // its result instead of starting a duplicate request.
    if (!force && inflightFetch) {
      isCountriesLoading.value = true;
      try {
        const list = await inflightFetch;
        upsertCountries(list);
        return countries.value;
      } finally {
        isCountriesLoading.value = false;
      }
    }

    if (!force && isBrowser()) {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as CountryOption[];
          if (Array.isArray(parsed) && parsed.length) {
            sharedCountries = parsed;
            upsertCountries(parsed);
            return countries.value;
          }
        }
      } catch {
        /* ignore parse errors */
      }
    }

    isCountriesLoading.value = true;
    inflightFetch = (async (): Promise<CountryOption[]> => {
      try {
        const res = await fetch(REST_COUNTRIES_URL);
        if (!res.ok) throw new Error(`Failed to fetch countries: ${res.status}`);
        const data = (await res.json()) as RestCountry[];
        const normalized = normalizeRestCountries(data);
        const list = normalized.length ? normalized : FALLBACK_COUNTRIES;
        if (isBrowser()) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
          } catch {
            /* storage full or disabled */
          }
        }
        return list;
      } catch {
        return FALLBACK_COUNTRIES;
      }
    })();

    try {
      const list = await inflightFetch;
      sharedCountries = list;
      upsertCountries(list);
      return countries.value;
    } finally {
      isCountriesLoading.value = false;
    }
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
