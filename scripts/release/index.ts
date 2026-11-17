#!/usr/bin/env node
/**
 * Prep a release: pick packages + bump → write a Changesets entry → commit → push.
 *
 * The actual version bump, build, publish, tag, and GitHub Release are performed
 * by `.github/workflows/release.yml` via `changesets/action@v1`:
 *   1. This script lands a `.changeset/*.md` file on master.
 *   2. The action opens (or updates) a "chore(release): version packages" PR
 *      with real package.json + CHANGELOG diffs computed from the changeset.
 *   3. Merging that PR triggers CI to `pnpm changeset publish` with SLSA
 *      provenance (requires OIDC — only works from GitHub Actions, not laptops).
 *
 * The interactive picker, plan preview, and the already-published guard are kept
 * because they're genuinely useful before you commit a changeset. Everything
 * else — bumping package.json, publishing, tagging — is CI's job now.
 */
import path from 'node:path';
import { confirm, checkbox, select } from '@inquirer/prompts';
import { parseArgs, validateBump } from './cli.ts';
import { DEFAULT_BRANCH, PUBLISHABLE_PACKAGES, ROOT } from '../lib/constants.ts';
import { capture } from '../lib/exec.ts';
import { commitAll, ensureGitClean, ensureOnBranch, pushBranch } from './git.ts';
import { die, divider, fail, header, info, step, success, warn } from '../lib/logger.ts';
import { card } from '../lib/progress.ts';
import { writeChangeset, type ChangesetEntry } from './changeset.ts';
import { bumpVersion, readPackageJson, versionPublished } from './package.ts';

/** Bumps the Changesets state machine understands — no `prerelease`, no `none`. */
const PREP_BUMPS = ['patch', 'minor', 'major'] as const;
type PrepBump = (typeof PREP_BUMPS)[number];

async function pickInteractive(cliPackages: string[], cliBump: string | null) {
  let packages: string[];
  if (cliPackages.length > 0) {
    packages = cliPackages;
  } else {
    const scope = await select({
      message: 'Release scope?',
      choices: [
        { name: 'Single package', value: 'single', description: 'Pick exactly one package.' },
        {
          name: 'Multiple packages',
          value: 'multi',
          description: 'Tick several packages to release together.',
        },
        {
          name: 'All packages',
          value: 'all',
          description: `Release all ${PUBLISHABLE_PACKAGES.length} publishable packages.`,
        },
      ],
      default: 'single',
    });

    if (scope === 'all') {
      packages = [...PUBLISHABLE_PACKAGES];
    } else if (scope === 'single') {
      const one = await select({
        message: 'Which package?',
        choices: PUBLISHABLE_PACKAGES.map((name) => ({ name, value: name })),
      });
      packages = [one];
    } else {
      packages = await checkbox({
        message: 'Which packages should be released?',
        choices: PUBLISHABLE_PACKAGES.map((name) => ({ name, value: name })),
        validate: (arr) => (arr.length > 0 ? true : 'Pick at least one package.'),
      });
    }
  }

  const bump =
    (cliBump as PrepBump | null) ??
    (await select<PrepBump>({
      message: 'How should versions be bumped?',
      choices: PREP_BUMPS.map((t) => ({ name: t, value: t })),
      default: 'patch',
    }));

  return { packages, bump };
}

