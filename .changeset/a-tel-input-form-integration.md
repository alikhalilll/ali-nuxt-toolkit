---
'@alikhalilll/a-tel-input': minor
---

Form-library integration + mobile drawer scroll-lock parity.

**New form integration**

- `name`, `error`, `validateOn`, and `validating` props on `<ATelInput>` — surface external (VeeValidate / Zod / server-side) validation state in the field, including an in-field spinner while async checks are in flight.
- New `@blur` / `@focus` emits and imperative `focus()` / `blur()` / `select()` methods via `defineExpose` — useful for form libraries that want to focus the offending field after a failed submit.
- New subpath entry `@alikhalilll/a-tel-input/vee-validate` exporting `useTelField()` — a composable that owns both v-models, composes them into an E.164 string for VeeValidate, and returns a ready-to-bind `fieldProps` object. Supports async server-side rules out of the box.
- New subpath entry `@alikhalilll/a-tel-input/zod` exporting `zPhone()` / `zPhoneObject()` — schema factories backed by the same `libphonenumber-js` engine the component uses, so the schema can never disagree with the in-field state.
- `vee-validate` and `zod` are optional peer dependencies.

**Default `v-model` (E.164 string)**

- New default `v-model` carries the canonical E.164 string. Drops directly into VeeValidate's `<Field v-slot="{ field }">` pattern via `v-bind="field"`, native `<form>` submission, and any other consumer that expects one canonical value. Stays in sync with the existing `v-model:phone` + `v-model:country` contract — pick whichever fits.

**Universal country detection**

- `matchLeadingDialCode` rewritten to iterate over **every** country libphonenumber knows about (~250 ISO2 codes), with priority order: env hint → current selection → user's recents → popular shortlist → all countries. First country that yields a valid parse wins.
- Detects local-format numbers (`01066105963` → Egypt) **regardless of the env hint**. Previously local-format detection only worked when the env hint already matched the input's country.
- Tier 1 now synthesises a minimal `CountryOption` from libphonenumber's metadata when the async country list hasn't loaded yet, so detection works from first paint for any country.

**Refactor: state-machine consolidation**

- New `useCountrySelection` composable owns the picker selection state machine (`iso2` + `source` enum + `detectionLocked`). Replaces the three interacting boolean flags (`userPickedCountry`, `autoSettingCountry`, `inputDetectionApplied`) with a single source of truth and explicit source attribution (`'default'` / `'env'` / `'input'` / `'picker'` / `'external'` / `'none'`).
- New `useSyncedModel` helper provides generic bidirectional sync between a `defineModel` ref and internal state with the echo-loop guard built in. Replaces hand-rolled `applyingModelValue` / `lastEmittedModelValue` flag pair AND the manual country↔selectedIso2 watcher pair.
- Both composables exported from the package root for advanced consumers composing their own field.

**Performance + efficiency**

- LRU cache (128 entries) on `matchLeadingDialCode` keyed by `digits|hint|current` — repeat keystrokes / backspace + retype skip the (potentially ~250-country) iteration.
- `FALLBACK_COUNTRIES` pre-seeded into the `byValue` / `byDialDigits` lookup indexes at composable instantiation. Detection works synchronously from first paint for the ~22 most-populated countries, even before the async REST Countries fetch resolves.
- REST Countries fetch and IP geolocation request deduped via **module-level singleton**. One network call per page across every `usePhoneValidation()` instance (which means one call across every `<ATelInput>` / `<ACountrySelect>` / `useTelField()` / `zPhone()`) instead of one per instance.

**Other**

- The country picker's sticky-safe event scroll-lock (`scrollLock: 'events'`) now also applies on the mobile drawer — previously it was desktop-only and the page underneath could scroll. `vaul-vue`'s drag-to-dismiss is unaffected (it uses pointer events; the lock intercepts `touchmove` / `wheel` / scroll keys).
- README rewritten: form integration recipes (VeeValidate + Zod + server-side validation), complete props/events/slots/exposed-methods tables, theming token reference, accessibility notes, troubleshooting.
- Docs page (`/ui/tel-input`) gains a `DemoTelInputVeeValidate` live example.
- Single CSS import: `@alikhalilll/a-tel-input/styles.css` bundles popover + drawer + design tokens. No separate imports needed.
- `npm` / `pnpm` / `yarn` / `bun` install commands shown throughout the docs.
- npm `homepage` deep-links to the install section of the docs site.
