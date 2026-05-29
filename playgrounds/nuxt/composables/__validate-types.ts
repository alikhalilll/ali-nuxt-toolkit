/**
 * Validation fixture: compile-time assertions on the public TYPE surface of
 * @alikhalilll/a-*. Every block here either:
 *   - imports a type/value from a published subpath (proves the subpath
 *     resolves and the export exists),
 *   - assigns to an explicit type annotation (proves the SHAPE matches),
 *   - or calls a function and pins its return type (proves the runtime
 *     signature matches the .d.ts).
 *
 * If a previously-public type changes shape in a breaking way, this file
 * fails to typecheck — same failure a downstream consumer would see in their
 * IDE the moment they upgrade.
 *
 * No top-level exports: nothing here should pollute Nuxt's composables
 * auto-import. The runtime side-effect of executing this module is harmless
 * (just a handful of `unknown`-typed locals).
 */
import {
  // Re-exported from the root `@alikhalilll/a-*` barrel
  ATelInput,
  ACountrySelect,
  ACountryFlag,
} from '@alikhalilll/a-tel-input';
import {
  aTelInputVariants,
  DEFAULT_MESSAGES,
  DEFAULT_ERROR_MESSAGES,
  resolveMessages,
  defaultFlagUrl,
  normalizeDigits,
  LOCALE_DIGIT_RANGES,
  usePhoneValidation,
  type ATelInputProps,
  type ATelInputSlots,
  type ATelInputEmits,
  type ATelInputSize,
  type ATelInputVariants,
  type ATelInputDir,
  type ACountrySelectProps,
  type TelInputMessages,
  type TelInputMessagesInput,
  type FlagUrlBuilder,
} from '@alikhalilll/a-tel-input';
import type { APopoverProps, APopoverContentProps } from '@alikhalilll/a-popover';
import type { ADrawerProps, ADrawerContentProps } from '@alikhalilll/a-drawer';
import type {
  AResponsivePopoverProps,
  AResponsivePopoverEmits,
  ScrollLockMode,
} from '@alikhalilll/a-responsive-popover';
import type { AInputProps, AInputEmits } from '@alikhalilll/a-input';

// ── Default-imports resolve to component definitions ────────────────────────
// (Asserting truthiness keeps tsc from tree-shaking the imports away.)
const _components = [ATelInput, ACountrySelect, ACountryFlag];
void _components;

// ── Size scale literal union is preserved ───────────────────────────────────
const validSizes: ATelInputSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
void validSizes;
// `dir` literal union is preserved
const validDirs: ATelInputDir[] = ['ltr', 'rtl', 'auto'];
void validDirs;

// ── cva variants function: signature + return shape ─────────────────────────
const fieldClass: string = aTelInputVariants({ size: 'md' });
void fieldClass;
// VariantProps drives the typed `size` parameter on the function
const _variantsArg: ATelInputVariants = { size: 'sm' };
void _variantsArg;

// ── ATelInputProps must keep its core public keys ──────────────────────────
// (RequiredKeys is asserted via Pick — fails if any key is removed.)
type _PropKeysSpot = Pick<
  ATelInputProps,
  'placeholder' | 'disabled' | 'loading' | 'size' | 'showValidation' | 'showValidationIcon' | 'dir'
>;
const _propsSpotCheck: _PropKeysSpot = {};
void _propsSpotCheck;

// ── Slot prop shape: `suffix` receives a `validationState` literal union ────
const _slotsCheck: ATelInputSlots = {
  suffix: ({ validationState }) => {
    const _state: 'idle' | 'valid' | 'error' = validationState;
    return _state;
  },
  'valid-icon': () => 'ok',
  'error-icon': ({ reason }) => reason,
};
void _slotsCheck;

// ── Emits map: update:phone carries string, update:country carries number|null
type _PhoneEvent = ATelInputEmits['update:phone'];
type _CountryEvent = ATelInputEmits['update:country'];
const _phoneEvent: _PhoneEvent = ['+20 123'];
const _countryEvent: _CountryEvent = [20];
const _nullCountryEvent: _CountryEvent = [null];
void _phoneEvent;
void _countryEvent;
void _nullCountryEvent;

// ── Messages defaults & resolution ──────────────────────────────────────────
const _msgs: TelInputMessages = DEFAULT_MESSAGES;
void _msgs;
const _resolved: TelInputMessages = resolveMessages({ searchPlaceholder: 'foo' });
void _resolved;
const _partial: TelInputMessagesInput = { searchPlaceholder: 'foo' };
void _partial;
const _err = DEFAULT_ERROR_MESSAGES;
void _err;

// ── Flag URL builder ────────────────────────────────────────────────────────
const _flag: string = defaultFlagUrl('US', 40);
void _flag;
const _customBuilder: FlagUrlBuilder = (iso, w) => `${iso}-${w}`;
void _customBuilder;

// ── Digit normalization ─────────────────────────────────────────────────────
const _normalized: string = normalizeDigits('١٢٣');
void _normalized;
const _ranges = LOCALE_DIGIT_RANGES;
void _ranges;

// ── Composable shape: usePhoneValidation must expose `validate` (single-arg
//    `ValidateArgs` form) plus the data-loading helpers. ─────────────────────
const _validation = usePhoneValidation();
const _validateResult = _validation.validate({
  country: { iso2: 'EG', dial_code: '+20' },
  phone: '1066105963',
});
void _validateResult;
const _getCountriesFn: () => unknown = _validation.getCountries;
void _getCountriesFn;

// ── Subpath types from popover / drawer / input / responsive-popover ────────
const _popover: APopoverProps = { open: true };
const _popoverContent: APopoverContentProps = {};
void _popover;
void _popoverContent;
const _drawer: ADrawerProps = {};
const _drawerContent: ADrawerContentProps = {};
void _drawer;
void _drawerContent;
const _input: AInputProps = {};
void _input;
const _inputEmits: AInputEmits = (() => {}) as unknown as AInputEmits;
void _inputEmits;
const _resp: AResponsivePopoverProps = {};
const _respEmits: AResponsivePopoverEmits = (() => {}) as unknown as AResponsivePopoverEmits;
void _resp;
void _respEmits;
const _lock: ScrollLockMode = 'events';
void _lock;
const _lock2: ScrollLockMode = 'body';
void _lock2;
const _lock3: ScrollLockMode = 'none';
void _lock3;

// ── ACountrySelectProps must accept `size` from the shared scale ────────────
const _csProps: ACountrySelectProps = { size: 'md' };
void _csProps;

// Sentinel export so this file is treated as a module — keeps imports scoped.
export {};