async function main() {
  const { flags, packages: cliPackages, bump: cliBump, branch } = parseArgs();

  validateBump(cliBump);

  header('ali-nuxt-toolkit release — prep');
  if (flags.dryRun) warn('Dry run — nothing will be written, committed, or pushed');

  const { packages, bump } = flags.interactive
    ? await pickInteractive(cliPackages, cliBump)
    : { packages: cliPackages, bump: cliBump as PrepBump | null };

  if (packages.length === 0) {
    die('No packages selected. Pass --pkg <name> (comma-separated), --all, or --interactive.');
  }
  if (!bump) {
    die(`No bump type specified. Pass --bump <${PREP_BUMPS.join('|')}> or --interactive.`);
  }
  if (!(PREP_BUMPS as readonly string[]).includes(bump)) {
    die(`Bump "${bump}" is not valid in prep mode. Use one of: ${PREP_BUMPS.join(', ')}.`);
  }

  step('Pre-flight');
  if (!flags.dryRun) {
    ensureGitClean();
    success('Working tree clean');
    ensureOnBranch(branch || DEFAULT_BRANCH);
    success(`On branch ${branch || DEFAULT_BRANCH}`);
  } else {
    info(`Skipping git checks (dryRun=${flags.dryRun})`);
  }

  // Build the plan up-front so the confirmation shows real version transitions
  // and catches "target version already on npm" before we touch anything.
  const plan = packages.map((dir) => {
    const { data: pkg } = readPackageJson(dir);
    const next = bumpVersion(pkg.version, bump);
    return {
      dir,
      name: pkg.name,
      previousVersion: pkg.version,
      nextVersion: next,
      alreadyPublished: versionPublished(pkg.name, next),
    };
  });

  const npmUser = capture('npm', ['whoami']);
  card('Release plan (prep)', [
    `bump:     ${bump}`,
    `branch:   ${branch}`,
    `npm user: ${npmUser || '(not logged in locally — CI will publish)'}`,
    '',
    ...plan.map(
      (p) =>
        `  ${p.name.padEnd(38)} ${p.previousVersion} → ${p.nextVersion}` +
        (p.alreadyPublished ? '  ⚠ already on npm' : '')
    ),
  ]);

  const alreadyOnNpm = plan.filter((p) => p.alreadyPublished);
  if (alreadyOnNpm.length) {
    die(
      `These target versions are already on npm — bump further or the release PR will no-op:\n  - ` +
        alreadyOnNpm.map((p) => `${p.name}@${p.nextVersion}`).join('\n  - ')
    );
  }

  if (flags.interactive && !flags.dryRun) {
    const ok = await confirm({ message: 'Write changeset, commit, and push?', default: true });
    if (!ok) die('Aborted.');
  }

  // Write a single changeset covering every package in the plan. On merge of
  // the release PR that this changeset triggers, Changesets will bump each
  // package's version + regenerate its CHANGELOG from this file's summary.
  const entries: ChangesetEntry[] = plan.map((p) => ({ name: p.name, bump }));
  const summary = `Release ${plan.map((p) => `${p.name}@${p.nextVersion}`).join(', ')}`;

  step('Changeset');
  const written = writeChangeset(entries, summary, { dryRun: flags.dryRun });
  if (!written) die('No changeset written — check that .changeset/ exists and entries are valid.');
  const relPath = path.relative(ROOT, written);
  success(`${flags.dryRun ? '[dry-run] would write' : 'Wrote'} ${relPath}`);

  if (flags.dryRun) {
    step('Dry run — summary');
    info(`[dry-run] would: git add ${relPath} && git commit -m "chore(changesets): ${summary}"`);
    info(`[dry-run] would: git push origin ${branch || DEFAULT_BRANCH}`);
    return;
  }

  step('Commit + push');
  commitAll(`chore(changesets): ${summary}`);
  success(`Committed ${relPath}`);
  pushBranch(branch || DEFAULT_BRANCH);
  success(`Pushed ${branch || DEFAULT_BRANCH}`);

  card(
    `✓ Prepped ${plan.length} package${plan.length === 1 ? '' : 's'}`,
    plan.map((p) => `  ${p.name.padEnd(38)} ${p.previousVersion} → ${p.nextVersion}`)
  );
  divider();
  info('What happens next:');
  info('  • GitHub Actions opens / updates the "chore(release): version packages" PR.');
  info('  • Review the PR: it will show real package.json + CHANGELOG diffs.');
  info('  • Merge the PR to publish to npm with SLSA provenance (via CI OIDC).');
  info('  • Changesets action creates GitHub Releases for each tag automatically.');
}

main().catch((err) => {
  if (err instanceof Error && err.name === 'ExitPromptError') {
    process.exit(130);
  }
  fail(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
