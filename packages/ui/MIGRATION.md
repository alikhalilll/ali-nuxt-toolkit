# `@alikhalilll/ui` build pipeline migration plan

## Context

The current pipeline at `packages/ui` is a hand-rolled chain of `vite` (runtime) + `vue-tsc 3.x --declaration --emitDeclarationOnly` (types) + `scripts/build/fix-dts-imports.mjs` (post-process) + `scripts/build/validate-dts.mjs` (gate). It has accumulated three rewrites to chase Volar correctness:

- `@/*` alias → relative path rewrite (because `vue-tsc` emits the literal alias)
- `from '..'` → `from '../index'` rewrite (vue-tsc occasionally emits the bare parent barrel)
- `__VLS_WithSlots<T, S>` rewrite — twice. First to fix `InstanceType<typeof Comp>` returning `{$slots: S}` instead of the rich instance; then (today's patch) to strip the wrapper entirely so Volar's _Go to Declaration_ on individual props works in consumers.

Each rewrite is a workaround for `vue-tsc`'s emission shape, not a fundamental fix. The output is correct only after multiple post-processing passes whose invariants drift apart from `vue-tsc`'s evolving format. Every minor `vue-tsc` change risks breaking one of them.

After researching `reka-ui`, `naive-ui`, and `vueuse`, every modern Vue 3 library I looked at has dropped the `vue-tsc + custom post-process` chain in favor of **`tsdown`** (Rolldown-based) with **`rolldown-plugin-dts`** configured `dts: { vue: true }`. The plugin emits a single bundled `.d.ts` per entry, with declaration maps that point back into shipped `src/`, and no `__VLS_WithSlots` wart in the public output. `vue-tsc` is retained only as a typecheck gate.

This plan migrates `packages/ui` to that pipeline, then layers on the optional Nuxt module and unplugin-vue-components resolver that Reka and VueUse ship.

## Reference patterns (what the field does)

| Concern              | Reka UI                                             | Naive UI                                | VueUse                      | Decision for `@alikhalilll/ui`                                    |
| -------------------- | --------------------------------------------------- | --------------------------------------- | --------------------------- | ----------------------------------------------------------------- |
| Bundler              | `tsdown`                                            | Vite                                    | `tsdown`                    | **`tsdown`**                                                      |
| Type emission        | `rolldown-plugin-dts { vue: true }`                 | `vue-tsc` direct emit                   | `rolldown-plugin-dts`       | **`rolldown-plugin-dts { vue: true }`**                           |
| Typecheck gate       | `vue-tsc --noEmit`                                  | mixed                                   | `vue-tsc --noEmit`          | **`vue-tsc --noEmit`** (keep)                                     |
| Source ships         | `src/` shipped, tests/stories excluded              | only `es/`, `lib/`, `volar.d.ts`        | only `dist/`                | **`entries/` + `utils/` shipped** (current; keep)                 |
| Default export shape | `DefineComponent<Props, …>` (no `__VLS_WithSlots`)  | manual ctor type w/ `$props` + `$slots` | n/a (composables)           | **plain `DefineComponent`** — no wrapper                          |
| Slot types           | not on `$slots`; exposed via separate types         | separate `*Slots` interface exported    | n/a                         | **separate `*Slots` interface export per component**              |
| Subpath imports      | single entry (#2253 open)                           | single entry                            | wildcard `./*` per-function | **keep per-entry subpaths** (already strong)                      |
| Nuxt support         | `reka-ui/nuxt` module                               | none                                    | `@vueuse/nuxt`              | **add `@alikhalilll/ui/nuxt`**                                    |
| Auto-import resolver | `reka-ui/resolver` for unplugin-vue-components      | none                                    | none                        | **add `@alikhalilll/ui/resolver`**                                |
| `volar.d.ts`         | no                                                  | yes (`GlobalComponents` augmentation)   | no                          | **skip** (Nuxt module + resolver covers it)                       |
| `sideEffects`        | `false`                                             | not set                                 | `false`                     | **`['**/\*.css']`\*\* (current; keep — styles ARE side-effectful) |
| Post-build script    | strip `sourcesContent` from JS maps to slim tarball | none seen                               | none                        | **adopt the strip**                                               |

## Target architecture

```
packages/ui/
├── src/                                  # renamed from entries/ (matches industry convention)
│   ├── tell-input/
│   │   ├── components/ATellInput.vue
│   │   ├── composables/
│   │   ├── utils/
│   │   └── index.ts                      # barrel: component + props + slots + composables
│   ├── input/…
│   ├── popover/…
│   ├── drawer/…
│   ├── responsive-popover/…
│   └── shared/                           # renamed from utils/; cn, sizes, control-variants
├── nuxt/index.ts                         # Nuxt module — registers all components
├── resolver/index.ts                     # unplugin-vue-components resolver
├── assets/styles.src.css
├── tsdown.config.ts
├── tsconfig.json                         # for typecheck (vue-tsc --noEmit)
├── package.json
└── (no scripts/build/ — tsdown replaces it)

dist/
├── index.js + index.cjs + index.d.ts + index.d.ts.map
├── tell-input.js + tell-input.cjs + tell-input.d.ts + tell-input.d.ts.map
├── input.{js,cjs,d.ts,d.ts.map}
├── popover.{js,cjs,d.ts,d.ts.map}
├── drawer.{js,cjs,d.ts,d.ts.map}
├── responsive-popover.{js,cjs,d.ts,d.ts.map}
├── shared.{js,cjs,d.ts,d.ts.map}
├── nuxt.{js,cjs,d.ts}
├── resolver.{js,cjs,d.ts}
└── assets/styles.css
```

**Per-component .d.ts shape** (one of the per-entry bundles, e.g. `dist/tell-input.d.ts`):

```ts
import type { DefineComponent } from 'vue';

export interface ATellInputProps { /* … */ }
export interface ATellInputSlots {
  prefix?: () => unknown;
  suffix?: (props: { validationState: 'idle' | 'valid' | 'error'; … }) => unknown;
  // … etc
}
export type ATellInputEmits = {
  'update:phone': [value: string];
  'update:country': [value: number | null];
};

export declare const ATellInput: DefineComponent<ATellInputProps, … (no __VLS_WithSlots)>;
```

— flat, navigable, declaration-map-resolves-to-source, no constructor intersections. Volar's _Go to Declaration_ on `phone` lands on the `ATellInputProps` interface's `phone?: string` line in the actual `.vue` source.

## Migration phases

### Phase 0 — Ship the hot-fix (today, ~10 min)

The wrapper-strip from this session already lives in `scripts/build/fix-dts-imports.mjs`. It demonstrably emits a clean `_default: typeof __VLS_base` (verified at `dist/entries/tell-input/components/ATellInput.vue.d.ts`). Before tearing the pipeline down, ship 1.2.5 with the strip + the source files. If Cmd+Click works in the consumer with this, the same fix flows naturally into the tsdown pipeline. If it doesn't, we know slot-wrapping isn't the only issue and need to broaden Phase 1.

Action: commit the `fix-dts-imports.mjs` change, bump 1.2.4 → 1.2.5, publish.

### Phase 1 — Replace build with `tsdown` + `rolldown-plugin-dts` (1–2 days)

**1.1 Rename `entries/` → `src/`** — purely cosmetic, but matches Reka/Naive/VueUse and makes the `files` field readable. Update tsconfig `include`, vite config aliases (during transition), and all internal imports.

**1.2 Rename `utils/` → `src/shared/`** — same reasoning. Subpath stays `@alikhalilll/ui/shared` (renamed from `/utils`) or keep `/utils` for back-compat by exposing both in `exports`.

**1.3 Add `tsdown.config.ts`:**

```ts
import { defineConfig } from 'tsdown';
import vue from 'unplugin-vue/rolldown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'tell-input': 'src/tell-input/index.ts',
    input: 'src/input/index.ts',
    popover: 'src/popover/index.ts',
    drawer: 'src/drawer/index.ts',
    'responsive-popover': 'src/responsive-popover/index.ts',
    shared: 'src/shared/index.ts',
    nuxt: 'nuxt/index.ts',
    resolver: 'resolver/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: { vue: true }, // <- key: vue-aware .d.ts via rolldown-plugin-dts
  external: [
    'vue',
    '@vueuse/core',
    'reka-ui',
    'vaul-vue',
    'lucide-vue-next',
    'class-variance-authority',
    'clsx',
    'tailwind-merge',
    'libphonenumber-js',
    'libphonenumber-js/examples.mobile.json',
  ],
  platform: 'neutral',
  sourcemap: true,
  treeshake: true,
  plugins: [vue()],
  exports: false, // we manage exports manually in package.json
});
```

**1.4 Delete `vite.config.ts`, `scripts/build/fix-dts-imports.mjs`, `scripts/build/validate-dts.mjs`** — `tsdown` + `rolldown-plugin-dts` cover all three concerns:

- Alias resolution: handled by rolldown's `alias` plugin during emit (no `@/` leaks)
- Parent-barrel imports: rolldown bundles, so no leftover `from '..'` literal imports
- Slot wrapping: `rolldown-plugin-dts` with `vue: true` emits canonical `DefineComponent` exports without `__VLS_WithSlots`

**1.5 Update `package.json` `scripts`:**

```json
"scripts": {
  "clean": "rimraf dist",
  "build": "pnpm clean && tsdown && pnpm build:css && node scripts/strip-source-content.mjs",
  "build:css": "tailwindcss -i assets/styles.src.css -o dist/assets/styles.css --minify",
  "typecheck": "vue-tsc --noEmit -p tsconfig.json",
  "prepack": "pnpm build"
}
```

`scripts/strip-source-content.mjs` is the only remaining post-build script, lifted directly from Reka UI's `scripts/postbuild.ts` — it zeroes `sourcesContent` in `dist/**/*.{js,cjs}.map` to trim the published tarball by ~30–40% without losing the `sources` references.

**1.6 Update author-side conventions in each `.vue`** — current code uses `defineProps<…>()` + `defineSlots<…>()` + `defineModel<…>()`. Keep that. Additionally, **export named `*Props` and `*Slots` interfaces from each entry's `index.ts`** so consumers can write `import type { ATellInputSlots } from '@alikhalilll/ui/tell-input'` and use them in their own template type inference. This is the Naive UI pattern — it's the right escape hatch for advanced consumers and costs nothing.

```ts
// src/tell-input/index.ts
export { default as ATellInput } from './components/ATellInput.vue';
export type { ATellInputProps, ATellInputSlots, ATellInputEmits } from './types';
// … utility re-exports
```

**1.7 Update `package.json` `exports` map** — same shape as today, just with cjs + types properly listed:

```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js",
    "require": "./dist/index.cjs"
  },
  "./tell-input": {
    "types": "./dist/tell-input.d.ts",
    "import": "./dist/tell-input.js",
    "require": "./dist/tell-input.cjs"
  },
  // … one per entry
  "./nuxt": { … },
  "./resolver": { … },
  "./styles.css": "./dist/assets/styles.css",
  "./package.json": "./package.json"
}
```

**1.8 Update `files`:**

```json
"files": [
  "src",
  "dist",
  "!src/**/*.test.ts",
  "!src/**/*.spec.ts",
  "!src/**/*.story.vue",
  "README.md",
  "LICENSE"
]
```

Same `!`-exclusion idiom Reka uses. Source ships so declaration maps resolve.

### Phase 2 — Nuxt module + unplugin-vue-components resolver (~0.5 day)

**2.1 `nuxt/index.ts`** — a minimal Nuxt module that registers every component globally with `Ali` (or any) prefix, mirroring `reka-ui/nuxt`:

```ts
import { defineNuxtModule, addComponent, createResolver } from '@nuxt/kit';

const COMPONENTS = ['ATellInput', 'AInput', 'APopover', 'APopoverContent' /* … */];

export default defineNuxtModule({
  meta: { name: '@alikhalilll/ui', configKey: 'alikhalilllUi' },
  defaults: { prefix: '' },
  setup(opts) {
    const { resolve } = createResolver(import.meta.url);
    for (const name of COMPONENTS) {
      const subpath = mapComponentToEntry(name);
      addComponent({
        name: `${opts.prefix}${name}`,
        export: name,
        filePath: `@alikhalilll/ui/${subpath}`,
      });
    }
  },
});
```

Consumer usage:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@alikhalilll/ui/nuxt'],
  alikhalilllUi: { prefix: 'A' }, // optional
  css: ['@alikhalilll/ui/styles.css'],
});
```

Nuxt populates `.nuxt/components.d.ts` with `typeof import('@alikhalilll/ui/tell-input')['ATellInput']` — which IS a clean `DefineComponent` after Phase 1. Cmd+Click on a template prop in a consumer Nuxt page walks straight to the `.vue` source.

**2.2 `resolver/index.ts`** — for Vite (non-Nuxt) consumers:

```ts
import type { ComponentResolver } from 'unplugin-vue-components';

