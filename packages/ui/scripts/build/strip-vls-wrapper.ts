/**
 * strip-vls-wrapper.ts
 *
 * Runs after `tsdown` to remove `__VLS_WithSlots` wrappers from emitted
 * `.d.ts` / `.d.cts` chunks. The wrapper is a `@vue/language-tools`
 * artefact: rolldown-plugin-dts inherits it from vue-tsc and bakes a
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
 * Strip rewrites `__VLS_export$N: __VLS_WithSlots$N<typeof __VLS_base$N, …>`
 * to `__VLS_export$N: typeof __VLS_base$N`, and drops the
 * `type __VLS_WithSlots$N<T, S> = …` alias. `_default$N` then resolves to a
 * clean `DefineComponent<…>`, which is what Vuetify, Element Plus, Naive UI,
 * and Headless UI Vue all ship.
 *
 * Trade-off: slot-prop types from `defineSlots()` are not exposed on the
 * public `$slots` shape. Slots still work at runtime; only the per-slot prop
 * type signature is dropped from the public API.
 *
 * Source-map preservation
 * -----------------------
 * The original strip-by-string-replace silently broke Cmd+Click — the
 * `.d.ts.map` produced by tsdown maps positions in the emitted `.d.ts` back
 * to the `.vue` source. Every replaced character shifts subsequent column
 * numbers, so naive text edits invalidate every mapping past the first edit
 * point. Volar would refuse to navigate ("Cannot find declaration to go to").
 *
 * Fix: use `magic-string` to track edits as offset ranges, then compose its
 * generated map (new-dts → original-dts positions) with the existing dts→vue
 * map via `@ampproject/remapping`. The final map directly maps the stripped
 * `.d.ts` to the original `.vue`, so navigation lands on the right line.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import MagicString from 'magic-string';
import remapping, { type EncodedSourceMap } from '@ampproject/remapping';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '../..');
const distDir = path.join(pkgRoot, 'dist');

const DTS_EXT = /\.d\.c?ts$/;

const EXPORT_RE =
  /declare const __VLS_export(\$\d+)?: __VLS_WithSlots(\$\d+)?<typeof __VLS_base(\$\d+)?, __VLS_Slots(\$\d+)?>;/g;

const ALIAS_DEFAULT_RE =
  /\s*type __VLS_WithSlots(\$\d+)?<T, S> = T & \{\s*new \(\): \{\s*\$slots: S;\s*\};\s*\};/g;

const ALIAS_PREV_RE =
  /\s*type __VLS_WithSlots(\$\d+)?<T, S> = T & \(new \(\) => \(T extends new \(\.\.\.args: any\) => infer R \? R : \{\}\) & \{ \$slots: S \}\);/g;

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
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
 * Apply all `__VLS_WithSlots` strips through magic-string and return both the
 * edited source and a "new → original-dts" map. `null` means no edits applied.
 *
 * The export-site rewrite is length-changing (replaces a longer generic
 * intersection with a shorter `typeof __VLS_base$N`), so the magic-string
 * approach matters here even more than for the simple alias removals.
 */
function applyStrip(
  content: string,
  fileBasename: string
): { code: string; map: EncodedSourceMap } | null {
  const s = new MagicString(content);
  let changed = false;

  for (const m of content.matchAll(EXPORT_RE)) {
    const exportSfx = m[1] ?? '';
    const baseSfx = m[3] ?? '';
    s.overwrite(
      m.index!,
      m.index! + m[0].length,
      `declare const __VLS_export${exportSfx}: typeof __VLS_base${baseSfx};`
    );
    changed = true;
  }

  for (const m of content.matchAll(ALIAS_DEFAULT_RE)) {
    s.remove(m.index!, m.index! + m[0].length);
    changed = true;
  }

  for (const m of content.matchAll(ALIAS_PREV_RE)) {
    s.remove(m.index!, m.index! + m[0].length);
    changed = true;
  }

  if (!changed) return null;

  const code = s.toString();
  const map = s.generateMap({
    source: fileBasename,
    file: fileBasename,
    includeContent: false,
    hires: true,
  }) as unknown as EncodedSourceMap;

  return { code, map };
}

/**
 * Compose magic-string's "new-dts → old-dts" map with the existing
 * "old-dts → .vue" map so the final on-disk map directly references the
 * original source. Without this composition Volar walks to the wrong line in
 * the .vue file (or gives up entirely).
 */
function composeMaps(
  editMap: EncodedSourceMap,
  originalMap: EncodedSourceMap | null,
  fileBasename: string
): EncodedSourceMap {
  if (!originalMap) return editMap;
  return remapping(editMap, (file: string) => {
    return file === fileBasename ? originalMap : null;
  }) as EncodedSourceMap;
}

async function readMapIfExists(mapPath: string): Promise<EncodedSourceMap | null> {
  try {
    const raw = await fs.readFile(mapPath, 'utf8');
    return JSON.parse(raw) as EncodedSourceMap;
  } catch {
    return null;
  }
}

async function processFile(file: string): Promise<{ stripped: boolean; leftover: boolean }> {
  const content = await fs.readFile(file, 'utf8');
  const result = applyStrip(content, path.basename(file));
  if (!result) {
    return { stripped: false, leftover: content.includes('__VLS_WithSlots') };
  }

  const mapPath = file + '.map';
  const originalMap = await readMapIfExists(mapPath);
  const finalMap = composeMaps(result.map, originalMap, path.basename(file));

  await fs.writeFile(file, result.code, 'utf8');
  if (originalMap) {
    await fs.writeFile(mapPath, JSON.stringify(finalMap), 'utf8');
  }

  return { stripped: true, leftover: result.code.includes('__VLS_WithSlots') };
}

async function main(): Promise<void> {
  const files = await walk(distDir);
  if (files.length === 0) {
    throw new Error(`strip-vls-wrapper: no .d.ts files in ${distDir}. Did tsdown run?`);
  }

  let touched = 0;
  let remaining = 0;

  for (const file of files) {
    const { stripped, leftover } = await processFile(file);
    if (stripped) touched++;
    if (leftover) {
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

main().catch((err: unknown) => {
  console.error('strip-vls-wrapper failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
