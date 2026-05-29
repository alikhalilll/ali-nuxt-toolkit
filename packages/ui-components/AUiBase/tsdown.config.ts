import { defineConfig } from 'tsdown';

/**
 * Build for `@alikhalilll/a-ui-base` — plain TS, no SFCs, so tsdown's own dts
 * emission is enough (no vue-tsc mirror needed). Dual ESM+CJS so the component
 * packages that externalize this dep resolve it in either module system.
 */
export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  platform: 'neutral',
  target: 'es2022',
  sourcemap: true,
  treeshake: true,
  clean: true,
  outDir: 'dist',
  dts: true,
  exports: false,
  deps: {
    neverBundle: ['clsx', 'tailwind-merge'],
  },
});
