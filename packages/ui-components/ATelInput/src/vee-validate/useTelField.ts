/**
 * VeeValidate adapter for `@alikhalilll/a-tel-input`.
 *
 * `useTelField()` owns the two v-models (`phone` + `country`) and the canonical
 * E.164 string used by VeeValidate / Zod / yup, and returns a single ready-to-bind
 * object so a consumer doesn't have to glue the pieces together.
 *
 * Quick start:
 *
 * ```ts
 * import { useTelField } from '@alikhalilll/a-tel-input/vee-validate';
 * import { toTypedSchema } from '@vee-validate/zod';
 * import { z } from 'zod';
 * import { zPhone } from '@alikhalilll/a-tel-input/zod';
 *
 * const { phone, country, error, handleBlur, fieldProps } = useTelField('phone', {
 *   rules: toTypedSchema(zPhone()),
 *   validateOn: 'blur',
 * });
 * ```
 *
 * ```vue
 * <ATelInput
 *   v-model:phone="phone"
 *   v-model:country="country"
 *   v-bind="fieldProps"
 *   @blur="handleBlur"
 * />
 * ```
 *
 * Server-side validation (e.g. "does this phone already exist?") plugs in via the
 * `rules` callback — VeeValidate already supports async rules:
 *
 * ```ts
 * const { phone, country, error, handleBlur, fieldProps, validating } = useTelField('phone', {
 *   rules: async (value: string) => {
 *     const sync = await zPhone().safeParseAsync(value);
 *     if (!sync.success) return sync.error.issues[0]!.message;
 *     const res = await $fetch('/api/phone/exists', { query: { phone: value } });
 *     return res.exists ? 'This phone is already registered.' : true;
 *   },
 *   validateOn: 'blur',
 * });
 * ```
 *
 * The `validating` ref is `true` while VeeValidate's async pipeline is in flight —
 * bind it to ATelInput's `:validating` prop to surface a spinner inside the field.
 *
 * `vee-validate` is an **optional peer dependency** — install it yourself in your app.
 */

import { computed, ref, watch, type ComputedRef, type MaybeRefOrGetter } from 'vue';
import { toValue } from 'vue';
import { useField, type FieldOptions, type RuleExpression } from 'vee-validate';
import { usePhoneValidation } from '../composables/usePhoneValidation';
import type { ATelInputValidateOn } from '../composables/useTelInputValidation';

export interface UseTelFieldOptions {
  /**
   * VeeValidate rules — a function, schema, or string. Most commonly used with
   * `toTypedSchema(zPhone(...))` from `@vee-validate/zod`. Can be **async** for
   * server-side checks (e.g. uniqueness).
   */
  rules?: RuleExpression<string>;
  /**
   * Initial digits-only national number, e.g. `'1066105963'`. Defaults to `''`.
   */
  initialPhone?: string;
  /**
   * Initial dial-digit number, e.g. `20` for Egypt. Defaults to `null`.
   */
  initialCountry?: number | null;
  /**
   * Default country (ISO2 like `'EG'` or dial code like `'20'`). Forwarded as the
   * `defaultCountry` prop on `<ATelInput>` via `fieldProps`.
   */
  defaultCountry?: string;
  /**
   * When to surface validation in the UI. Defaults to `'blur'` (the typical form-library
   * UX). Forwarded as the `validateOn` prop on `<ATelInput>` via `fieldProps`.
   */
  validateOn?: ATelInputValidateOn;
  /**
   * Forwarded to `useField` — extra options passed verbatim to VeeValidate. Use to
   * configure `keepValueOnUnmount`, `syncVModel`, etc.
   */
  fieldOptions?: Omit<FieldOptions<string>, 'initialValue'>;
}

