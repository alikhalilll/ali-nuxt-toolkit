#!/usr/bin/env node
import path from 'node:path';
import { checkbox, confirm, password, select } from '@inquirer/prompts';
import { parseArgs, validateBump } from './cli.ts';
import {
  BUMP_TYPES,
  DEFAULT_BRANCH,
  DEFAULT_DIST_TAG,
  PUBLISHABLE_PACKAGES,
  ROOT,
} from '../lib/constants.ts';
import { capture } from '../lib/exec.ts';
import {
  commitAll,
  createTag,
  deleteTagLocal,
  ensureGitClean,
  ensureOnBranch,
  pushBranch,
  pushTag,
  tagExists,
} from './git.ts';
import { createGithubRelease, ghAvailable } from './github.ts';
import { die, divider, fail, header, info, step, success, warn } from '../lib/logger.ts';
import { ReleaseProgress, card, type PhaseStatus } from '../lib/progress.ts';
import { writeChangeset, type ChangesetEntry } from './changeset.ts';
import {
  bumpVersion,
  packagePath,
  readPackageJson,
  runPnpm,
  setVersion,
  versionPublished,
} from './package.ts';

/**
 * Ordered phases each package goes through. Drives the per-package progress
 * row and the success/failure markers.
 */
const PHASES = ['bump', 'build', 'publish', 'commit', 'tag'] as const;

