---
title: ui
description: Headless, shadcn-vue style component library. Built on reka-ui and vaul-vue, fully typed, themed via CSS variables, tree-shakable per component.
package: '@alikhalilll/a-*'
order: 4
---

# @alikhalilll/a-\*

A headless, [shadcn-vue](https://www.shadcn-vue.com/) style component library for Vue 3 + Nuxt 3/4. Built on [reka-ui](https://reka-ui.com) and [vaul-vue](https://github.com/unovue/vaul-vue). Fully typed, themed via CSS variables, **tree-shakable per component** through separate packages.

## Components

| Component                                      | Subpath                             | Summary                                                                                          |
| ---------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| [`ATelInput`](/ui/tel-input)                   | `@alikhalilll/a-tel-input`          | Phone input with auto country detection, libphonenumber validation, and a popover/drawer picker. |
| [`AInput`](/ui/input)                          | `@alikhalilll/a-input`              | Sized, themed text input with `prefix` / `suffix` slots.                                         |
| [`APopover`](/ui/popover)                      | `@alikhalilll/a-popover`            | Themed reka-ui popover — modal by default, optional overlay.                                     |
| [`ADrawer`](/ui/drawer)                        | `@alikhalilll/a-drawer`             | Bottom-sheet drawer (vaul-vue + reka-ui), drag-to-dismiss.                                       |
| [`AResponsivePopover`](/ui/responsive-popover) | `@alikhalilll/a-responsive-popover` | Popover on desktop, drawer on mobile. Single API.                                                |

Each component has its own **Install + Setup** section — open any component page above.

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