const ENTRY_BY_COMPONENT: Record<string, string> = {
  ATellInput: 'tell-input',
  ACountrySelect: 'tell-input',
  AInput: 'input',
  APopover: 'popover',
  APopoverContent: 'popover',
  APopoverTrigger: 'popover',
  APopoverOverlay: 'popover',
  ADrawer: 'drawer',
  ADrawerContent: 'drawer',
  ADrawerTrigger: 'drawer',
  ADrawerOverlay: 'drawer',
  AResponsivePopover: 'responsive-popover',
  AResponsivePopoverContent: 'responsive-popover',
  AResponsivePopoverTrigger: 'responsive-popover',
};

export default function AlikhalilllUiResolver(opts: { prefix?: string } = {}): ComponentResolver {
  return {
    type: 'component',
    resolve(name) {
      if (opts.prefix && !name.startsWith(opts.prefix)) return;
      const bare = opts.prefix ? name.slice(opts.prefix.length) : name;
      const entry = ENTRY_BY_COMPONENT[bare];
      if (!entry) return;
      return { name: bare, from: `@alikhalilll/ui/${entry}` };
    },
  };
}
```

Same DX in Vite consumers as in Nuxt.

### Phase 3 — Optional polish (~0.5 day, can ship later)

- Add `web-types.json` (Naive UI ships this) for JetBrains IDE support. Generated from the `*Props` / `*Slots` interfaces via a `pnpm run gen:web-types` script.
- Migrate `entries/**/composables/*.ts` to colocate with each component if Phase 1 hasn't already.
- Add `pure` Rollup annotation plugin (Reka does this) on `defineComponent`, `cva`, `reactive` calls — squeezes another 5–10% off the bundle when consumers don't tree-shake aggressively.
- Wire `@arethetypeswrong/cli` (`attw`) into CI to validate `exports`/types alignment on every PR.

### Phase 4 — Cut over and verify (~0.5 day)

1. `pnpm build` in `packages/ui` — confirm `dist/` shape matches the target tree above.
2. `npm pack --dry-run` — confirm `src/`, `dist/`, README, LICENSE are present; no test/spec/story files.
3. Open one of the generated per-entry `.d.ts` (e.g., `dist/tell-input.d.ts`) and verify:
   - Component default export is `DefineComponent<…>` with no `__VLS_WithSlots`
   - `*Props`, `*Slots`, `*Emits` interfaces are named exports
   - `//# sourceMappingURL=tell-input.d.ts.map` is present
4. Open `dist/tell-input.d.ts.map` — verify `sources` references `../src/tell-input/…`.
5. Install the local tarball into `e-muslim-community-frontend`. Reload Vue Language Server. Cmd+Click `phone`, `country`, `show-validation` — each must jump into the `.vue` source. If yes, ship 2.0.0 (semver major: source-tree rename `entries/` → `src/`).

## Critical files

To create:

- `packages/ui/tsdown.config.ts`
- `packages/ui/nuxt/index.ts`
- `packages/ui/resolver/index.ts`
- `packages/ui/scripts/strip-source-content.mjs`
- `packages/ui/src/**/types.ts` (one per entry — promote per-component `*Props`/`*Slots`/`*Emits` to a named export module)

To modify:

- `packages/ui/package.json` — scripts, exports, files, devDependencies (drop vite, vite-plugin-vue, add tsdown, unplugin-vue, rolldown-plugin-dts)
- `packages/ui/tsconfig.json` — adjust `include` to `src/**` after rename; drop the `tsconfig.dist.json` since `tsdown` controls emission
- `packages/ui/src/**/*.vue` — surface `*Props`/`*Slots`/`*Emits` as named-export interfaces alongside the existing `defineProps<…>()`

To delete:

- `packages/ui/vite.config.ts`
- `packages/ui/scripts/build/fix-dts-imports.mjs`
- `packages/ui/scripts/build/validate-dts.mjs`
- `packages/ui/tsconfig.dist.json`

## Risk and rollback

- **Risk: `rolldown-plugin-dts` doesn't yet emit declaration maps with `sources` pointing into `src/`.** Reka UI's published artifacts confirm it does for SFC components, but on a new minor it could regress. Mitigation: pin `rolldown-plugin-dts` and `tsdown` to exact versions; add a CI check that greps emitted `.d.ts.map` files for `"sources":["../src/`.
- **Risk: bundling all entries through tsdown changes chunk splitting and may import the wrong cross-entry symbol.** Mitigation: the `external` array stays the same as today's `vite.config.ts` — Vue, Reka, vaul, lucide, etc all external. Anything internal becomes a chunk.
- **Risk: consumers pinned to the old `dist/entries/<x>/components/*.vue.d.ts` paths.** None today (the `exports` map never exposed those paths), so safe.

Rollback: keep the Phase 0 hot-fix (1.2.5) on a long-lived branch. If Phase 1 ships under 2.0.0 and proves broken, the 1.x branch is still publishable.

## Verification matrix

| What                  | How                                                                             | Pass criteria                               |
| --------------------- | ------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------- |
| Build succeeds        | `pnpm build`                                                                    | exit 0; expected files in `dist/`           |
| Types are valid       | `attw --pack` (or `pnpm dlx @arethetypeswrong/cli`)                             | 0 errors                                    |
| Cmd+Click works       | manual in `e-muslim-community-frontend`                                         | jumps into `.vue` source                    |
| Autocomplete works    | manual `<ATellInput :                                                           | `                                           | full prop list with JSDoc |
| `InstanceType` works  | `const r = ref<InstanceType<typeof ATellInput>>()`                              | `r.value?.$props.phone` typechecks          |
| Slot types accessible | `import type { ATellInputSlots } from '@alikhalilll/ui/tell-input'`             | named interface importable                  |
| Nuxt module works     | `e-muslim-community-frontend` with `modules: ['@alikhalilll/ui/nuxt']`          | `<ATellInput>` auto-imports, types resolve  |
| Tree-shaking works    | `pnpm dlx source-map-explorer` on a consumer bundle that only uses `ATellInput` | bundle does not include drawer/popover code |
| Tarball size          | `npm pack --dry-run`                                                            | under 200 KB packed (current: 135 KB)       |
