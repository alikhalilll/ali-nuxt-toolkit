/**
 * fix-dts-imports.mjs
 *
 * Runs AFTER `vue-tsc --declaration --emitDeclarationOnly` populates `dist/`.
 *
 * vue-tsc respects `tsconfig.paths` for *resolution* but emits the literal
 * `'@/…'` specifier into .d.ts output. Consumers don't have our `paths`
 * config, so unrewritten output would break in any downstream typecheck.
 * This script rewrites every `@/<x>` specifier to a sibling-relative path
 * computed from the .d.ts's own depth in `dist/`.
 *
 * Also kills the `from '..'` line that vue-tsc occasionally emits in
 * .d.ts files generated from .vue sources — Volar's prop introspection
 * traverses the import chain and fails when one of the targets is a
 * barrel that re-exports the component itself.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '../..');
const distDir = path.join(pkgRoot, 'dist');

// `@/<x>` resolves to `<pkgRoot>/<x>` in source. After emission with `rootDir: "."`,
// the dist mirror lives at `<distDir>/<x>` — so we resolve each alias target there.
const ALIAS_PREFIX = '@/';
const ALIAS_TARGET_ROOT = distDir;

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
    } else if (entry.isFile() && full.endsWith('.d.ts')) {
      out.push(full);
    }
  }
  return out;
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

/**
 * Compute the sibling-relative specifier from a file's dir to a target file/dir
 * inside dist/. Always returns a leading `./` or `../` so TS treats it as relative.
 */
