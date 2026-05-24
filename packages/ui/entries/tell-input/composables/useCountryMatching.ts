import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import type { CountryOption } from './usePhoneValidation';

/** Synchronous dial-digit → ISO2 fallback for common countries, used when the async
 *  REST Countries fetch hasn't populated `getCountriesByDial`'s index yet at setup. */
export const DIAL_TO_ISO2_FALLBACK: Record<string, string> = {
  '1': 'US',
  '7': 'RU',
  '20': 'EG',
  '27': 'ZA',
  '30': 'GR',
  '31': 'NL',
  '32': 'BE',
  '33': 'FR',
  '34': 'ES',
  '39': 'IT',
  '44': 'GB',
  '46': 'SE',
  '47': 'NO',
  '48': 'PL',
  '49': 'DE',
  '52': 'MX',
  '54': 'AR',
  '55': 'BR',
  '60': 'MY',
  '61': 'AU',
  '62': 'ID',
  '63': 'PH',
  '64': 'NZ',
  '65': 'SG',
  '66': 'TH',
  '81': 'JP',
  '82': 'KR',
  '84': 'VN',
  '86': 'CN',
  '90': 'TR',
  '91': 'IN',
  '92': 'PK',
  '95': 'MM',
  '212': 'MA',
  '213': 'DZ',
  '216': 'TN',
  '218': 'LY',
  '234': 'NG',
  '254': 'KE',
  '352': 'LU',
  '353': 'IE',
  '358': 'FI',
  '359': 'BG',
  '380': 'UA',
  '420': 'CZ',
  '421': 'SK',
  '961': 'LB',
  '962': 'JO',
  '963': 'SY',
  '964': 'IQ',
  '965': 'KW',
  '966': 'SA',
  '967': 'YE',
  '968': 'OM',
  '970': 'PS',
  '971': 'AE',
  '972': 'IL',
  '973': 'BH',
  '974': 'QA',
};

/** localStorage key for the user's most recently picked countries. Used as a
 *  tie-breaker when multiple countries share a dial code (e.g. all NANP). */
export const COUNTRY_RECENTS_KEY = 'ali_ui_country_recents_v1';

export interface DialMatch {
  country: CountryOption;
  /** The national significant number — what the phone input should hold, with both the
   *  dial code and the national prefix (e.g. Egyptian leading `0`) stripped. */
  nationalNumber: string;
}

export interface MatchLeadingDialCodeOptions {
  /** ISO2 hint for libphonenumber's national-format parse (tier 2). Typically the
   *  IP/timezone/locale-resolved country. */
  hintCountry?: string;
  /** Currently selected ISO2 — preferred when a shared dial code yields multiple
   *  countries (tier 3 tie-break). */
  currentIso2?: string;
}

