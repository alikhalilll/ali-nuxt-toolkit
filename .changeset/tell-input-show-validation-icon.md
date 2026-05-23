---
'@alikhalilll/ui': minor
---

**Softer chrome + validation visuals are now off by default in `ATellInput`.**

`ATellInput` validation surfacing changes (default behavior is more neutral):

- New `showValidationIcon` prop. Defaults to `false` — the trailing green-check / red-alert icon is opt-in via `:show-validation-icon="true"`.
- `showValidation` now also gates the field's coloured border + ring (in addition to the error message text). With both props at their defaults, the field stays visually neutral and you drive validation rendering from the `validation` ref.
- The two props are independent — coloured field without icon, icon without coloured field, or both.

Chrome softening across the lib:

- `APopoverContent`: dropped the heavy outline; now `shadow-xl shadow-black/15` plus a hairline `border-border/70`.
- `ADrawerContent`: replaced the all-sides `border` with `shadow-2xl shadow-black/30` so the drawer lifts off the page with a soft shadow.
- Overlays (`APopoverOverlay`, `ADrawerOverlay`): dropped the `backdrop-blur-sm` and nudged dim to `bg-black/70` for a softer, blur-free darken.
- `ACountrySelect` search bar: softer divider and ring colors (`border-border/70`, `ring-border/70`), no width jump on focus, and the input grew to `h-10` for a more comfortable touch target.

Behavior change: callers that relied on the coloured field validation without setting `showValidation` will see a neutral field after this update; set `:show-validation="true"` to keep the coloured visuals.
