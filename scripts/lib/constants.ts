import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Repo root = two levels up from scripts/lib/. */
export const ROOT = path.resolve(here, '..', '..');
export const PACKAGES_DIR = path.join(ROOT, 'packages');

/** Directory names under `packages/` that are publishable. `a-ui-base` is intentionally
 *  excluded — it's an internal-only foundation, bundled into every component's dist. */
export const PUBLISHABLE_PACKAGES = [
  'api-provider',
  'crypto',
  'auto-middleware',
  'a-input',
  'a-popover',
  'a-drawer',
  'a-responsive-popover',
  'a-tel-input',
] as const;
export type PublishablePackage = (typeof PUBLISHABLE_PACKAGES)[number];

/**
 * Publishable packages nested under `packages/ui-components/`, mapping the npm
 * name (kebab, what consumers import) → on-disk folder name. Component folders
 * are PascalCase (`ATelInput`) while the package stays `@alikhalilll/a-tel-input`.
 * `AUiBase` is intentionally absent — it's internal-only, bundled into each.
 */
const UI_COMPONENT_DIRS: Record<string, string> = {
  'a-input': 'AInput',
  'a-popover': 'APopover',
  'a-drawer': 'ADrawer',
  'a-responsive-popover': 'AResponsivePopover',
  'a-tel-input': 'ATelInput',
};

/** Absolute directory for a publishable package, accounting for the nested ui-components set. */
export function packageDir(name: string): string {
  const nested = UI_COMPONENT_DIRS[name];
  return nested ? path.join(PACKAGES_DIR, 'ui-components', nested) : path.join(PACKAGES_DIR, name);
}

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
  'a-input': ['./styles.css'],
  'a-popover': ['./styles.css'],
  'a-drawer': ['./styles.css'],
  'a-responsive-popover': ['./styles.css'],
  'a-tel-input': ['./styles.css'],
};

export const BUMP_TYPES = ['patch', 'minor', 'major', 'prerelease', 'none'] as const;
export type BumpType = (typeof BUMP_TYPES)[number];

export const DEFAULT_BRANCH = 'master';

export const DEFAULT_DIST_TAG = 'latest';
