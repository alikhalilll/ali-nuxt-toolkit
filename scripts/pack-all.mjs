#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import minimist from 'minimist';
import { PACKAGES_DIR, PUBLISHABLE_PACKAGES, ROOT } from './release/constants.mjs';
import { run } from './release/exec.mjs';
import { die, info, step, success } from './release/logger.mjs';

/**
 * Build each package and produce a `.tgz` tarball in `packages/<dir>/`.
 * Equivalent to `pnpm pack`, just iterated over the workspace.
 */
async function main() {
  const argv = minimist(process.argv.slice(2), {
    string: ['pkg'],
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

  const outDir = path.join(ROOT, 'artifacts');
  fs.mkdirSync(outDir, { recursive: true });

  for (const dir of packages) {
    const cwd = path.join(PACKAGES_DIR, dir);
    step(`Packing ${dir}`);

    if (!argv['skip-build']) {
      run('pnpm', ['-C', cwd, 'build']);
    }

    run('pnpm', ['-C', cwd, 'pack', '--pack-destination', outDir]);
    success(`Packed ${dir} → ${path.relative(ROOT, outDir)}/`);
  }

  info(`\nTarballs written to ${path.relative(ROOT, outDir)}/`);
}

main().catch((err) => {
  console.error(`\n✖ ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
