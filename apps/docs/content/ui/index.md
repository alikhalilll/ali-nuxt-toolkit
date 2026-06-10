---
title: ui
description: Headless Vue 3 / Nuxt 3+ components — international phone input on reka-ui + vaul-vue, and a self-generating skeleton loader. Fully typed, themed via CSS variables.
package: '@alikhalilll/a-*'
order: 4
---

# UI components

Headless, [shadcn-vue](https://www.shadcn-vue.com/) style components for Vue 3 + Nuxt 3/4. Each component ships as its own independently-versioned package — install only what you need. Fully typed, themed via CSS variables, dark-mode out of the box.

## Components

- [**`ATelInput`**](/ui/tel-input) — international phone input. Built on [reka-ui](https://reka-ui.com) and [vaul-vue](https://github.com/unovue/vaul-vue). Country auto-detect, libphonenumber-js validation, responsive popover/drawer picker, VeeValidate + Zod integration.
- [**`ASkeleton`**](/ui/skeleton) — auto-generating skeleton loader. First paint mirrors the slot's HTML structure; second load replays a pixel-aligned shape captured from the real DOM. Public composable + primitives for crafting custom skeleton flows.

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
