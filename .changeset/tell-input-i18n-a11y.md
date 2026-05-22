---
'@alikhalilll/ui': minor
---

**`ATellInput` is now international, accessible, and re-laid-out.**

Layout: the country picker moved to the **end** of the field as a flag-only trigger (flag + chevron, no dial-code text). The selected dial code now renders as a static, non-editable prefix inside the input. This is the new default shape; the `trigger` / `flag` / `chevron` slots still allow the old look.

New props:

- `dir` — `'ltr' | 'rtl' | 'auto'`. Omitted/`'auto'` inherits direction from the page; `'ltr'` / `'rtl'` force it. The phone field row itself always stays LTR (dial prefix → digits → flag) since a phone number is LTR content; the helper/error text and the country popover follow the page direction.
- `locale` — BCP-47 locale. Localizes country names via `Intl.DisplayNames` (search matches both the localized and English spelling) and renders the format-hint numerals in that locale.
- `messages` — one bag for every UI string (picker labels, validation errors, and screen-reader labels). Every key is optional and falls back to its English default. The existing individual props (`searchPlaceholder`, `emptyText`, `loadingText`, `errorMessages`) still work and take precedence over the matching `messages` key.

Alternative numerals: digits typed in Arabic-Indic (`٠-٩`), Extended/Eastern Arabic — Persian & Urdu (`۰-۹`), Devanagari, or Bengali are normalized to ASCII before validation. `v-model:phone` always holds ASCII digits. `normalizeDigits` and `LOCALE_DIGIT_RANGES` are exported for standalone use.

Accessibility: the phone input carries an `aria-label`, the hint/error helper line sits in an `aria-live="polite"` region with the input's `aria-describedby` pointing at it, so screen readers announce validation changes.

Also exported: `DEFAULT_MESSAGES`, `resolveMessages`, `localizeCountries`, and the `TellInputMessages` / `TellInputMessagesInput` / `ATellInputDir` types.

The change is additive — existing usage keeps working; only the default trigger placement is visually different, and that is overridable via slots.
