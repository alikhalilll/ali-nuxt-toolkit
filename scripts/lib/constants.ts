import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Repo root = two levels up from scripts/lib/. */
export const ROOT = path.resolve(here, '..', '..');
export const PACKAGES_DIR = path.join(ROOT, 'packages');

/** Directory names under `packages/` that are publishable. */
export const PUBLISHABLE_PACKAGES = ['api-provider', 'crypto', 'auto-middleware', 'ui'] as const;
export type PublishablePackage = (typeof PUBLISHABLE_PACKAGES)[number];

/**
 * Per-package `attw` ignore lists for `runDistValidation`. Side-effect-only
 * subpaths (CSS, etc.) have no type counterpart — attw flags them as
 * `NoResolution` which is the correct behavior for the package but a false
 * positive for the gate. Encode the exceptions here rather than in per-package
 * wrapper scripts.
 */
export const ATTW_IGNORE_NO_RESOLUTION: Record<PublishablePackage, string[]> = {
  'api-provider': [],
  'auto-middleware': [],
  crypto: [],
  ui: ['./styles.css', './assets/styles.css'],
};

export const BUMP_TYPES = ['patch', 'minor', 'major', 'prerelease', 'none'] as const;
export type BumpType = (typeof BUMP_TYPES)[number];

export const DEFAULT_BRANCH = 'master';

export const DEFAULT_DIST_TAG = 'latest';
