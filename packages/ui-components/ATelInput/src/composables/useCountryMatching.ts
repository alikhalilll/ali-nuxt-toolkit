import { getCountries, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import type { CountryOption } from './usePhoneValidation';

/** Cached snapshot of every country libphonenumber knows about (~250 ISO2 codes).
 *  Used by tier 2 of `matchLeadingDialCode` as the last-resort iteration so detection
 *  works for *every* country, not just the popular ones in the bundled fallback list.
 *  Cached at module load — `getCountries()` is a static metadata table, no I/O. */
const ALL_LIBPHONENUMBER_ISO2: readonly string[] = getCountries();

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

/** ISO2 codes iterated by tier 2 of `matchLeadingDialCode` when looking for a country
 *  that accepts a local-format input as valid. Mirrors the `FALLBACK_COUNTRIES` list in
 *  {@link usePhoneValidation} (kept in sync by tests + by being short and obvious).
 *  Order matters — earlier entries get priority when multiple countries would each
 *  validate the same input. Built around the most-populated / most-likely countries. */
export const FALLBACK_ISO2_LIST: readonly string[] = [
  'SA',
  'EG',
  'AE',
  'US',
  'GB',
  'DE',
  'FR',
  'ES',
  'IT',
  'TR',
  'RU',
  'CN',
  'IN',
  'JP',
  'KR',
  'BR',
  'MX',
  'CA',
  'AU',
  'NG',
  'PK',
  'ID',
];

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

/** Build a minimal `CountryOption` from libphonenumber metadata when the async REST
 *  Countries list hasn't loaded the entry yet. Used so country **detection** works
 *  generically for any libphonenumber country, not just the ~22 in the offline
 *  fallback list. The picker will overwrite this synthetic record with the real one
 *  (with localized name + flag) as soon as `getCountries()` resolves. */
function buildSyntheticCountry(iso2: string, dialDigits: string): CountryOption {
  const ISO2 = iso2.toUpperCase();
  const digits = String(dialDigits).replace(/\D/g, '');
  return {
    label: `${ISO2} (+${digits})`,
    value: ISO2,
    search_key: `${ISO2.toLowerCase()} +${digits} ${digits}`,
    raw_data: {
      iso2: ISO2,
      dial_code: `+${digits}`,
      dial_digits: digits,
      name: ISO2,
      flag: `https://flagcdn.com/w40/${ISO2.toLowerCase()}.png`,
      source: 'fallback',
      original: {},
    },
  };
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
 * `usePhoneValidation` country index. Split out of `ATelInput.vue` so the component
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

  // LRU cache of recent matcher results. Tier 2 iterates over ~250 countries in the
  // worst case (~25–250 ms of parsing); without this cache, every debounce settle on
  // an unmatched input would re-pay that cost. Keyed by the full input + context so
  // user picks / recents updates don't return stale matches. Capped to a small size —
  // typing typically reuses a few prefixes, no need for unbounded memory.
  const MATCHER_CACHE_MAX = 128;
  const matcherCache = new Map<string, DialMatch | null>();

  function readMatcherCache(key: string): DialMatch | null | undefined {
    if (!matcherCache.has(key)) return undefined;
    // Refresh LRU order by re-inserting.
    const value = matcherCache.get(key)!;
    matcherCache.delete(key);
    matcherCache.set(key, value);
    return value;
  }

  function writeMatcherCache(key: string, value: DialMatch | null) {
    if (matcherCache.size >= MATCHER_CACHE_MAX) {
      const oldest = matcherCache.keys().next().value;
      if (oldest !== undefined) matcherCache.delete(oldest);
    }
    matcherCache.set(key, value);
  }

  /** Three-tier match of the leading digits to a country:
   *   1. libphonenumber international parse (handles NANP disambiguation).
   *   2. libphonenumber national-format parse, iterating through candidate hint
   *      countries (handles local formats like Egyptian `01066105963` with no
   *      dial-code prefix). Universal coverage via `getCountries()`.
   *   3. Longest-prefix match against the dial-digits index, with the current
   *      selection / recents as tie-breakers when multiple countries share a code.
   *
   * Results are LRU-cached per input + context to avoid re-paying tier-2 iteration
   * cost when the user backspaces and retypes the same prefix. */
  function matchLeadingDialCode(
    digits: string,
    options: MatchLeadingDialCodeOptions = {}
  ): DialMatch | null {
    if (!digits) return null;
    const { hintCountry, currentIso2 } = options;

    const cacheKey = `${digits}|${hintCountry ?? ''}|${currentIso2 ?? ''}`;
    const cached = readMatcherCache(cacheKey);
    if (cached !== undefined) return cached;

    const result = runMatch(digits, hintCountry, currentIso2);
    writeMatcherCache(cacheKey, result);
    return result;
  }

  // Pure tier-1/2/3 matcher — extracted so the public `matchLeadingDialCode` is a thin
  // memoisation wrapper. Returns the first match found; `null` if none.
  function runMatch(
    digits: string,
    hintCountry: string | undefined,
    currentIso2: string | undefined
  ): DialMatch | null {
    // Tier 1: international parse with leading `+`. libphonenumber knows every
    // country's dial code natively — so even when our async country index hasn't
    // populated yet (first paint, no localStorage cache), we can still return a
    // synthetic `CountryOption` derived from the parse result and let the picker
    // upgrade it to the real entry when the fetch resolves.
    try {
      const parsed = parsePhoneNumberFromString(`+${digits}`);
      if (parsed?.country && parsed.countryCallingCode) {
        const parsedCountry =
          getCountryByValue(parsed.country) ??
          buildSyntheticCountry(parsed.country, String(parsed.countryCallingCode));
        return { country: parsedCountry, nationalNumber: String(parsed.nationalNumber ?? '') };
      }
    } catch {
      /* libphonenumber throws on partial input — fall through */
    }

    // Tier 2: national-format parse. Iterate through candidate hint countries — the env
    // hint, the current selection, the user's recents, the popular-countries shortlist,
    // and finally **every** ISO2 libphonenumber knows about — and return the first one
    // that yields a valid parse. This is what lets `01066105963` resolve to Egypt even
    // when the silent IP/timezone hint is `SA` (the SA parse rejects the number, but
    // iterating finds EG). First-match wins, so the iteration ORDER encodes the priority:
    //   1. Env hint (`hintCountry`).
    //   2. Current picker selection (`currentIso2`).
    //   3. The user's recents (most-recent first).
    //   4. The popular-countries shortlist (`FALLBACK_ISO2_LIST`).
    //   5. Every other libphonenumber country.
    // Step 5 guarantees universal coverage; the earlier steps bias to the more
    // contextually-likely answers when multiple countries would each accept the input.
    if (digits.length >= 4) {
      const candidates = new Set<string>();
      if (hintCountry) candidates.add(hintCountry.toUpperCase());
      if (currentIso2) candidates.add(currentIso2.toUpperCase());
      for (const recent of readRecents()) candidates.add(recent.toUpperCase());
      for (const fallback of FALLBACK_ISO2_LIST) candidates.add(fallback);
      for (const all of ALL_LIBPHONENUMBER_ISO2) candidates.add(all);

      for (const iso2 of candidates) {
        try {
          const parsed = parsePhoneNumberFromString(digits, iso2 as CountryCode);
          if (parsed?.isValid()) {
            const resolvedIso2 = parsed.country || iso2;
            const matched =
              getCountryByValue(resolvedIso2) ??
              buildSyntheticCountry(resolvedIso2, String(parsed.countryCallingCode ?? ''));
            return { country: matched, nationalNumber: String(parsed.nationalNumber ?? '') };
          }
        } catch {
          /* libphonenumber throws on partial input — try next candidate */
        }
      }
    }

    // Tier 3: longest-prefix match over the dial-digits index, with the synchronous
    // `DIAL_TO_ISO2_FALLBACK` table (~60 countries) as a backstop when the async
    // country index hasn't loaded yet. This keeps detection working from first paint
    // for every country in the table — not just the ~22 in `FALLBACK_COUNTRIES`.
    for (let len = Math.min(3, digits.length); len >= 1; len--) {
      const prefix = digits.slice(0, len);
      let group = getCountriesByDial(prefix);
      if (!group.length) {
        const iso2 = DIAL_TO_ISO2_FALLBACK[prefix];
        if (iso2) {
          group = [getCountryByValue(iso2) ?? buildSyntheticCountry(iso2, prefix)];
        }
      }
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