export interface UseTelFieldReturn {
  /** `v-model:phone` source — digits-only national number. Bind to `<ATelInput>`. */
  phone: import('vue').Ref<string>;
  /** `v-model:country` source — dial-digit number (e.g., `20`). Bind to `<ATelInput>`. */
  country: import('vue').Ref<number | null>;
  /** The canonical E.164 string fed to VeeValidate's schema (read-only). */
  e164: ComputedRef<string>;
  /** Current validation error message, or `undefined` when valid. From `useField`. */
  error: import('vue').Ref<string | undefined>;
  /** `true` while VeeValidate is running an async rule (e.g. server-side check). */
  validating: ComputedRef<boolean>;
  /** Whether the field has been blurred / dirtied / submitted (from VeeValidate `meta`). */
  meta: ReturnType<typeof useField<string>>['meta'];
  /** Forward this to `<ATelInput @blur="handleBlur">` so VeeValidate's blur trigger fires. */
  handleBlur: ReturnType<typeof useField<string>>['handleBlur'];
  /** Imperatively trigger validation (e.g., after a programmatic value change). */
  validate: ReturnType<typeof useField<string>>['validate'];
  /** Imperatively set the error message — useful for server errors not raised by `rules`. */
  setErrors: ReturnType<typeof useField<string>>['setErrors'];
  /** Reset the field to its initial state. */
  resetField: ReturnType<typeof useField<string>>['resetField'];
  /**
   * Ready-to-bind prop bag for `<ATelInput v-bind="fieldProps">`. Carries `name`,
   * `error`, `validateOn`, `validating`, and `defaultCountry`.
   */
  fieldProps: ComputedRef<{
    name: string;
    error: string | null;
    validateOn: ATelInputValidateOn;
    validating: boolean;
    defaultCountry?: string;
  }>;
}

/**
 * Register a phone field with VeeValidate. See file header for usage examples.
 *
 * @param name  The field name (used by VeeValidate, also forwarded to the inner
 *              `<input name="">` for native form submission).
 * @param options See {@link UseTelFieldOptions}.
 */
export function useTelField(
  name: MaybeRefOrGetter<string>,
  options: UseTelFieldOptions = {}
): UseTelFieldReturn {
  const phone = ref<string>(options.initialPhone ?? '');
  const country = ref<number | null>(options.initialCountry ?? null);

  const v = usePhoneValidation();
  void v.getCountries();

  // Compose E.164 from the two v-models — this is the canonical value VeeValidate
  // tracks. NANP (`+1`) resolves to `'US'` for validation; libphonenumber-js applies
  // the same rule set to every NANP country so this is correct.
  function composeE164(): string {
    if (!phone.value) return '';
    const dial = country.value;
    if (dial == null) return '';
    const matches = v.getCountriesByDial(String(dial));
    const iso2 = matches[0]?.value;
    if (!iso2) return '';
    const res = v.validate({ country: { iso2 }, phone: phone.value });
    return res.full_phone ?? '';
  }

  const initialValue = composeE164();

  const field = useField<string>(name, options.rules, {
    initialValue,
    // Don't run rules on every keystroke — let validateOn drive when validation fires.
    validateOnValueUpdate: false,
    ...options.fieldOptions,
  });

  // Keep VeeValidate's value in sync with the two v-models.
  watch(
    [phone, country],
    () => {
      field.value.value = composeE164();
    },
    { flush: 'post' }
  );

  const validating = computed(() => !!field.meta.pending);

  const fieldProps = computed(() => ({
    name: toValue(name),
    error: (field.errorMessage.value ?? null) as string | null,
    validateOn: options.validateOn ?? ('blur' as ATelInputValidateOn),
    validating: validating.value,
    defaultCountry: options.defaultCountry,
  }));

  return {
    phone,
    country,
    e164: computed(() => field.value.value ?? ''),
    error: field.errorMessage,
    validating,
    meta: field.meta,
    handleBlur: field.handleBlur,
    validate: field.validate,
    setErrors: field.setErrors,
    resetField: field.resetField,
    fieldProps,
  };
}
