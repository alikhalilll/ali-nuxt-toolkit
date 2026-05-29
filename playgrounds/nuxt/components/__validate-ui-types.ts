/**
 * Validation fixture: hard type-test gate for `@alikhalilll/a-*` consumers.
 *
 * Every public `*Props` / `*Emits` / `*Slots` interface is imported and bound
 * to a concrete-shaped value. If an interface goes missing from a subpath, is
 * renamed, or changes shape in a breaking way, `vue-tsc` fails on this file
 * during `pnpm typecheck` — same signal a downstream consumer would see in
 * their IDE.
 *
 * Type-only — no runtime side-effects, so it has no impact on the playground.
 *
 * Run as part of `consumer-validate.ts`, against the packed `.tgz` rather than
 * the workspace symlink, so the assertions cover the actual published surface.
 */
import type {
  ATelInputProps,
  ATelInputEmits,
  ATelInputSlots,
  ACountrySelectProps,
  ACountrySelectEmits,
  ACountrySelectSlots,
  ACountryFlagProps,
  ACountryFlagSlots,
  TelInputMessages,
  TelInputMessagesInput,
} from '@alikhalilll/a-tel-input';
import type { ATelInput } from '@alikhalilll/a-tel-input';

import type { AInputProps, AInputEmits, AInputSlots } from '@alikhalilll/a-input';

import type {
  APopoverProps,
  APopoverEmits,
  APopoverContentProps,
  APopoverContentEmits,
  APopoverTriggerProps,
  APopoverOverlayProps,
} from '@alikhalilll/a-popover';

import type {
  ADrawerProps,
  ADrawerEmits,
  ADrawerContentProps,
  ADrawerContentEmits,
  ADrawerTriggerProps,
  ADrawerOverlayProps,
} from '@alikhalilll/a-drawer';

import type {
  AResponsivePopoverProps,
  AResponsivePopoverEmits,
  AResponsivePopoverSlots,
  ScrollLockMode,
} from '@alikhalilll/a-responsive-popover';

// ── Required-only construction. If a previously-optional prop becomes required,
// or a key disappears, this trips.
const _tellInputProps: ATelInputProps = {};
const _countrySelectProps: ACountrySelectProps = {};
const _countryFlagProps: ACountryFlagProps = { iso2: 'EG' };
const _inputProps: AInputProps = {};
const _popoverProps: APopoverProps = {};
const _popoverContentProps: APopoverContentProps = {};
const _popoverTriggerProps: APopoverTriggerProps = {};
const _popoverOverlayProps: APopoverOverlayProps = {};
const _drawerProps: ADrawerProps = {};
const _drawerContentProps: ADrawerContentProps = {};
const _drawerTriggerProps: ADrawerTriggerProps = {};
const _drawerOverlayProps: ADrawerOverlayProps = {};
const _respPopoverProps: AResponsivePopoverProps = {};

// ── Key-level checks (asserts presence of expected prop names + types).
const _placeholder: string | undefined = _tellInputProps.placeholder;
const _size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined = _tellInputProps.size;
const _scrollLock: 'events' | 'body' | 'none' | undefined = _tellInputProps.scrollLock;
const _flagUrl: ((iso2: string, width: number) => string) | undefined = _tellInputProps.flagUrl;
const _overlay: boolean | undefined = _popoverContentProps.overlay;
const _lockScroll: boolean | undefined = _popoverOverlayProps.lockScroll;
const _respScrollLock: ScrollLockMode | undefined = _respPopoverProps.scrollLock;

// ── Slot-prop derivation. The shape consumers use for typed `#suffix` slots.
type _SuffixCtx = Parameters<NonNullable<ATelInputSlots['suffix']>>[0];
const _suffixCtx: _SuffixCtx = {} as _SuffixCtx;
const _validationState: 'idle' | 'valid' | 'error' = _suffixCtx.validationState;

type _AResponsivePopoverDefault = Parameters<NonNullable<AResponsivePopoverSlots['default']>>[0];
const _respDefault: _AResponsivePopoverDefault = { isDesktop: true };

// ── Emit map presence.
const _tellInputEmits = {} as ATelInputEmits;
const _countrySelectEmits = {} as ACountrySelectEmits;
const _inputEmits = {} as AInputEmits;
const _popoverEmits = {} as APopoverEmits;
const _popoverContentEmits = {} as APopoverContentEmits;
const _drawerEmits = {} as ADrawerEmits;
const _drawerContentEmits = {} as ADrawerContentEmits;
const _respPopoverEmits = {} as AResponsivePopoverEmits;

// ── Slot type presence (shape varies; just confirm the interface resolves).
const _tellInputSlots = {} as ATelInputSlots;
const _countrySelectSlots = {} as ACountrySelectSlots;
const _countryFlagSlots = {} as ACountryFlagSlots;
const _inputSlots = {} as AInputSlots;
const _respPopoverSlots = {} as AResponsivePopoverSlots;

// ── Messages bag — public, used in localisation paths.
const _messages: TelInputMessages = {} as TelInputMessages;
const _messagesInput: TelInputMessagesInput = {};

// ── InstanceType resolves to a clean DefineComponent (the strip-vls-wrapper
//    contract). Picks up the cleanly stripped DefineComponent generics so
//    `$props` is visible — this is the regression catcher for the strip step.
type _Inst = InstanceType<typeof ATelInput>;
const _inst = {} as _Inst;
const _instProps: _Inst['$props'] = _inst.$props;

// ── Touch every binding so unused-var lint doesn't shave them. Type-only;
//    the `void` discards them at runtime.
export {};
void _tellInputProps;
void _countrySelectProps;
void _countryFlagProps;
void _inputProps;
void _popoverProps;
void _popoverContentProps;
void _popoverTriggerProps;
void _popoverOverlayProps;
void _drawerProps;
void _drawerContentProps;
void _drawerTriggerProps;
void _drawerOverlayProps;
void _respPopoverProps;
void _placeholder;
void _size;
void _scrollLock;
void _flagUrl;
void _overlay;
void _lockScroll;
void _respScrollLock;
void _suffixCtx;
void _validationState;
void _respDefault;
void _tellInputEmits;
void _countrySelectEmits;
void _inputEmits;
void _popoverEmits;
void _popoverContentEmits;
void _drawerEmits;
void _drawerContentEmits;
void _respPopoverEmits;
void _tellInputSlots;
void _countrySelectSlots;
void _countryFlagSlots;
void _inputSlots;
void _respPopoverSlots;
void _messages;
void _messagesInput;
void _instProps;
