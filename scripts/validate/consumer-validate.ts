#!/usr/bin/env node
/**
 * consumer-validate.mjs
 *
 * Proves the package builds publish-clean by simulating a real external consumer:
 *
 *   1. Run `pack-all` to produce .tgz tarballs + manifest.json in `.packs/<stamp>/`.
 *   2. Copy `playgrounds/nuxt` into a fresh `os.tmpdir()` directory.
 *   3. Replace its `workspace:*` deps with `file:.tarballs/<pkg>-<ver>.tgz` so pnpm
 *      installs the actual built artifacts (not symlinks into the workspace).
 *   4. Run `pnpm install`, `nuxi prepare`, `pnpm typecheck`, `pnpm build`.
 *
 * If consumers downstream — Nuxt apps using auto-imports — can typecheck and build
 * against the tarballs, the package's published surface is consumer-clean. This
 * complements `validate-dist.mjs` (publint + attw) by exercising the actual
 * import path a user takes.
 *
 * Usage:
 *   node scripts/consumer-validate.mjs            # validates ALL publishable packages
 *   node scripts/consumer-validate.mjs --pkg a-tel-input   # one package
 *   node scripts/consumer-validate.mjs --pkg a-tel-input,crypto
 *   node scripts/consumer-validate.mjs --keep     # keep tmp dir on success (for debugging)
 */
import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import minimist from 'minimist';
import { execa } from 'execa';
import pc from 'picocolors';
import { ALL_PACKAGES, packageDir, PUBLISHABLE_PACKAGES, ROOT } from '../lib/constants.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = minimist(process.argv.slice(2), {
  string: ['pkg'],
  boolean: ['all', 'keep'],
  default: { all: false, keep: false },
});

function pickPkgs() {
  if (args.all) return [...PUBLISHABLE_PACKAGES];
  if (args.pkg) {
    return String(args.pkg)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [...PUBLISHABLE_PACKAGES];
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  await fs.cp(src, dest, {
    recursive: true,
    filter: (p) => {
      const rel = path.relative(src, p);
      if (!rel) return true;
      if (rel.startsWith('node_modules')) return false;
      if (rel.startsWith('.nuxt')) return false;
      if (rel.startsWith('.output')) return false;
      if (rel.startsWith('dist')) return false;
      return true;
    },
  });
}

/**
 * Replace `workspace:*` (and any other workspace specifier) for our publishable
 * packages with a `file:` reference to the tarball. Deps for packages not under
 * test are removed entirely so the temp playground only installs what's packed.
 */
async function rewriteInternalDeps(pkgJsonPath, manifestTarballs, allInternalNames) {
  const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, 'utf8'));
  const sections = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

  for (const sectionName of sections) {
    const section = pkgJson[sectionName];
    if (!section) continue;

    for (const dep of allInternalNames) {
      if (!(dep in section)) continue;
      const t = manifestTarballs[dep];
      if (t) {
        section[dep] = `file:.tarballs/${t.filename}`;
      } else {
        delete section[dep];
      }
    }
  }

  // pnpm 10 treats unconfirmed postinstall scripts as a hard error. Inherit the
  // root's `onlyBuiltDependencies` allowlist so the temp playground's install
  // doesn't trip [ERR_PNPM_IGNORED_BUILDS] on esbuild/@parcel/watcher/etc.
  const rootPkgJson = JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf8'));
  const onlyBuilt = rootPkgJson.pnpm?.onlyBuiltDependencies;
  if (onlyBuilt) {
    pkgJson.pnpm = { ...pkgJson.pnpm, onlyBuiltDependencies: onlyBuilt };
  }

  // Internal packages depend on each other (e.g. a-tel-input → a-ui-base) via the
  // version baked into the tarball — transitive specifiers that would 404 against
  // the (unpublished) registry. Override every packed package to its local tarball.
  const overrides = Object.fromEntries(
    Object.entries(manifestTarballs).map(([name, t]) => [name, `file:.tarballs/${t.filename}`])
  );
  if (Object.keys(overrides).length) {
    pkgJson.pnpm = {
      ...pkgJson.pnpm,
      overrides: { ...(pkgJson.pnpm?.overrides ?? {}), ...overrides },
    };
  }

  await fs.writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
}

/**
 * Strip nuxt.config.ts entries for packages that aren't in the manifest (i.e. weren't
 * packed). Otherwise the temp playground would fail to resolve a missing Nuxt module.
 * This is a light text-rewrite — keeps things readable for debugging.
 */
