#!/usr/bin/env node
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import minimist from 'minimist';
import { PACKAGES_DIR, PUBLISHABLE_PACKAGES, ROOT } from '../lib/constants.ts';
import { run } from '../lib/exec.ts';
import { die, info, step, success } from '../lib/logger.ts';

/**
 * Build each package and produce a `.tgz` tarball.
 *
 * Defaults:
 *   - outDir: <ROOT>/artifacts (override with `--outDir <abs-or-rel-path>`)
 *   - skip-build: false       (`--skip-build` to skip the build step)
 *
 * Also writes a `manifest.json` next to the tarballs, mapping package name →
 * { pkgDir, version, filename, path }. Consumer-validate uses this to wire the
 * built tarballs into a temp playground without re-resolving filenames.
 */
async function main() {
  const argv = minimist(process.argv.slice(2), {
    string: ['pkg', 'outDir'],
    boolean: ['all', 'skip-build'],
    default: { all: false, 'skip-build': false },
  });

  const packages = argv.all
    ? [...PUBLISHABLE_PACKAGES]
    : argv.pkg
      ? String(argv.pkg)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  if (packages.length === 0) {
    die('No packages selected. Pass --pkg <name>[,<name>...] or --all.');
  }

  const outDir = argv.outDir ? path.resolve(ROOT, argv.outDir) : path.join(ROOT, 'artifacts');
  fs.mkdirSync(outDir, { recursive: true });

  const manifest = {
    createdAt: new Date().toISOString(),
    outDir,
    tarballs: {},
  };

  for (const dir of packages) {
    const cwd = path.join(PACKAGES_DIR, dir);
    step(`Packing ${dir}`);

    if (!argv['skip-build']) {
      run('pnpm', ['-C', cwd, 'build']);
    }

    const before = new Set(fs.readdirSync(outDir));
    run('pnpm', ['-C', cwd, 'pack', '--pack-destination', outDir]);
    const after = fs.readdirSync(outDir);

    const created = after.filter((f) => !before.has(f) && f.endsWith('.tgz'));
    if (!created.length) {
      die(`pnpm pack did not create a .tgz for ${dir}`);
    }

    const pkgJson = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
    // pnpm names tarballs `<scope-name>-<version>.tgz` (scope @ stripped, / → -).
    const expectedPrefix = `${pkgJson.name.replace(/^@/, '').replace(/\//g, '-')}-${pkgJson.version}`;
    const filename = created.find((f) => f.startsWith(expectedPrefix)) || created.sort().at(-1);

    manifest.tarballs[pkgJson.name] = {
      pkgDir: dir,
      version: pkgJson.version,
      filename,
      path: path.join(outDir, filename),
    };

    success(`Packed ${dir} → ${path.relative(ROOT, outDir)}/${filename}`);
  }

  const manifestPath = path.join(outDir, 'manifest.json');
  await fsp.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  info(`\nTarballs:  ${path.relative(ROOT, outDir)}/`);
  info(`Manifest:  ${path.relative(ROOT, manifestPath)}`);
}

main().catch((err) => {
  console.error(`\n✖ ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
