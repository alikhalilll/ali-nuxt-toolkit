/**
 * strip-vls-wrapper.mjs
 *
 * Runs after `tsdown` to remove `__VLS_WithSlots` wrappers from emitted
 * `.d.ts` / `.d.cts` chunks. The wrapper is a `@vue/language-tools`
 * artifact: rolldown-plugin-dts inherits it from vue-tsc and bakes a
 * `T & { new (): { $slots: S } }` intersection around every SFC default
 * that calls `defineSlots()`.
 *
 * That intersection breaks two consumer-side Volar paths:
 *   1. `InstanceType<typeof Comp>` picks the LAST construct signature
 *      (`{ $slots: S }`) — no `$props`, no `$emit`.
 *   2. Cmd+Click on a prop inside a consumer template returns "Cannot find
 *      declaration to go to" — ts-server can't trace a source span through
 *      the intersection-with-constructor.
 *
 * Strip: rewrite `__VLS_export$N: __VLS_WithSlots$N<typeof __VLS_base$N, …>`
 * to `__VLS_export$N: typeof __VLS_base$N`, and drop the `type
 * __VLS_WithSlots$N<T, S> = …` alias. `_default$N` then resolves to a clean
 * `DefineComponent<…>`, which is what Vuetify, Element Plus, Naive UI, and
 * Headless UI Vue all ship.
 *
 * Trade-off: slot-prop types from `defineSlots()` are not exposed on the
 * public `$slots` shape. Slots still work at runtime; only the per-slot prop
 * type signature is dropped from the public API.
 *
 * tsdown bundles multiple components into shared `.d.ts` chunks, so each
 * wrapper has a `$N` suffix (`__VLS_WithSlots$2`, `__VLS_export$2`,
 * `__VLS_base$2`, `__VLS_Slots$2`). Suffixes are paired per component; the
 * regex matches any digit suffix or the unsuffixed form.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '../..');
const distDir = path.join(pkgRoot, 'dist');

const DTS_EXT = /\.d\.c?ts$/;

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (entry.isFile() && DTS_EXT.test(full)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Strip every `__VLS_WithSlots` flavor in `content`.
 *
 *  - `declare const __VLS_export$N: __VLS_WithSlots$N<typeof __VLS_base$N, __VLS_Slots$N>;`
 *      → `declare const __VLS_export$N: typeof __VLS_base$N;`
 *
 *  - `type __VLS_WithSlots$N<T, S> = T & { new (): { $slots: S; }; };`        (vue-tsc default)
 *  - `type __VLS_WithSlots$N<T, S> = T & (new () => (… infer R …) & { … });` (prior rewrite)
 *      → removed
 *
 * `$N` is optional (chunks emitted with a single component have no suffix).
 */
function stripWrapper(content) {
  let next = content;
  let changed = false;

  // tsdown bundles components into chunks and dedupes the structurally-
  // identical `__VLS_WithSlots`/`__VLS_Slots` aliases, so the export's
  // suffix doesn't have to match the wrapper's suffix. Only the `__VLS_base`
  // suffix needs to be preserved on the right-hand side — that one names a
  // unique declaration per component.
  const exportRe =
    /declare const __VLS_export(\$\d+)?: __VLS_WithSlots(\$\d+)?<typeof __VLS_base(\$\d+)?, __VLS_Slots(\$\d+)?>;/g;
  if (exportRe.test(next)) {
    exportRe.lastIndex = 0;
    next = next.replace(
      exportRe,
      (_m, exportSfx = '', _wrapperSfx, baseSfx = '') =>
        `declare const __VLS_export${exportSfx}: typeof __VLS_base${baseSfx};`
    );
    changed = true;
  }

  const aliasDefaultRe =
    /\s*type __VLS_WithSlots(\$\d+)?<T, S> = T & \{\s*new \(\): \{\s*\$slots: S;\s*\};\s*\};/g;
  if (aliasDefaultRe.test(next)) {
    aliasDefaultRe.lastIndex = 0;
    next = next.replace(aliasDefaultRe, '');
    changed = true;
  }

  const aliasPrevRe =
    /\s*type __VLS_WithSlots(\$\d+)?<T, S> = T & \(new \(\) => \(T extends new \(\.\.\.args: any\) => infer R \? R : \{\}\) & \{ \$slots: S \}\);/g;
  if (aliasPrevRe.test(next)) {
    aliasPrevRe.lastIndex = 0;
    next = next.replace(aliasPrevRe, '');
    changed = true;
  }

  return { content: next, changed };
}

async function main() {
  const files = await walk(distDir);
  if (files.length === 0) {
    throw new Error(`strip-vls-wrapper: no .d.ts files in ${distDir}. Did tsdown run?`);
  }

  let touched = 0;
  let remaining = 0;

  for (const file of files) {
    const original = await fs.readFile(file, 'utf8');
    const { content, changed } = stripWrapper(original);
    if (changed) {
      await fs.writeFile(file, content, 'utf8');
      touched++;
    }
    if (content.includes('__VLS_WithSlots')) {
      remaining++;
      console.error(
        `strip-vls-wrapper: ${path.relative(pkgRoot, file)} still contains __VLS_WithSlots`
      );
    }
  }

  console.log(`strip-vls-wrapper: scanned ${files.length} files — stripped ${touched}`);

  if (remaining > 0) {
    throw new Error(
      `strip-vls-wrapper: ${remaining} file(s) still contain __VLS_WithSlots. ` +
        `The regex needs updating — likely tsdown's dts plugin changed format.`
    );
  }
}

main().catch((err) => {
  console.error('strip-vls-wrapper failed:', err.message);
  process.exit(1);
});
