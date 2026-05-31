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

**Other**

- The country picker's sticky-safe event scroll-lock (`scrollLock: 'events'`) now also applies on the mobile drawer — previously it was desktop-only and the page underneath could scroll. `vaul-vue`'s drag-to-dismiss is unaffected (it uses pointer events; the lock intercepts `touchmove` / `wheel` / scroll keys).
- README rewritten: form integration recipes (VeeValidate + Zod + server-side validation), complete props/events/slots/exposed-methods tables, theming token reference, accessibility notes, troubleshooting.
- Docs page (`/ui/tel-input`) gains a `DemoTelInputVeeValidate` live example.