/**
 * Strip a top-level key whose value is an object literal (e.g. `crypto: {...}`)
 * from a config source. Uses a brace-depth counter so nested objects don't
 * fool it the way a `{[^}]*}` regex would. Returns the modified source.
 */
function stripObjectKey(src, key) {
  const startRe = new RegExp(`(^|\\n)(\\s*)${key}\\s*:\\s*\\{`, 'g');
  for (;;) {
    const m = startRe.exec(src);
    if (!m) return src;
    const keyStart = m.index + m[1].length;
    let i = m.index + m[0].length; // first char AFTER the opening `{`
    let depth = 1;
    while (i < src.length && depth > 0) {
      const c = src[i];
      if (c === '{') depth++;
      else if (c === '}') depth--;
      i++;
    }
    if (depth !== 0) return src; // unbalanced — bail
    // Consume trailing comma + the newline before the next field.
    while (i < src.length && /[,\s]/.test(src[i]) && src[i] !== '\n') i++;
    if (src[i] === ',') i++;
    src = src.slice(0, keyStart) + src.slice(i);
    startRe.lastIndex = keyStart;
  }
}

async function stripMissingModulesFromNuxtConfig(tmpPlayground, missingModuleNames) {
  if (missingModuleNames.length === 0) return;

  const candidates = ['nuxt.config.ts', 'nuxt.config.mts', 'nuxt.config.js', 'nuxt.config.mjs'];
  for (const file of candidates) {
    const fullPath = path.join(tmpPlayground, file);
    if (!(await exists(fullPath))) continue;

    let src = await fs.readFile(fullPath, 'utf8');
    for (const mod of missingModuleNames) {
      // Remove the module string from the `modules: [...]` array. The module
      // path may carry a subpath (`@alikhalilll/a-tel-input/nuxt`); match either form.
      const escaped = mod.replace(/[/-]/g, (m) => `\\${m}`);
      src = src.replace(new RegExp(`['"]${escaped}(?:/[^'"]+)?['"]\\s*,?`, 'g'), '');
      // Per-module config block keyed by the camelCased short identifier.
      const shortKey = shortIdentifier(mod);
      const camelKey = shortKey.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      src = stripObjectKey(src, camelKey);
    }
    // Tidy dangling commas / empty array slots.
    src = src.replace(/,(\s*[}\]])/g, '$1');
    src = src.replace(/\[\s*,/g, '[');
    src = src.replace(/,\s*,/g, ',');

    await fs.writeFile(fullPath, src);
    console.log(
      pc.yellow('  ⚠') + ' Stripped from nuxt.config: ' + pc.dim(missingModuleNames.join(', '))
    );
  }
}

/**
 * Derive a package's "short identifier" for filename/auto-import-helper matching.
 * `@alikhalilll/nuxt-crypto` → `crypto`
 * `@alikhalilll/nuxt-api-provider` → `api-provider`
 * `@alikhalilll/a-tel-input` → `a-tel-input`
 */
function shortIdentifier(pkgName) {
  return pkgName.replace(/^@[^/]+\//, '').replace(/^nuxt-/, '');
}

/**
 * For every package NOT in the manifest, delete any consumer-facing file that
 * references it — either by explicit import string OR by filename pattern (so
 * pages like `crypto.vue` that rely solely on the module's auto-injected
 * `$crypto` runtime helper also get removed, since dropping the module from
 * `nuxt.config` makes that helper `unknown` and breaks typecheck).
 *
 * Scan list mirrors Nuxt's auto-import + routing surface: pages, server,
 * components, composables, layouts, middleware, plugins.
 */
async function stripPackageReferencesFromPlayground(tmpPlayground, missingPackageNames) {
  if (missingPackageNames.length === 0) return;

  const scanDirs = [
    'pages',
    'server',
    'components',
    'composables',
    'layouts',
    'middleware',
    'plugins',
  ];

  // Filename-pattern matcher per missing package. `^<short>(-|\.)` catches
  // `crypto.vue`, `crypto-core.vue`, `crypto/index.vue`, but NOT `crypto-tests.vue`
  // if it lives under a different package — close enough for a playground.
  const shortNames = missingPackageNames.map(shortIdentifier);
  const filenameRegex = new RegExp(`^(${shortNames.join('|')})(-|\\.|$)`);

  async function walkAndStrip(dir) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walkAndStrip(full);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!/\.(vue|ts|mts|js|mjs)$/.test(entry.name)) continue;

      const filenameMatch = filenameRegex.test(entry.name);
      let contentMatch = false;
      if (!filenameMatch) {
        const content = await fs.readFile(full, 'utf8');
        contentMatch = missingPackageNames.some((pkg) => content.includes(pkg));
      }

      if (filenameMatch || contentMatch) {
        await fs.unlink(full);
        console.log(
          pc.yellow('  ⚠') +
            ' Removed ' +
            pc.dim(path.relative(tmpPlayground, full)) +
            ' (references missing package)'
        );
      }
    }
  }

  for (const dirName of scanDirs) {
    await walkAndStrip(path.join(tmpPlayground, dirName));
  }
}

