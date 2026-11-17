import minimist from 'minimist';
import {
  BUMP_TYPES,
  DEFAULT_BRANCH,
  PUBLISHABLE_PACKAGES,
  type BumpType,
  type PublishablePackage,
} from '../lib/constants.ts';
import { die } from '../lib/logger.ts';

export type ReleaseArgs = {
  flags: { interactive: boolean; dryRun: boolean; all: boolean };
  packages: PublishablePackage[];
  bump: BumpType | null;
  branch: string;
};

export function parseArgs(argv: string[] = process.argv.slice(2)): ReleaseArgs {
  const parsed = minimist(argv, {
    string: ['pkg', 'bump', 'branch'],
    boolean: ['all', 'interactive', 'dry-run'],
    alias: { i: 'interactive', d: 'dry-run' },
    default: {
      interactive: false,
      all: false,
      'dry-run': false,
      branch: DEFAULT_BRANCH,
    },
  });

  const flags = {
    interactive: !!parsed.interactive,
    dryRun: !!parsed['dry-run'],
    all: !!parsed.all,
  };

  return {
    flags,
    packages: resolvePackages(parsed),
    bump: (parsed.bump as BumpType | undefined) ?? null,
    branch: (parsed.branch as string) || DEFAULT_BRANCH,
  };
}

function resolvePackages(parsed: minimist.ParsedArgs): PublishablePackage[] {
  if (parsed.all) return [...PUBLISHABLE_PACKAGES];
  if (!parsed.pkg) return [];
  const names = String(parsed.pkg)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const n of names) {
    if (!(PUBLISHABLE_PACKAGES as readonly string[]).includes(n)) {
      die(
        `Unknown package: "${n}". Valid names: ${PUBLISHABLE_PACKAGES.join(', ')} (or pass --all).`
      );
    }
  }
  return names as PublishablePackage[];
}

export function validateBump(bump: string | null): void {
  if (bump == null) return;
  if (!(BUMP_TYPES as readonly string[]).includes(bump)) {
    die(`Unknown bump type: "${bump}". Must be one of: ${BUMP_TYPES.join(', ')}.`);
  }
}