function readRecents(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(COUNTRY_RECENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export interface CountryMatchingDeps {
  /** Country lookup by ISO2 code — typically `usePhoneValidation().getCountryByValue`. */
  getCountryByValue: (value: string) => CountryOption | null;
  /** Country lookup by dial digits — typically `usePhoneValidation().getCountriesByDial`. */
  getCountriesByDial: (dial: string) => CountryOption[];
}

/**
 * Country-matching helpers used by the tel input — pure functions on top of the
 * `usePhoneValidation` country index. Split out of `ATellInput.vue` so the component
 * script stays focused on UI state and the matching logic is independently testable.
 *
 * **Important**: takes the validation lookups as dependencies rather than calling
 * `usePhoneValidation()` itself. `usePhoneValidation` creates a fresh state on every
 * call, so calling it here would produce a *second* empty country index that never gets
 * populated by the caller's `getCountries()` — the matcher would see no countries and
 * all tier-3 prefix lookups would fall through to the (much smaller) fallback table.
 */
export function useCountryMatching(deps: CountryMatchingDeps) {
  const { getCountryByValue, getCountriesByDial } = deps;

  /** Accept either an ISO2 code (`'EG'`) or a dial-digit string (`'20'`, `'+20'`).
   *  Returns the canonical ISO2 for downstream consumers, or `''` if it can't resolve. */
  function resolveCountryIdentifier(raw: string | undefined | null): string {
    const v = String(raw ?? '').trim();
    if (!v) return '';
    if (/^[A-Za-z]{2}$/.test(v)) return v.toUpperCase();
    const dial = v.replace(/^\+/, '');
    if (!/^\d+$/.test(dial)) return '';
    // Prefer the loaded country index (right answer when multiple share a dial); fall
    // back to the synchronous table when the async list hasn't arrived yet.
    const match = getCountriesByDial(dial)[0];
    if (match) return match.value;
    return DIAL_TO_ISO2_FALLBACK[dial] ?? '';
  }

  /** Compute the dial digits (as a number) for an ISO2 code. Falls back to the
   *  synchronous dial table if the async country list hasn't populated yet. */
  function dialNumberFor(iso2: string): number | null {
    if (!iso2) return null;
    const fromIndex = getCountryByValue(iso2)?.raw_data?.dial_digits;
    const digits =
      fromIndex ?? Object.entries(DIAL_TO_ISO2_FALLBACK).find(([, v]) => v === iso2)?.[0];
    if (!digits) return null;
    const n = Number(digits);
    return Number.isFinite(n) ? n : null;
  }

  /** Three-tier match of the leading digits to a country:
   *   1. libphonenumber international parse (handles NANP disambiguation).
   *   2. libphonenumber national-format parse using `hintCountry` (handles local
   *      formats like Egyptian `01066105963` with no dial-code prefix).
   *   3. Longest-prefix match against the dial-digits index, with the current
   *      selection / recents as tie-breakers when multiple countries share a code. */
  function matchLeadingDialCode(
    digits: string,
    options: MatchLeadingDialCodeOptions = {}
  ): DialMatch | null {
    if (!digits) return null;
    const { hintCountry, currentIso2 } = options;

    // Tier 1: international parse with leading `+`.
    try {
      const parsed = parsePhoneNumberFromString(`+${digits}`);
      if (parsed?.country && parsed.countryCallingCode) {
        const parsedCountry = getCountryByValue(parsed.country);
        if (parsedCountry) {
          return { country: parsedCountry, nationalNumber: String(parsed.nationalNumber ?? '') };
        }
      }
    } catch {
      /* libphonenumber throws on partial input — fall through */
    }

    // Tier 2: national-format parse using the silently-inferred country as a hint.
    if (hintCountry && digits.length >= 4) {
      try {
        const parsed = parsePhoneNumberFromString(digits, hintCountry as CountryCode);
        if (parsed?.isValid()) {
          const matched = getCountryByValue(parsed.country || hintCountry);
          if (matched) {
            return { country: matched, nationalNumber: String(parsed.nationalNumber ?? '') };
          }
        }
      } catch {
        /* fall through */
      }
    }

    // Tier 3: longest-prefix match over the dial-digits index.
    for (let len = Math.min(3, digits.length); len >= 1; len--) {
      const prefix = digits.slice(0, len);
      const group = getCountriesByDial(prefix);
      if (!group.length) continue;
      const nationalNumber = digits.slice(prefix.length);
      if (group.length === 1) return { country: group[0], nationalNumber };
      const current = currentIso2 ? group.find((c) => c.value === currentIso2.toUpperCase()) : null;
      if (current) return { country: current, nationalNumber };
      const recents = readRecents();
      const recentHit = recents
        .map((iso2) => group.find((c) => c.value === iso2))
        .find((c): c is CountryOption => Boolean(c));
      if (recentHit) return { country: recentHit, nationalNumber };
      return { country: group[0], nationalNumber };
    }
    return null;
  }

  return {
    resolveCountryIdentifier,
    dialNumberFor,
    matchLeadingDialCode,
  };
}
