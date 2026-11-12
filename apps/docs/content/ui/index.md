---
title: ui
description: Headless Vue 3 / Nuxt 3+ components — an international phone input, and a measured skeleton loader. Fully typed, themed via CSS variables.
package: '@alikhalilll/a-*'
order: 4
---

# UI components

Two Vue 3 components built around a single idea: the DOM already knows the answer, so stop re-authoring it.

`ASmartSkeleton` reads the geometry of your real component and replays it as a placeholder — one template, no drift. `ATelInput` reads the user's dial code and reveals the country as they type it — no picker shoved in their face first. Both are headless, framework-light, themed by native CSS variables, and ship typed end-to-end. The directional one (`ASmartSkeleton`) flips its shimmer and sweep to right-to-left when the inherited `direction` says so — no prop, no new knob.

::alert{type="note" title="Pick what you need — nothing is bundled"}
There is no shared peer dependency, no shared registration, no shared stylesheet. Each component is its own npm package with its own tokens, its own install path, and its own version. The common prefix (`a-*`) is the only thing they share. Installing one does not install the other.
::

## Components

### [`ASmartSkeleton`](/ui/smart-skeleton)

A skeleton loader that **measures itself from your real component**. It lays the real card out unseen, reads its DOM with `getBoundingClientRect()` and Canvas 2D font metrics, then reconstructs the placeholder from what it saw. The hand-authored `<ProductCardSkeleton>` next to your `<ProductCard>` — the one that silently drifts every time padding changes — is gone.

- **Zero layout shift.** Bone positions come from the actual DOM, not a parallel template.
- **Chrome capture.** Backgrounds, borders, radii, and shadows copy over verbatim from the painted container, so cards look right from the first frame — including one-sided dividers.
- **One document clock.** Every shimmer on the page shares a single sweep. A card mounted at `t=0` and another mounted at `t=720ms` land in phase on the next tick.
- **Direction-aware.** Shimmer, sweep reveal, and the `byPosition` sequence cascade follow `<html dir="rtl">` without extra configuration.
- **Four states in one component.** `loading` → `error` → `empty` → `content`, plus the reveal transition between them.

```vue
<ASmartSkeleton id="user-card" :data="user" :sample="SAMPLE_USER">
  <template #default="{ data }">
    <UserCard :user="data" />
  </template>
</ASmartSkeleton>
```

### [`ATelInput`](/ui/tel-input)

An international telephone input **that gets out of the way**. The field starts as a single clean input — no country picker shoved in front of the user — and the flag reveals the moment a dial code is recognised. Numbers validate in real time via `libphonenumber-js`; the picker is a popover on desktop and a bottom-sheet drawer on mobile.

- **Real-time validation** against `libphonenumber-js`. Country-specific rules, E.164 output, formatted-as-you-type, all out of the box.
- **Responsive picker.** Popover on desktop, drawer on mobile — sticky-safe scroll-lock, keyboard-navigable, searchable.
- **Country auto-detect.** Pick from IP (`ipapi.co` by default or your endpoint), browser locale, or a custom `detector` function.
- **VeeValidate + Zod**, with async server-side validation hooks (`useTelField`, `zPhone`, `zPhoneObject`).
- **Native-forms friendly.** A hidden `<input>` carries the E.164 value so the field drops into a `<form method="post">` without ceremony.

```vue
<ATelInput v-model="phone" default-country="EG" />
```

## Shared design conventions

Both components are headless in the real sense — they own behaviour and layout, not visuals. Everything paintable is driven by CSS custom properties on `:root`, which means theming works through teleported popovers, through drawers, through dark-mode toggles, and through tenant-scoped wrappers. One declaration anywhere above the component re-tints every surface inside it.

```css
.tenant-acme {
  --ak-ui-popover: 220 70% 8%;
  --ak-ui-accent: 220 50% 30%;
  --ak-ui-ring: 220 100% 65%;
}
```

```vue
<div class="tenant-acme">
  <ATelInput v-model:phone="phone" v-model:country="country" />
</div>
```

::alert{type="warning" title="Values are HSL triplets, not `hsl(…)`"}
Write `220 70% 8%`, not `hsl(220 70% 8%)`. The tokens compose into the final colour via `hsl(var(--ak-ui-…))`, so wrapping the value yourself double-wraps and the rule silently breaks — no console error, just a blank surface.
::

### Shared token surface

The `--ak-ui-*` tokens below are what `ATelInput` and any component built on `AUiBase` read from. `ASmartSkeleton` uses a separate `--ask-*` namespace documented on [its theming page](/ui/smart-skeleton#theming).

| Variable                              | Used for                                        |
| ------------------------------------- | ----------------------------------------------- |
| `--ak-ui-background` / `*-foreground` | Page background + text                          |
| `--ak-ui-popover` / `*-foreground`    | Popover / drawer surface + its text             |
| `--ak-ui-muted` / `*-foreground`      | Hint text, search bar bg, trigger bg            |
| `--ak-ui-accent` / `*-foreground`     | List hover + selected row                       |
| `--ak-ui-destructive`                 | Error ring + warning icon                       |
| `--ak-ui-border` / `--ak-ui-input`    | Outer border + inner dividers                   |
| `--ak-ui-ring`                        | Focus ring                                      |
| `--ak-ui-radius`                      | Border radius (used directly, not via Tailwind) |

Live theming recipes — brand-only override, day/night pair, multi-tenant switching — live on the [`ATelInput` theming section](/ui/tel-input#theming) and apply verbatim to any component on this namespace.

## What's _not_ here

A UI library promises a system. This isn't one. There is no `<Button>` shipped with the toolkit, no `<Dialog>`, no `<Select>`, no form grid, no icon set, no `@theme` block to import. Use any design system you like — `shadcn-vue`, Nuxt UI, Vuetify, your own Tailwind — and drop these two components into it. They're load-bearing in places most libraries skip (skeleton drift, tel-input country UX) and they don't try to compete with the rest.

## License

MIT © alikhalilll
