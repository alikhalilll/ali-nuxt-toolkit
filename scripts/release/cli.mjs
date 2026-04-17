import minimist from 'minimist';
import {
  BUMP_TYPES,
  DEFAULT_BRANCH,
  DEFAULT_DIST_TAG,
  PUBLISHABLE_PACKAGES,
} from './constants.mjs';
import { die } from './logger.mjs';

export function parseArgs(argv = process.argv.slice(2)) {
  const parsed = minimist(argv, {
    string: ['pkg', 'bump', 'tag', 'branch'],
    boolean: ['all', 'interactive', 'dry-run', 'skip-git', 'skip-publish'],
    alias: {
      i: 'interactive',
      d: 'dry-run',
    },
    default: {
      interactive: false,
      all: false,
      'dry-run': false,
      'skip-git': false,
      'skip-publish': false,
      tag: DEFAULT_DIST_TAG,
      branch: DEFAULT_BRANCH,
    },
  });

  const flags = {
    interactive: !!parsed.interactive,
    dryRun: !!parsed['dry-run'],
    skipGit: !!parsed['skip-git'],
    skipPublish: !!parsed['skip-publish'],
    all: !!parsed.all,
  };

  const packages = resolvePackages(parsed);
  const bump = parsed.bump ?? null;
  const distTag = parsed.tag || DEFAULT_DIST_TAG;
  const branch = parsed.branch || DEFAULT_BRANCH;

  return { flags, packages, bump, distTag, branch };
}

function resolvePackages(parsed) {
  if (parsed.all) return [...PUBLISHABLE_PACKAGES];
  if (!parsed.pkg) return [];
  const names = String(parsed.pkg)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const n of names) {
    if (!PUBLISHABLE_PACKAGES.includes(n)) {
      die(
        `Unknown package: "${n}". Valid names: ${PUBLISHABLE_PACKAGES.join(', ')} (or pass --all).`
      );
    }
  }
  return names;
}

export function validateBump(bump) {
  if (bump == null) return;
  if (!BUMP_TYPES.includes(bump)) {
    die(`Unknown bump type: "${bump}". Must be one of: ${BUMP_TYPES.join(', ')}.`);
  }
}
