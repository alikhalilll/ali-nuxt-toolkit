import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Repo root = two levels up from scripts/release/. */
export const ROOT = path.resolve(here, '..', '..');
export const PACKAGES_DIR = path.join(ROOT, 'packages');

/** Directory names under `packages/` that are publishable. */
export const PUBLISHABLE_PACKAGES = ['api-provider', 'crypto', 'auto-middleware'];

export const BUMP_TYPES = ['patch', 'minor', 'major', 'prerelease', 'none'];

export const DEFAULT_BRANCH = 'master';

export const DEFAULT_DIST_TAG = 'latest';