async function ensureNuxtTypecheckReady(tmpPlayground) {
  console.log(pc.cyan('→') + ' nuxi prepare');
  await execa('pnpm', ['exec', 'nuxi', 'prepare'], {
    cwd: tmpPlayground,
    stdio: 'inherit',
    env: { ...process.env, PNPM_CONFIG_STRICT_DEP_BUILDS: 'false' },
  });

  const nuxtDir = path.join(tmpPlayground, '.nuxt');
  if (!(await exists(nuxtDir))) {
    throw new Error('nuxi prepare did not generate .nuxt in the consumer playground.');
  }

  const tsconfigPath = path.join(tmpPlayground, 'tsconfig.json');
  if (!(await exists(tsconfigPath))) {
    await fs.writeFile(
      tsconfigPath,
      JSON.stringify({ extends: './.nuxt/tsconfig.json' }, null, 2) + '\n'
    );
  }
}

/**
 * Auto-import / auto-completion gate.
 *
 * When the full @alikhalilll/a-* component set is validated, every component its
 * `@alikhalilll/a-tel-input/nuxt` module registers must show up in the consumer's
 * `.nuxt/components.d.ts`. That file is the source of truth for editor
 * auto-completion in `<script setup>` — if a component is missing here,
 * IDEs won't suggest it, even though it might still render at runtime.
 *
 * The auto-import-usage fixture (`components/__validate-auto-imports.vue`)
 * catches this too via vue-tsc, but this explicit grep gives a sharper error
 * before the typecheck stage so the failure is easy to diagnose.
 */
const UI_COMPONENT_PACKAGES = [
  'a-input',
  'a-popover',
  'a-drawer',
  'a-responsive-popover',
  'a-tel-input',
];

const UI_AUTO_IMPORTED_COMPONENTS = [
  'ATelInput',
  'ACountrySelect',
  'ACountryFlag',
  'AInput',
  'APopover',
  'APopoverContent',
  'APopoverTrigger',
  'APopoverOverlay',
  'ADrawer',
  'ADrawerContent',
  'ADrawerTrigger',
  'ADrawerOverlay',
  'AResponsivePopover',
  'AResponsivePopoverContent',
  'AResponsivePopoverTrigger',
];

async function verifyAutoImports(tmpPlayground, includesUi) {
  if (!includesUi) return;

  const componentsDts = path.join(tmpPlayground, '.nuxt', 'components.d.ts');
  if (!(await exists(componentsDts))) {
    throw new Error(
      `.nuxt/components.d.ts missing — auto-import wiring failed during nuxi prepare.`
    );
  }
  const content = await fs.readFile(componentsDts, 'utf8');
  const missing = UI_AUTO_IMPORTED_COMPONENTS.filter(
    (name) => !new RegExp(`\\b${name}\\b`).test(content)
  );
  if (missing.length) {
    throw new Error(
      `Components missing from .nuxt/components.d.ts (auto-completion broken):\n  - ` +
        missing.join('\n  - ')
    );
  }
  console.log(
    pc.green('✓') +
      ' ' +
      pc.dim(`auto-import registry: ${UI_AUTO_IMPORTED_COMPONENTS.length} components present`)
  );
}

/**
 * Map every workspace package's on-disk dir → its npm name. Iterates
 * {@link ALL_PACKAGES} (publishable + internal) so the closure expansion
 * below can resolve internal deps (e.g. `@alikhalilll/a-popover` → `a-popover`)
 * even though they're never published to npm.
 */
