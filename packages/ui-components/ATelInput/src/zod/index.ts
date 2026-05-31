/**
 * Zod adapter for `@alikhalilll/a-tel-input`.
 *
 * Wraps the same `usePhoneValidation()` engine the component uses, so a Zod schema
 * never disagrees with the visual validation state in the field.
 *
 * Three usage shapes, all backed by libphonenumber-js:
 *
 * 1. **E.164 string** (default) — validate a full international number:
 *
 *    ```ts
 *    import { zPhone } from '@alikhalilll/a-tel-input/zod';
 *    const schema = z.object({ phone: zPhone() });
 *    schema.parse({ phone: '+201234567890' });
 *    ```
 *
 * 2. **National number for a fixed country** — when you already know the country (e.g.,
 *    a Saudi-only form) and only need to validate the digits the user typed:
 *
 *    ```ts
 *    const schema = z.object({ phone: zPhone({ country: 'SA' }) });
 *    ```
 *
 * 3. **Combined object** — matches ATelInput's two v-models out of the box:
 *
 *    ```ts
 *    import { zPhoneObject } from '@alikhalilll/a-tel-input/zod';
 *    const schema = z.object({
 *      contact: zPhoneObject(), // -> { phone: string, country: number | null }
 *    });
 *    ```
 *
 * All three honour `allowedDialCodes` and produce a `PhoneValidationReason` localised
 * through the same `DEFAULT_ERROR_MESSAGES` map as the component, so error wording is
 * consistent across UI + schema.
 *
 * `zod` is an **optional peer dependency** — install it yourself in your app.
 */

import { z } from 'zod';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import {
  usePhoneValidation,
  type PhoneValidationReason,
  type PhoneValidationResult,
} from '../composables/usePhoneValidation';
import { DEFAULT_ERROR_MESSAGES } from '../types';

export interface ZPhoneOptions {
  /**
   * ISO 3166-1 alpha-2 country code (`'EG'`, `'SA'`, …). When set, the input is treated
   * as a national number for that country. Leave undefined to validate a full E.164
   * string (the country is inferred from the leading `+` dial code).
   */
  country?: string;
  /**
   * Whitelist of allowed dial-digit codes (no `+`), e.g. `['20', '966']`. Numbers from
   * countries outside this list fail with `country_not_supported`. Matches the
   * `allowedDialCodes` prop on `ATelInput`.
   */
  allowedDialCodes?: string[];
  /**
   * BCP-47 locale, forwarded to the validator. Doesn't change the validity outcome —
   * only affects locale-dependent fields on the underlying validation result.
   */
  locale?: string;
  /**
   * Override the error messages used when the Zod issue is raised. Keyed by validation
   * reason. Falls back to the same English defaults the component uses.
   */
  messages?: Partial<Record<PhoneValidationReason, string>>;
  /**
   * Custom message for the "empty input" case. By default the schema accepts an empty
   * string — wrap with `z.string().min(1)` upstream if you want "required" semantics,
   * or pass a non-empty `requiredMessage` to enforce it here.
   */
  requiredMessage?: string;
}

function messageFor(reason: PhoneValidationReason, overrides?: ZPhoneOptions['messages']) {
  return overrides?.[reason] ?? DEFAULT_ERROR_MESSAGES[reason];
}

function failsAllowList(dialDigits: string, allowed?: string[]) {
  if (!allowed || allowed.length === 0) return false;
  return !allowed.includes(dialDigits);
}

/** Run the same validate() the component uses, but resolve country from an E.164 string. */
function validateE164(
  value: string,
  v: ReturnType<typeof usePhoneValidation>,
  locale?: string
): PhoneValidationResult {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    return {
      ok: false,
      reason: 'invalid_phone',
      country: null,
      phone: { raw: value, digits: '' },
      full_phone: null,
      required: null,
    };
  }
  // libphonenumber wants a leading `+` to skip the country-hint requirement.
  const e164 = trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
  const parsed = parsePhoneNumberFromString(e164);
  if (!parsed || !parsed.country) {
    return {
      ok: false,
      reason: 'parse_failed',
      country: null,
      phone: { raw: value, digits: '' },
      full_phone: null,
      required: null,
    };
  }
  return v.validate({
    country: { iso2: parsed.country },
    phone: parsed.nationalNumber,
    locale,
  });
}

/**
 * Zod schema for a phone string.
 *
 * @see {@link ZPhoneOptions} for behaviour modes.
 */
export function zPhone(options: ZPhoneOptions = {}): z.ZodType<string, z.ZodTypeDef, string> {
  // Lazy: only construct the validator on first parse, so apps that bundle this don't
  // pay the libphonenumber metadata load until they actually validate.
  let _v: ReturnType<typeof usePhoneValidation> | null = null;
  const getV = () => {
    if (!_v) {
      _v = usePhoneValidation();
      void _v.getCountries();
    }
    return _v;
  };

  return z.string().superRefine((value, ctx) => {
    const v = getV();
    const isEmpty = !value || !String(value).trim();

    if (isEmpty) {
      if (options.requiredMessage) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: options.requiredMessage });
      }
      return;
    }

    const result: PhoneValidationResult = options.country
      ? v.validate({ country: { iso2: options.country }, phone: value, locale: options.locale })
      : validateE164(value, v, options.locale);

    if (!result.ok) {
      const reason = result.reason ?? 'invalid_phone';
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: messageFor(reason, options.messages),
        params: { reason, validation: result },
      });
      return;
    }

    const dialDigits = result.country?.dial_code?.replace(/^\+/, '') ?? '';
    if (failsAllowList(dialDigits, options.allowedDialCodes)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: messageFor('country_not_supported', options.messages),
        params: { reason: 'country_not_supported' as PhoneValidationReason, validation: result },
      });
    }
  });
}

/**
 * Zod schema for the `{ phone, country }` object shape matching `ATelInput`'s two
 * v-models. `phone` is the digits-only national number; `country` is the dial-digit
 * **number** (e.g. `20` for Egypt). NANP (`+1`) maps to `'US'` for validation purposes,
 * which is correct for `isValidPhoneNumber` (all NANP countries share the same rule set).
 */
export function zPhoneObject(options: ZPhoneOptions = {}) {
  let _v: ReturnType<typeof usePhoneValidation> | null = null;
  const getV = () => {
    if (!_v) {
      _v = usePhoneValidation();
      void _v.getCountries();
    }
    return _v;
  };

  return z
    .object({
      phone: z.string(),
      country: z.number().nullable(),
    })
    .superRefine((input, ctx) => {
      const v = getV();
      const phone = (input.phone ?? '').trim();
      const country = input.country;

      if (!phone) {
        if (options.requiredMessage) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['phone'],
            message: options.requiredMessage,
          });
        }
        return;
      }

      if (country == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['country'],
          message: messageFor('missing_country', options.messages),
        });
        return;
      }

      const matches = v.getCountriesByDial(String(country));
      const iso2 = matches[0]?.value ?? options.country;
      if (!iso2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['country'],
          message: messageFor('country_not_supported', options.messages),
        });
        return;
      }

      const result = v.validate({ country: { iso2 }, phone, locale: options.locale });
      if (!result.ok) {
        const reason = result.reason ?? 'invalid_phone';
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['phone'],
          message: messageFor(reason, options.messages),
          params: { reason, validation: result },
        });
        return;
      }

      if (failsAllowList(String(country), options.allowedDialCodes)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['country'],
          message: messageFor('country_not_supported', options.messages),
        });
      }
    });
}

export { DEFAULT_ERROR_MESSAGES };
export type { PhoneValidationReason, PhoneValidationResult };
