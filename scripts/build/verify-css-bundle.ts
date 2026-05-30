#!/usr/bin/env tsx
/**
 * verify-css-bundle.ts (shared)
 *
 * Catches stale-`dist` regressions when a package's `styles.src.css` chains
 * `@import` directives at workspace dependencies (e.g. ATelInput → a-responsive-popover
 * → a-popover). Tailwind's @import resolves against the file on disk at build
 * time; if an upstream `dist/styles.css` is stale (e.g. from a half-finished
 * prior build), the chain silently bundles incomplete CSS — popover background
 * goes transparent and the failure only shows up at runtime.
 *
 * This step reads `cssBundleRequires` from the local `package.json` and asserts
 * each class is present in `dist/styles.css`. Run after `tailwindcss` +
 * `merge-sfc-styles.ts`, so it sees the final compiled bundle.
 *
 *   "cssBundleRequires": ["bg-popover", "bg-background"]
 */
import { readFileSync, existsSync } from 'node:fs';
import process from 'node:process';

const pkgPath = 'package.json';
const distPath = 'dist/styles.css';

const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const required: string[] = pkg.cssBundleRequires ?? [];

if (required.length === 0) {
  console.log('verify-css-bundle: no required classes declared, skipping');
  process.exit(0);
}

if (!existsSync(distPath)) {
  console.error(`verify-css-bundle: FAILED — ${distPath} does not exist`);
  process.exit(1);
}

const bundle = readFileSync(distPath, 'utf-8');
const missing: string[] = [];

for (const cls of required) {
  // Match `.cls` followed by a character that ends a class selector — punctuation,
  // whitespace, or selector combinators. Avoid matching `.cls-extra`.
  const escaped = cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\.${escaped}(?:[\\s,.:{>+~\\[]|$)`);
  if (!re.test(bundle)) missing.push(cls);
}

if (missing.length > 0) {
  console.error(`verify-css-bundle: FAILED — missing required classes in ${distPath}:`);
  for (const m of missing) console.error(`  - .${m}`);
  console.error('');
  console.error('This usually means a chained @import is resolving to a stale upstream dist.');
  console.error('Fix:  rm -rf packages/ui-components/*/dist && pnpm build');
  process.exit(1);
}

console.log(`verify-css-bundle: ok — all ${required.length} required classes present`);
