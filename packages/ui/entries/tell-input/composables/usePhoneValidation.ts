/**
 * Country list + phone validation, framework-agnostic.
 *
 * Ported from the reference @pkgs/ui ATellInput composable with these cleanups:
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
  | { country: { iso2: string; dial_code?: string } | null | undefined; phone?: undefined }
  | { country: { iso2: string; dial_code?: string } | null | undefined; phone: string | null };

const STORAGE_KEY = 'ali_ui_phone_countries_v1';
const REST_COUNTRIES_URL = 'https://restcountries.com/v3.1/all?fields=name,cca2,idd,flags';

const EX = examples as unknown as Examples;

const isBrowser = () => typeof window !== 'undefined';

function toDigits(v: unknown) {
  return String(v ?? '').replace(/\D/g, '');
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
  return String(input ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[^\da-z+ ]/g, '');
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
  getRequiredInfo(country: { iso2: string; dial_code?: string }): PhoneRequiredInfo | null;
  validate(input: ValidateArgs): PhoneValidationResult;
}

export function usePhoneValidation(): UsePhoneValidationReturn {
  const countries = ref<CountryOption[]>([]);
  const isCountriesLoading = ref(false);

  const byValue = ref<Map<string, CountryOption>>(new Map());
  const byDialDigits = ref<Map<string, CountryOption[]>>(new Map());

  function rebuildIndexes(list: CountryOption[]) {
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

    if (!force && isBrowser()) {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as CountryOption[];
          if (Array.isArray(parsed) && parsed.length) {
            upsertCountries(parsed);
            return countries.value;
          }
        }
      } catch {
        /* ignore parse errors */
      }
    }

    isCountriesLoading.value = true;
    try {
      const res = await fetch(REST_COUNTRIES_URL);
      if (!res.ok) throw new Error(`Failed to fetch countries: ${res.status}`);
      const data = (await res.json()) as RestCountry[];
      const normalized = normalizeRestCountries(data);
      upsertCountries(normalized.length ? normalized : FALLBACK_COUNTRIES);
      if (isBrowser()) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(countries.value));
        } catch {
          /* storage full or disabled */
        }
      }
      return countries.value;
    } catch {
      upsertCountries(FALLBACK_COUNTRIES);
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

  function getRequiredInfo(country: {
    iso2: string;
    dial_code?: string;
  }): PhoneRequiredInfo | null {
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
        format_hint: digitsExample ? `e.g. ${digitsExample}` : '',
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
    const required = getRequiredInfo({ iso2, dial_code: country.dial_code });
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
