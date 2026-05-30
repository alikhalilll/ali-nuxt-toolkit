# @alikhalilll/a-ui-base

> **Internal workspace package — not published to npm.**
> Its JS (`cn`, size scale), types, and design tokens are bundled into every
> `@alikhalilll/a-*` component's `dist/` at build time, so consumers install
> only the components they use and need no separate base import.

This README exists so contributors know where the shared foundation lives, what
each piece is for, and how to override the tokens from a consuming app — the
consumer-facing surface flows through each component's own README.

## What it provides

### `cn(...inputs)`

`clsx` + `tailwind-merge` class merger — conditionally join class names and let later Tailwind
utilities win over earlier conflicting ones. Bundled into each component, used internally.

### Size scale

Single source of truth so every control lines up: `xs · sm · md (default) · lg · xl` (md = 43 px).

| Export            | Type                                   | Description                                            |
| ----------------- | -------------------------------------- | ------------------------------------------------------ |
| `Size`            | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | The size union used by component `size` props.         |
| `SIZES`           | `readonly Size[]`                      | All sizes, in order — handy for demos/selectors.       |
| `DEFAULT_SIZE`    | `Size`                                 | `'md'`.                                                |
| `controlHeight`   | `Record<Size, string>`                 | Tailwind height utility per size (`h-7` … `h-[60px]`). |
| `controlPaddingX` | `Record<Size, string>`                 | Horizontal padding utility per size.                   |
| `controlTextSize` | `Record<Size, string>`                 | Font-size utility per size.                            |
| `controlHeightPx` | `Record<Size, number>`                 | Pixel height per size, for non-template code.          |

### `tokens.css` — runtime design tokens

Defines the `--ak-ui-*` HSL custom properties (background, foreground, primary, popover, muted,
accent, destructive, border, input, ring, radius) for both light and dark. Each component's
`dist/styles.css` `@import`s this file at build time, so consumers get the tokens automatically
when they import any component's stylesheet. Override per app:

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

Consumed by each component package's Tailwind build (maps `--ak-ui-*` → Tailwind's `--color-*`
namespace). Never imported by apps.

## License

MIT
