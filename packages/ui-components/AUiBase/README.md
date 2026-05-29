# @alikhalilll/a-ui-base

Shared foundation for the `@alikhalilll/a-*` Vue 3 component packages. Every component depends on
this for its class merger, size scale, and design tokens — you rarely install it directly (it
comes transitively), but you **do** import its `tokens.css` once in your app.

## Install

```bash
pnpm add @alikhalilll/a-ui-base
```

Pulled in automatically as a dependency of every `@alikhalilll/a-*` component package.

## What it provides

### `cn(...inputs)`

`clsx` + `tailwind-merge` class merger — conditionally join class names and let later Tailwind
utilities win over earlier conflicting ones.

```ts
import { cn } from '@alikhalilll/a-ui-base';

cn('px-2 py-1', isActive && 'bg-primary', props.class);
```

### Size scale

A single source of truth so every control lines up: `xs · sm · md (default) · lg · xl`
(md = 43 px).

| Export            | Type                                   | Description                                                             |
| ----------------- | -------------------------------------- | ----------------------------------------------------------------------- |
| `Size`            | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | The size union used by component `size` props.                          |
| `SIZES`           | `readonly Size[]`                      | All sizes, in order — handy for demos/selectors.                        |
| `DEFAULT_SIZE`    | `Size`                                 | `'md'`.                                                                 |
| `controlHeight`   | `Record<Size, string>`                 | Tailwind height utility per size (`h-7` … `h-[60px]`).                  |
| `controlPaddingX` | `Record<Size, string>`                 | Horizontal padding utility per size.                                    |
| `controlTextSize` | `Record<Size, string>`                 | Font-size utility per size.                                             |
| `controlHeightPx` | `Record<Size, number>`                 | Pixel height per size, for non-template code (icons, `ResizeObserver`). |

```ts
import { controlHeight, type Size } from '@alikhalilll/a-ui-base';

const size: Size = 'md';
const h = controlHeight[size]; // 'h-[43px]'
```

## Styling

### `tokens.css` — runtime design tokens

Import **once** in your app. Defines the `--ak-ui-*` HSL custom properties (background, foreground,
primary, popover, muted, accent, destructive, border, input, ring, radius) for both light and dark.
Every component's compiled stylesheet resolves `var(--ak-ui-*)` at runtime, so theming and `.dark`
mode flow from here.

```ts
import '@alikhalilll/a-ui-base/tokens.css';
```

Override any token globally or per-scope:

```css
:root {
  --ak-ui-primary: 220 90% 56%;
}
.tenant-acme {
  --ak-ui-primary: 12 76% 61%;
}
```

Toggle dark mode by putting `class="dark"` on a wrapper (e.g. `<html class="dark">`).

### `theme.css` — build-time only

Consumed by each component package's Tailwind build (it maps `--ak-ui-*` → Tailwind's `--color-*`
namespace). **Apps never import this** — you import the prebuilt `styles.css` of each component
instead.

## License

MIT
