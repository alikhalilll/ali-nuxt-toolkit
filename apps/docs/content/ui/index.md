---
title: ui
description: Headless Vue 3 / Nuxt 3+ components — an international phone input, and a measured skeleton loader. Fully typed, themed via CSS variables.
package: '@alikhalilll/a-*'
order: 4
---

# UI components

Headless Vue 3 components for Nuxt 3 / 4 — shipped as independently-versioned packages. Install only what you need. Typed end-to-end, themed via CSS custom properties, dark-mode as an invariant rather than a feature.

::alert{type="note" title="These are components, not a system"}
There is no shared peer dependency, no shared registration, no shared stylesheet to drop in once. Each component ships its own tokens, its own CSS, and its own install path — you pick them up individually. The only thing they have in common is a prefix.
::

## Components

- [**`ASmartSkeleton`**](/ui/smart-skeleton) — measured skeleton loader. Lays your real component out unseen, reads its DOM with `getBoundingClientRect()` and Canvas 2D font metrics, and replays it as a placeholder.
- [**`ATelInput`**](/ui/tel-input) — international phone input. Country auto-detect, `libphonenumber-js` validation, popover-on-desktop / drawer-on-mobile picker, VeeValidate + Zod integration.

## Theming

Every token is a CSS variable. Override any of them globally on `:root`, scoped to a wrapper class, or inline — the cascade takes it from there, including through teleported popovers and drawers.

```css
/* Per-tenant override — applies to anything inside .tenant-acme */
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

::alert{type="info" title="Values are HSL triplets, not `hsl(…)`"}
Write `220 70% 8%`, not `hsl(220 70% 8%)`. The Tailwind tokens compose them via `hsl(var(--ak-ui-…))`, so wrapping the value yourself double-wraps and the rule silently breaks.
::

### Shared tokens

| Variable                              | Used for                                        |
| ------------------------------------- | ----------------------------------------------- |
| `--ak-ui-background` / `*-foreground` | Page background + text                          |
| `--ak-ui-popover` / `*-foreground`    | Popover surfaces + their text                   |
| `--ak-ui-muted` / `*-foreground`      | Hint text, search bar bg, trigger bg            |
| `--ak-ui-accent` / `*-foreground`     | List hover + selected row                       |
| `--ak-ui-destructive`                 | Error ring + warning icon                       |
| `--ak-ui-border` / `--ak-ui-input`    | Outer border + inner dividers                   |
| `--ak-ui-ring`                        | Focus ring                                      |
| `--ak-ui-radius`                      | Border radius (used directly, not via Tailwind) |

`ASmartSkeleton` uses a separate `--ask-*` namespace — see its [theming section](/ui/smart-skeleton#theming) for the token table.

Live theming recipes (brand-only, day/night, multi-tenant) live on the [`ATelInput`](/ui/tel-input#theming) page.

## License

MIT © alikhalilll
