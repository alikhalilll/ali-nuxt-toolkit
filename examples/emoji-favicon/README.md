# `@yourname/emoji-favicon`

> Dynamic emoji favicons for Vue, Nuxt, and Vite. Framework-agnostic core; thin per-framework adapters.

[![npm version](https://img.shields.io/npm/v/%40yourname%2Femoji-favicon.svg?style=for-the-badge&label=npm&labelColor=0a0a0a&color=635bff)](https://www.npmjs.com/package/@yourname/emoji-favicon)
[![license](https://img.shields.io/npm/l/%40yourname%2Femoji-favicon.svg?style=for-the-badge&labelColor=0a0a0a&color=635bff)](./LICENSE)
[![types](https://img.shields.io/npm/types/%40yourname%2Femoji-favicon.svg?style=for-the-badge&labelColor=0a0a0a&color=635bff)](https://www.npmjs.com/package/@yourname/emoji-favicon)

## Setup

### Nuxt 3 / 4

```bash
pnpm add @yourname/emoji-favicon
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@yourname/emoji-favicon/nuxt'],
  emojiFavicon: { emoji: '⚡' },
});
```

`useEmojiFavicon()` and `<EmojiFavicon />` are auto-imported — no `import` needed in your `.vue` files.

### Vue 3

```bash
pnpm add @yourname/emoji-favicon
```

```ts
// main.ts
import { createApp } from 'vue';
import EmojiFavicon from '@yourname/emoji-favicon/vue';
import App from './App.vue';

createApp(App).use(EmojiFavicon, { initial: '⚡' }).mount('#app');
```

### Vite

```bash
pnpm add @yourname/emoji-favicon
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { emojiFavicon } from '@yourname/emoji-favicon/vite';

export default defineConfig({
  plugins: [emojiFavicon({ emoji: '⚡' })],
});
```

### Plain TypeScript / browser

```ts
import { setFavicon } from '@yourname/emoji-favicon';
setFavicon('⚡');
```

## API

### `setFavicon(emoji, options?)`

Pure function. Renders the emoji to a canvas, swaps `<link rel="icon">`.

```ts
const result = setFavicon('⚡', { size: 64, background: '#fff' });
// → { ok: true } | { ok: false, reason: 'invalid_emoji' | 'no_dom' | 'canvas_unsupported' }
```

### `useEmojiFavicon(initial?, options?)` (Vue)

Reactive composable. Mutate the returned `emoji` ref and the favicon updates automatically.

```vue
<script setup lang="ts">
const { emoji } = useEmojiFavicon('⚡');

function onLogin() {
  emoji.value = '✅';
}
</script>
```

### `<EmojiFavicon emoji size? background? />` (Vue / Nuxt)

Renders an inline preview AND updates the document favicon.

```vue
<EmojiFavicon emoji="⚡" />
```

### `EmojiFaviconResolver()` (unplugin-vue-components)

```ts
import Components from 'unplugin-vue-components/vite';
import { EmojiFaviconResolver } from '@yourname/emoji-favicon/resolver';

Components({ resolvers: [EmojiFaviconResolver()] });
```

### `FaviconController` — stateful API

```ts
import { FaviconController } from '@yourname/emoji-favicon';

const ctrl = new FaviconController({ size: 64 });
ctrl.set('⚡');
ctrl.value; // → '⚡'
ctrl.clear();
```

## How it's built

This package is the worked example for the LinkedIn series **["How to make a plugin"](../../social-media/series-nuxt-module-a-to-z/)** — 15 posts taking you from an empty folder to a published npm package. Each post tags a commit (`series/post-NN-<slug>`) so you can `git checkout` the state at any point in the journey.

Architecture (matches what the series teaches):

```
src/
├── core/         ← pure TS, no framework imports
├── vite/         ← Vite plugin (transformIndexHtml)
├── vue/          ← Vue 3 plugin + composable + component
├── nuxt/         ← Nuxt module wrapping the above
│   └── runtime/  ← ships to browser; no @nuxt/kit imports allowed
└── resolver/     ← unplugin-vue-components resolver
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)