function relativeSpecifier(fromFileDir, toAbsPath) {
  let rel = toPosix(path.relative(fromFileDir, toAbsPath));
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

async function exists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve an alias target like `utils` or `entries/popover` to an on-disk path
 * inside dist. Returns the directory itself if it exists (TS auto-resolves to
 * /index.d.ts), else the bare path (will be resolved as a file).
 */
async function resolveAliasTarget(subpath) {
  const candidate = path.join(ALIAS_TARGET_ROOT, subpath);
  if (await exists(candidate)) return candidate;
  // Fall back to candidate even if missing — the validator will catch a true miss.
  return candidate;
}

/**
 * Rewrite `from '@/<x>'` and `import('@/<x>')` specifiers in a single file's content.
 * `dynamicImport`-style `import("@/x")` is also covered.
 */
async function rewriteAliasSpecifiers(filePath, content) {
  const fileDir = path.dirname(filePath);
  let changed = false;

  // Match the path part of `from "..."` / `from '...'` / `import("...")` / `import('...')`.
  // We only rewrite specifiers that start with `@/`.
  const re = /(from\s+|import\(\s*)(['"])(@\/[^'"]+)\2/g;

  const replaced = content.replace(re, (_match, prefix, quote, spec) => {
    const subpath = spec.slice(ALIAS_PREFIX.length);
    // Cannot await inside replace — pre-resolve targets synchronously by
    // delegating to a cache populated after this pass. Simpler: compute the
    // candidate path directly; validator catches any genuine miss.
    const target = path.join(ALIAS_TARGET_ROOT, subpath);
    const relSpec = relativeSpecifier(fileDir, target);
    changed = true;
    return `${prefix}${quote}${relSpec}${quote}`;
  });

  return { content: replaced, changed };
}

/**
 * vue-tsc can emit `from '..'` (parent dir / barrel) inside .d.ts files
 * generated from .vue sources. The barrel re-exports the component itself,
 * so Volar's prop-resolution chain loops back through the component and
 * silently drops the prop list. Rewrite to the explicit `'../index'` target.
 *
 * Heuristic: only touch .d.ts files that live in `dist/entries/<x>/components/`
 * (depth 4 from dist) — these are the SFC-derived files that exhibit the bug.
 * Production code should never need to walk to the parent dir from a component
 * file; sibling and child relative imports always work.
 */
function rewriteParentBarrelImports(filePath, content) {
  const relFromDist = path.relative(distDir, filePath);
  const segments = toPosix(relFromDist).split('/');
  const isComponentDts =
    segments.length >= 4 && segments[0] === 'entries' && segments[2] === 'components';

  if (!isComponentDts) return { content, changed: false };

  // Match `from '..'` / `from ".."` (and the dynamic-import equivalent). Do NOT
  // match `from '../something'` — only the bare parent specifier is the wart.
  const re = /(from\s+|import\(\s*)(['"])\.\.\2/g;
  let changed = false;
  const replaced = content.replace(re, (_m, prefix, quote) => {
    changed = true;
    return `${prefix}${quote}../index${quote}`;
  });
  return { content: replaced, changed };
}

/**
 * vue-tsc 3.x wraps SFC defaults that call `defineSlots()` in an intersection:
 *
 *     type __VLS_WithSlots<T, S> = T & { new (): { $slots: S } };
 *     declare const _default: __VLS_WithSlots<typeof __VLS_base, __VLS_Slots>;
 *
 * That intersects two constructable signatures. `InstanceType<…>` resolves the
 * LAST overload — `{ $slots: S }` — which has no `$props`, no `$emit`. Volar's
 * template-side prop introspection in consumers reads it and concludes the
 * component accepts no props. Autocomplete dies; bogus props pass silently.
 *
 * Rewrite the helper body so the LAST constructor signature returns the rich
 * `DefineComponent` instance with `$slots` merged in. Order matters — the
 * constructor returning the merged instance must come last for `InstanceType`
 * to pick it. The `T` constructor signature is kept (first) so static-style
 * access on `typeof Component` still works.
 *
 * Manual conditional avoids the `T extends new (...args:any)=>any` constraint
 * on TS's built-in `InstanceType` (T here is `typeof __VLS_base`, which is
 * `DefineComponent<…>` — has construct signatures but the constraint isn't
 * always inferrable in this context).
 */
function rewriteVlsWithSlots(content) {
  const re = /type __VLS_WithSlots<T, S> = T & \{\s*new \(\): \{\s*\$slots: S;\s*\};\s*\};/;
  if (!re.test(content)) return { content, changed: false };
  const replacement =
    'type __VLS_WithSlots<T, S> = T & ' +
    '(new () => (T extends new (...args: any) => infer R ? R : {}) & { $slots: S });';
  return { content: content.replace(re, replacement), changed: true };
}

async function main() {
  const files = await walk(distDir);
  if (files.length === 0) {
    throw new Error(
      `fix-dts-imports: no .d.ts files in ${distDir}. Did \`vue-tsc --emitDeclarationOnly\` run?`
    );
  }

  let aliasTouched = 0;
  let parentTouched = 0;
  let slotsTouched = 0;

  for (const file of files) {
    const original = await fs.readFile(file, 'utf8');

    // Pre-fix sanity: no absolute paths, no /src/ leaks. vue-tsc 3.x is
    // well-behaved here, but cheap to verify before we start rewriting.
    if (original.includes(pkgRoot) && !original.includes(distDir)) {
      throw new Error(`fix-dts-imports: ${path.relative(pkgRoot, file)} leaks absolute path`);
    }
    if (original.includes('/src/') || original.includes('\\src\\')) {
      throw new Error(`fix-dts-imports: ${path.relative(pkgRoot, file)} leaks /src/ path`);
    }

    let { content, changed } = await rewriteAliasSpecifiers(file, original);
    if (changed) aliasTouched++;

    const parent = rewriteParentBarrelImports(file, content);
    if (parent.changed) {
      content = parent.content;
      parentTouched++;
    }

    const slots = rewriteVlsWithSlots(content);
    if (slots.changed) {
      content = slots.content;
      slotsTouched++;
    }

    if (content !== original) {
      await fs.writeFile(file, content, 'utf8');
    }
  }

  console.log(
    `fix-dts-imports: scanned ${files.length} files — rewrote @/ in ${aliasTouched}, ` +
      `rewrote parent-barrel in ${parentTouched}, rewrote __VLS_WithSlots in ${slotsTouched}`
  );
}

main().catch((err) => {
  console.error('fix-dts-imports failed:', err.message);
  process.exit(1);
});