function buildNpmNameIndex(): { byDir: Record<string, string>; byNpmName: Record<string, string> } {
  const byDir: Record<string, string> = {};
  const byNpmName: Record<string, string> = {};
  for (const dir of ALL_PACKAGES) {
    const pkgJson = JSON.parse(
      readFileSyncOrEmpty(path.join(packageDir(dir), 'package.json')) || '{}'
    );
    if (pkgJson.name) {
      byDir[dir] = pkgJson.name;
      byNpmName[pkgJson.name] = dir;
    }
  }
  return { byDir, byNpmName };
}

function readFileSyncOrEmpty(p: string): string {
  try {
    return readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

/**
 * Given a user-requested pack list, walk each package.json and add any
 * `@alikhalilll/*` dependency that's also a publishable workspace package.
 * Repeats until closure. Returns a stable order: user's picks first, then
 * supporting deps appended.
 *
 * Why this matters: during a multi-package release, packages are published
 * one at a time. When `a-tel-input`'s tarball is consumer-validated, its
 * `package.json` declares `@alikhalilll/a-popover@1.0.1` as a dependency
 * (workspace-pinned at pack time). pnpm tries to fetch that from npm and
 * may 404 due to CDN propagation lag — even though we published it 30s ago.
 * Packing the entire workspace-internal closure sidesteps the registry
 * entirely: every internal dep resolves to a local `file:.tarballs/...`
 * override.
 */
function expandToWorkspaceClosure(initial: string[], byNpmName: Record<string, string>): string[] {
  const out: string[] = [...initial];
  const seen = new Set(initial);
  const queue = [...initial];
  while (queue.length > 0) {
    const dir = queue.shift()!;
    const pkgJsonPath = path.join(packageDir(dir), 'package.json');
    const raw = readFileSyncOrEmpty(pkgJsonPath);
    if (!raw) continue;
    const pkgJson = JSON.parse(raw);
    const allDeps = {
      ...(pkgJson.dependencies || {}),
      ...(pkgJson.peerDependencies || {}),
      // devDeps too: AUiBase is sometimes a devDep so the bundled output references it.
      ...(pkgJson.devDependencies || {}),
    };
    for (const depName of Object.keys(allDeps)) {
      const depDir = byNpmName[depName];
      if (!depDir || seen.has(depDir)) continue;
      seen.add(depDir);
      out.push(depDir);
      queue.push(depDir);
    }
  }
  return out;
}

async function main() {
  console.log(pc.bold(pc.blue('\n▶ consumer-validate\n')));

  const requested = pickPkgs();
  for (const p of requested) {
    if (!PUBLISHABLE_PACKAGES.includes(p)) {
      throw new Error(
        `Unknown package "${p}". Expected one of: ${PUBLISHABLE_PACKAGES.join(', ')}`
      );
    }
  }

  // Expand to workspace-internal transitive closure so we never hit the npm
  // registry for our own packages during install (avoids CDN propagation races
  // during multi-package releases).
  const { byNpmName } = buildNpmNameIndex();
  const picked = expandToWorkspaceClosure(requested, byNpmName);
  const added = picked.filter((p) => !requested.includes(p));

  console.log(pc.cyan('→') + ' Validating: ' + pc.bold(requested.join(', ')));
  if (added.length) {
    console.log(
      pc.cyan('→') +
        ' ' +
        pc.dim(`Also packing internal deps (avoids registry race): ${added.join(', ')}`)
    );
  }

  // 1. Pack into a fresh .packs/<stamp>/ dir. Always pass an explicit --pkg
  // list — `picked` may include internal packages (pulled in via the closure
  // expansion above) which pack-all's `--all` shortcut doesn't cover.
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').replace(/\..+$/, '');
  const outDir = path.join(ROOT, '.packs', `consumer-${stamp}`);
  const packArgs = ['tsx', path.join(__dirname, '..', 'pack', 'pack-all.ts'), '--outDir', outDir];
  packArgs.push('--pkg', picked.join(','));

  console.log(pc.cyan('→') + ' Packing tarballs...');
  await execa(packArgs[0], packArgs.slice(1), { stdio: 'inherit', cwd: ROOT });

  const manifest = JSON.parse(await fs.readFile(path.join(outDir, 'manifest.json'), 'utf8'));
  const packedNames = Object.keys(manifest.tarballs);

  // 2. Copy playgrounds/nuxt to tmp
  const tmpBase = await fs.mkdtemp(path.join(os.tmpdir(), 'ali-nuxt-toolkit-consumer-'));
  const srcPlayground = path.join(ROOT, 'playgrounds', 'nuxt');
  const tmpPlayground = path.join(tmpBase, 'nuxt');

  console.log(pc.cyan('→') + ' Temp playground: ' + pc.dim(tmpPlayground));
  await copyDir(srcPlayground, tmpPlayground);

  // 3. Drop tarballs into <tmp>/.tarballs/ and rewrite deps
  const tarballDir = path.join(tmpPlayground, '.tarballs');
  await fs.mkdir(tarballDir, { recursive: true });
  for (const t of Object.values(manifest.tarballs)) {
    await fs.copyFile(t.path, path.join(tarballDir, t.filename));
  }

  // Collect every internal package name the playground may reference, so unpacked
  // ones get removed (not left dangling) and packed ones get pinned to `file:`.
  const playgroundPkgJsonPath = path.join(tmpPlayground, 'package.json');
  const playgroundPkgJson = JSON.parse(await fs.readFile(playgroundPkgJsonPath, 'utf8'));
  const allInternalNames = Array.from(
    new Set([
      ...packedNames,
      ...Object.keys(playgroundPkgJson.dependencies || {}).filter((n) =>
        n.startsWith('@alikhalilll/')
      ),
      ...Object.keys(playgroundPkgJson.devDependencies || {}).filter((n) =>
        n.startsWith('@alikhalilll/')
      ),
    ])
  );

  await rewriteInternalDeps(playgroundPkgJsonPath, manifest.tarballs, allInternalNames);

  // 4. If some internal modules aren't packed, strip them from nuxt.config so
  // prepare doesn't fail to resolve them, AND delete any consumer-facing file
  // that imports them or relies on their runtime injections (e.g. `$crypto`).
  // Otherwise typecheck fails on stale demo pages that are unrelated to the
  // package under validation.
  const missingModules = allInternalNames.filter((n) => !manifest.tarballs[n]);
  await stripMissingModulesFromNuxtConfig(tmpPlayground, missingModules);
  await stripPackageReferencesFromPlayground(tmpPlayground, missingModules);

  // 5. Install (a fresh, isolated install — no workspace symlinks)
  // `--config.strict-dep-builds=false` quiets pnpm 10's hard-fail on unconfirmed
  // postinstall scripts (esbuild, vue-demi, @parcel/watcher). Their native bits
  // aren't needed for `vue-tsc` / Nuxt's prepare+build to pass — we don't ship
  // the resulting node_modules anywhere, the goal is just to typecheck the
  // tarball's public surface end-to-end.
  console.log(pc.cyan('→') + ' pnpm install (against tarballs)');
  await execa(
    'pnpm',
    ['install', '--ignore-workspace', '--no-frozen-lockfile', '--config.strict-dep-builds=false'],
    {
      cwd: tmpPlayground,
      stdio: 'inherit',
    }
  );

  // 6. nuxi prepare → verify auto-imports → typecheck → build
  await ensureNuxtTypecheckReady(tmpPlayground);

  // The 15-component auto-import gate only makes sense when the whole component
  // set is present (each component package ships its own Nuxt module).
  const includesUi = UI_COMPONENT_PACKAGES.every((p) => picked.includes(p));
  await verifyAutoImports(tmpPlayground, includesUi);

  const childEnv = { ...process.env, PNPM_CONFIG_STRICT_DEP_BUILDS: 'false' };

  console.log(pc.cyan('→') + ' pnpm typecheck (includes type-assertion + auto-import fixtures)');
  await execa('pnpm', ['typecheck'], { cwd: tmpPlayground, stdio: 'inherit', env: childEnv });

  console.log(pc.cyan('→') + ' pnpm build');
  await execa('pnpm', ['build'], { cwd: tmpPlayground, stdio: 'inherit', env: childEnv });

  if (!args.keep) {
    await fs.rm(tmpBase, { recursive: true, force: true });
    await fs.rm(outDir, { recursive: true, force: true });
  } else {
    console.log(pc.dim(`\n  (kept) playground: ${tmpPlayground}`));
    console.log(pc.dim(`  (kept) tarballs:   ${outDir}`));
  }

  console.log('\n' + pc.green('✓') + ' ' + pc.bold('Consumer validation passed.\n'));
}

main().catch((err) => {
  console.error(
    '\n' + pc.red('✗') + ' ' + pc.red(pc.bold('Consumer validation failed:')) + ' ' + err.message
  );
  process.exit(1);
});
