#!/usr/bin/env node
/**
 * dist-validate.ts
 *
 * Single CLI entry that drives `runDistValidation` against any publishable
 * package — replaces the eight near-identical thin wrappers that used to sit
 * under `packages/<name>/scripts/validate/`. Per-package config (`attw` ignore
 * lists, etc.) lives in `scripts/lib/constants.ts`.
 *
 * Usage:
 *   tsx scripts/validate/dist-validate.ts --pkg a-tel-input
 *   tsx scripts/validate/dist-validate.ts --pkg a-tel-input,crypto
 *   tsx scripts/validate/dist-validate.ts --all
 *
 * Wired into each package via `scripts.validate-dist` in `package.json`:
 *   "validate-dist": "tsx ../../scripts/validate/dist-validate.ts --pkg a-tel-input"
 */
import path from 'node:path';
import minimist from 'minimist';
import { runDistValidation } from '../lib/validate-dist.ts';
import {
  ATTW_IGNORE_NO_RESOLUTION,
  packageDir,
  PUBLISHABLE_PACKAGES,
  type PublishablePackage,
} from '../lib/constants.ts';

const args = minimist(process.argv.slice(2), {
  string: ['pkg'],
  boolean: ['all'],
  default: { all: false },
});

function pickPkgs(): PublishablePackage[] {
  if (args.all) return [...PUBLISHABLE_PACKAGES];
  if (args.pkg) {
    const names = String(args.pkg)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const n of names) {
      if (!PUBLISHABLE_PACKAGES.includes(n as PublishablePackage)) {
        throw new Error(
          `Unknown package "${n}". Expected one of: ${PUBLISHABLE_PACKAGES.join(', ')}`
        );
      }
    }
    return names as PublishablePackage[];
  }
  throw new Error('dist-validate: pass --pkg <name> or --all');
}

const picked = pickPkgs();
for (const name of picked) {
  await runDistValidation({
    pkgRoot: packageDir(name),
    ignoreNoResolutionEntrypoints: ATTW_IGNORE_NO_RESOLUTION[name],
  });
}
