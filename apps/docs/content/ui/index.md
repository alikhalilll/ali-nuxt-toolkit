---
title: ui
description: Headless, shadcn-vue style phone input. Built on reka-ui and vaul-vue, fully typed, themed via CSS variables.
package: '@alikhalilll/a-tel-input'
order: 4
---

# @alikhalilll/a-tel-input

A headless, [shadcn-vue](https://www.shadcn-vue.com/) style phone input for Vue 3 + Nuxt 3/4. Built on [reka-ui](https://reka-ui.com) and [vaul-vue](https://github.com/unovue/vaul-vue). Fully typed, themed via CSS variables — the country picker is a popover on desktop and a drawer on mobile, themable end-to-end.

See the [`ATelInput`](/ui/tel-input) page for install, setup, props, slots, and live demos.

## Theming

Every design token is a CSS variable prefixed `--ak-ui-`. Override any of them globally on `:root`, scoped to a wrapper class, or inline — components pick up the change at runtime via the cascade. Portaled popover / drawer content inherits.

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

Values are HSL **triplets** — no `hsl(…)` wrapper — because the Tailwind tokens compose them via `hsl(var(--ak-ui-…))`.

### Tokens

| Variable                              | Used for                                          |
| ------------------------------------- | ------------------------------------------------- |
| `--ak-ui-background` / `*-foreground` | Page background + text                            |
| `--ak-ui-popover` / `*-foreground`    | Popover surfaces + their text                     |
| `--ak-ui-muted` / `*-foreground`      | Hint text, search bar bg, country trigger bg      |
| `--ak-ui-accent` / `*-foreground`     | List hover + selected row                         |
| `--ak-ui-destructive`                 | Error ring + warning icon                         |
| `--ak-ui-border` / `--ak-ui-input`    | Outer border + inner dividers                     |
| `--ak-ui-ring`                        | Focus ring (the visual "brand")                   |
| `--ak-ui-radius`                      | Border radius (no Tailwind token — used directly) |

Live theming recipes (brand-only, day/night, multi-tenant, server-driven, state-specific) live on the [`ATelInput`](/ui/tel-input#theming) page.

## License

MIT © alikhalilll