async function pickInteractive(cliPackages, cliBump, cliTag) {
  let packages;
  if (cliPackages.length > 0) {
    packages = cliPackages;
  } else {
    // Single- vs multi-select based on the case the user is in: a one-off patch
    // (single) vs a coordinated release (multi) vs everything (all).
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
    cliBump ??
    (await select({
      message: 'How should versions be bumped?',
      choices: BUMP_TYPES.map((t) => ({ name: t, value: t })),
      default: 'patch',
    }));

  const distTag =
    cliTag ??
    (await select({
      message: 'Which dist-tag should be published?',
      choices: [
        {
          name: 'latest',
          value: 'latest',
          description: 'Default install tag — what `npm i <pkg>` resolves to.',
        },
        {
          name: 'stable',
          value: 'stable',
          description: 'Stable release line, parallel to latest.',
        },
        {
          name: 'current',
          value: 'current',
          description: 'Rolling "current" tag for the newest published build.',
        },
      ],
      default: DEFAULT_DIST_TAG,
    }));

  return { packages, bump, distTag };
}

// .npmrc contains `//registry.npmjs.org/:_authToken=${NPM_TOKEN}` — pnpm publish
// fails (and prints noisy warnings on every pnpm invocation) when the env var is
// unset. In interactive runs, prompt for it so users don't need a separately
// exported shell var. CI sets NPM_TOKEN directly and skips this path.
async function ensureNpmToken({ interactive, skipPublish, dryRun }) {
  if (skipPublish || dryRun) return;
  if (process.env.NPM_TOKEN && process.env.NPM_TOKEN.trim() !== '') return;
  if (!interactive) {
    die('NPM_TOKEN is not set. Export it or re-run with --interactive to be prompted.');
  }
  const token = await password({
    message: 'npm publish token (input hidden):',
    mask: '*',
    validate: (v) => (v && v.trim() !== '' ? true : 'Token cannot be empty.'),
  });
  process.env.NPM_TOKEN = token.trim();
  success('NPM_TOKEN captured for this run');
}

async function releasePackage({
  dir,
  bump,
  distTag,
  skipGit,
  skipPublish,
  forceTag,
  dryRun,
  progress,
}) {
  const cwd = packagePath(dir);
  const { data: pkg } = readPackageJson(dir);
  const nextVersion = bumpVersion(pkg.version, bump);
  const previousVersion = pkg.version;

  progress.startItem(dir);
  info(`${pkg.name}: ${previousVersion} → ${nextVersion}`);
  info(`cwd: ${cwd}`);

  if (!forceTag && versionPublished(pkg.name, nextVersion)) {
    progress.setPhase('bump', 'failed');
    die(
      `${pkg.name}@${nextVersion} already exists on npm. Pick a different bump.\n` +
        `  Tip: re-run with --bump minor (or major), or --force-tag if you really mean it.`
    );
  }

  let versionWritten = false;
  let published = false;

  try {
    // 1) Bump version in package.json (unless bump === 'none').
    progress.setPhase('bump', 'running');
    if (bump !== 'none' && !dryRun) {
      setVersion(dir, nextVersion);
      versionWritten = true;
      progress.setPhase('bump', 'done');
    } else if (dryRun) {
      info(`[dry-run] would bump package.json → ${nextVersion}`);
      progress.setPhase('bump', 'skipped');
    } else {
      progress.setPhase('bump', 'skipped');
    }

    // 2) Build.
    progress.setPhase('build', 'running');
    runPnpm(['-C', cwd, 'build']);
    progress.setPhase('build', 'done');

    // 3) Publish.
    if (skipPublish) {
      warn('--skip-publish set; not publishing');
      progress.setPhase('publish', 'skipped');
    } else if (dryRun) {
      info(`[dry-run] would: pnpm publish --tag ${distTag} --no-git-checks --access public`);
      progress.setPhase('publish', 'skipped');
    } else {
      progress.setPhase('publish', 'running');
      runPnpm(['publish', '--tag', distTag, '--no-git-checks', '--access', 'public'], { cwd });
      published = true;
      progress.setPhase('publish', 'done');
    }

    // 4) Git commit + tag.
    const tag = `${pkg.name}@${nextVersion}`;
    if (skipGit) {
      warn('--skip-git set; not committing/tagging');
      progress.setPhase('commit', 'skipped');
      progress.setPhase('tag', 'skipped');
    } else if (dryRun) {
      info(`[dry-run] would: git commit -m "chore(release): ${tag}" && git tag ${tag}`);
      progress.setPhase('commit', 'skipped');
      progress.setPhase('tag', 'skipped');
    } else {
      progress.setPhase('commit', 'running');
      const existed = tagExists(tag);
      if (existed && !forceTag) {
        warn(`Tag ${tag} already exists — skipping tag step (pass --force-tag to overwrite)`);
        progress.setPhase('commit', 'skipped');
        progress.setPhase('tag', 'skipped');
      } else {
        commitAll(`chore(release): ${tag}`);
        progress.setPhase('commit', 'done');
        progress.setPhase('tag', 'running');
        if (existed && forceTag) {
          warn(`Tag ${tag} already exists — overwriting (--force-tag)`);
          deleteTagLocal(tag);
        }
        createTag(tag, `Release ${tag}`, { force: forceTag });
        progress.setPhase('tag', 'done');
      }
    }

    return { name: pkg.name, previousVersion, nextVersion, tag };
  } catch (err) {
    // Mark whichever phase was running as failed (best-effort — we don't know
    // which phase threw; use the earliest pending/running marker).
    for (const phase of PHASES) {
      try {
        progress.setPhase(phase, 'failed');
        break;
      } catch {
        /* phase already settled */
      }
    }
    // If we bumped the version but never published, roll the file back so the
    // working tree isn't left with a phantom bump. If publish succeeded, the
    // version is live on npm — keep it so state matches reality.
    if (versionWritten && !published) {
      try {
        setVersion(dir, previousVersion);
        warn(`Rolled ${pkg.name} package.json back to ${previousVersion}`);
      } catch (rollbackErr) {
        fail(
          `Failed to roll back ${pkg.name} to ${previousVersion}: ${
            rollbackErr instanceof Error ? rollbackErr.message : rollbackErr
          }`
        );
      }
    } else if (versionWritten && published) {
      warn(
        `${pkg.name}@${nextVersion} was published to npm before failure — version not rolled back.`
      );
    }
    throw err;
  }
}

async function main() {
  const { flags, packages: cliPackages, bump: cliBump, distTag: cliTag, branch } = parseArgs();

  validateBump(cliBump);

  header('ali-nuxt-toolkit release');
  if (flags.dryRun) warn('Dry run — nothing will be written or pushed');

  const { packages, bump, distTag } = flags.interactive
    ? await pickInteractive(cliPackages, cliBump, cliTag)
    : { packages: cliPackages, bump: cliBump, distTag: cliTag };

  if (packages.length === 0) {
    die('No packages selected. Pass --pkg <name> (comma-separated), --all, or --interactive.');
  }
  if (!bump) {
    die(`No bump type specified. Pass --bump <${BUMP_TYPES.join('|')}> or --interactive.`);
  }
  validateBump(bump);

  step('Pre-flight');
  if (!flags.skipGit && !flags.dryRun) {
    ensureGitClean();
    success('Working tree clean');
    ensureOnBranch(branch || DEFAULT_BRANCH);
    success(`On branch ${branch || DEFAULT_BRANCH}`);
  } else {
    info(`Skipping git checks (skipGit=${flags.skipGit}, dryRun=${flags.dryRun})`);
  }

  await ensureNpmToken({
    interactive: flags.interactive,
    skipPublish: flags.skipPublish,
    dryRun: flags.dryRun,
  });

  // Build the per-package plan up-front so the confirmation card shows real
  // version transitions — not just bump types. Catches "already published" too.
  const plan = packages.map((dir) => {
    const { data: pkg } = readPackageJson(dir);
    const next = bumpVersion(pkg.version, bump);
    return {
      dir,
      name: pkg.name,
      previousVersion: pkg.version,
      nextVersion: next,
      alreadyPublished: !flags.forceTag && versionPublished(pkg.name, next),
    };
  });

  card('Release plan', [
    `bump:     ${bump}`,
    `tag:      ${distTag}`,
    `branch:   ${branch}`,
    `npm user: ${capture('npm', ['whoami']) || '(none)'}`,
    '',
    ...plan.map(
      (p) =>
        `  ${p.name.padEnd(38)} ${p.previousVersion} → ${p.nextVersion}` +
        (p.alreadyPublished ? '  ⚠ already on npm' : '')
    ),
  ]);

  const alreadyOnNpm = plan.filter((p) => p.alreadyPublished);
  if (alreadyOnNpm.length && !flags.forceTag) {
    die(
      `These versions are already on npm — bump them first or pass --force-tag:\n  - ` +
        alreadyOnNpm.map((p) => `${p.name}@${p.nextVersion}`).join('\n  - ')
    );
  }

  if (flags.interactive && !flags.dryRun) {
    const ok = await confirm({ message: 'Proceed with release?', default: true });
    if (!ok) die('Aborted.');
  }

  // Auto-write a Changesets entry BEFORE the per-package loop so the first
  // package's `git add .` includes it. Documents the release for CHANGELOG
  // generation without making the release flow depend on the Changesets
  // version-bump state machine.
  const changesetEntries: ChangesetEntry[] = plan
    .filter((p) => bump !== 'none')
    .map((p) => ({ name: p.name, bump: bump as 'major' | 'minor' | 'patch' }));
  if (changesetEntries.length) {
    const summary = `Release ${plan.map((p) => `${p.name}@${p.nextVersion}`).join(', ')}`;
    const written = writeChangeset(changesetEntries, summary, { dryRun: flags.dryRun });
    if (written) {
      success(
        `${flags.dryRun ? '[dry-run] would write' : 'Wrote'} changeset: ${path.relative(ROOT, written)}`
      );
    }
  }

  const progress = new ReleaseProgress(packages, [...PHASES]);
  const results = [];
  try {
    for (const dir of packages) {
      results.push(
        await releasePackage({
          dir,
          bump,
          distTag,
          skipGit: flags.skipGit,
          skipPublish: flags.skipPublish,
          forceTag: flags.forceTag,
          dryRun: flags.dryRun,
          progress,
        })
      );
    }
  } finally {
    progress.finish();
  }

  // Push at the end so a partial failure doesn't leave half-pushed state.
  if (!flags.skipGit && !flags.dryRun && results.some((r) => r.tag && tagExists(r.tag))) {
    step('Push');
    pushBranch(branch || DEFAULT_BRANCH);
    success(`Pushed ${branch || DEFAULT_BRANCH}`);
    for (const r of results) {
      if (tagExists(r.tag)) {
        pushTag(r.tag, { force: flags.forceTag });
        success(`Pushed ${r.tag}${flags.forceTag ? ' (forced)' : ''}`);
      }
    }

    if (!flags.skipGithub) {
      step('GitHub Releases');
      const gh = ghAvailable();
      if (!gh.ok) {
        warn(`Skipping GitHub Releases: ${gh.reason}`);
        info('Install with: brew install gh  (then: gh auth login)');
        info('Or pass --skip-github to silence this.');
      } else {
        // `latest` and `stable` are full releases; any other tag (e.g. `current`) is a prerelease.
        const isPrerelease = !['latest', 'stable'].includes(distTag);
        for (const r of results) {
          if (!tagExists(r.tag)) continue;
          try {
            createGithubRelease(r.tag, {
              title: r.tag,
              prerelease: isPrerelease,
              force: flags.forceTag,
            });
            success(`Created release ${r.tag}${flags.forceTag ? ' (forced)' : ''}`);
          } catch (err) {
            warn(`Failed to create release ${r.tag}: ${err instanceof Error ? err.message : err}`);
          }
        }
      }
    }
  } else if (flags.dryRun && !flags.skipGithub) {
    step('GitHub Releases');
    for (const r of results) {
      info(`[dry-run] would: gh release create ${r.tag} --title ${r.tag} --generate-notes`);
    }
  }

  card(
    `✓ Released ${results.length} package${results.length === 1 ? '' : 's'}`,
    results.map((r) => `  ${r.name.padEnd(38)} ${r.previousVersion} → ${r.nextVersion}`)
  );
  divider();
  info('Next steps:');
  info('  • CHANGELOG: run `pnpm changeset version` to regenerate from .changeset/');
  info(
    '  • Verify on npm: ' + results.map((r) => `https://npmjs.com/package/${r.name}`).join(', ')
  );
}

main().catch((err) => {
  fail(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
