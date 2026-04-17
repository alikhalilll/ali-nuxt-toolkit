#!/usr/bin/env node
import { checkbox, confirm, select } from '@inquirer/prompts';
import { parseArgs, validateBump } from './cli.mjs';
import {
  BUMP_TYPES,
  DEFAULT_BRANCH,
  DEFAULT_DIST_TAG,
  PUBLISHABLE_PACKAGES,
  ROOT,
} from './constants.mjs';
import { capture } from './exec.mjs';
import {
  commitAll,
  createTag,
  deleteTagLocal,
  ensureGitClean,
  ensureOnBranch,
  pushBranch,
  pushTag,
  tagExists,
} from './git.mjs';
import { createGithubRelease, ghAvailable } from './github.mjs';
import { die, divider, fail, header, info, step, success, warn } from './logger.mjs';
import {
  bumpVersion,
  packagePath,
  readPackageJson,
  runPnpm,
  setVersion,
  versionPublished,
} from './package.mjs';

async function pickInteractive(cliPackages, cliBump, cliTag) {
  const packages =
    cliPackages.length > 0
      ? cliPackages
      : await checkbox({
          message: 'Which packages should be released?',
          choices: PUBLISHABLE_PACKAGES.map((name) => ({ name, value: name })),
          validate: (arr) => (arr.length > 0 ? true : 'Pick at least one package.'),
        });

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
        { name: 'latest', value: 'latest' },
        { name: 'next', value: 'next' },
        { name: 'beta', value: 'beta' },
      ],
      default: DEFAULT_DIST_TAG,
    }));

  return { packages, bump, distTag };
}

async function releasePackage({ dir, bump, distTag, skipGit, skipPublish, forceTag, dryRun }) {
  const cwd = packagePath(dir);
  const { data: pkg } = readPackageJson(dir);
  const nextVersion = bumpVersion(pkg.version, bump);
  const previousVersion = pkg.version;

  step(`Releasing ${pkg.name}`);
  info(`version: ${previousVersion} → ${nextVersion}`);
  info(`cwd:     ${cwd}`);

  if (!forceTag && versionPublished(pkg.name, nextVersion)) {
    die(`${pkg.name}@${nextVersion} already exists on npm. Pick a different bump.`);
  }

  let versionWritten = false;
  let published = false;

  try {
    // 1) Bump version in package.json (unless bump === 'none').
    if (bump !== 'none' && !dryRun) {
      setVersion(dir, nextVersion);
      versionWritten = true;
      success(`Wrote package.json with ${nextVersion}`);
    } else if (dryRun) {
      info(`[dry-run] would bump package.json → ${nextVersion}`);
    }

    // 2) Build.
    step('Build');
    runPnpm(['-C', cwd, 'build']);
    success('Build complete');

    // 3) Publish.
    if (skipPublish) {
      warn('--skip-publish set; not publishing');
    } else if (dryRun) {
      info(`[dry-run] would: pnpm publish --tag ${distTag} --no-git-checks --access public`);
    } else {
      step('Publish to npm');
      runPnpm(['publish', '--tag', distTag, '--no-git-checks', '--access', 'public'], { cwd });
      published = true;
      success(`Published ${pkg.name}@${nextVersion} (tag: ${distTag})`);
    }

    // 4) Git commit + tag.
    const tag = `${pkg.name}@${nextVersion}`;
    if (skipGit) {
      warn('--skip-git set; not committing/tagging');
    } else if (dryRun) {
      info(`[dry-run] would: git commit -m "chore(release): ${tag}" && git tag ${tag}`);
    } else {
      step('Git');
      const existed = tagExists(tag);
      if (existed && !forceTag) {
        warn(`Tag ${tag} already exists — skipping tag step (pass --force-tag to overwrite)`);
      } else {
        commitAll(`chore(release): ${tag}`);
        if (existed && forceTag) {
          warn(`Tag ${tag} already exists — overwriting (--force-tag)`);
          deleteTagLocal(tag);
        }
        createTag(tag, `Release ${tag}`, { force: forceTag });
        success(`Committed + tagged ${tag}${forceTag ? ' (forced)' : ''}`);
      }
    }

    return { name: pkg.name, previousVersion, nextVersion, tag };
  } catch (err) {
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

  info(`packages: ${packages.join(', ')}`);
  info(`bump:     ${bump}`);
  info(`tag:      ${distTag}`);
  info(`branch:   ${branch}`);
  info(`cwd:      ${ROOT}`);

  if (flags.interactive && !flags.dryRun) {
    const ok = await confirm({ message: 'Proceed?', default: true });
    if (!ok) die('Aborted.');
  }

  const results = [];
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
      })
    );
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
        const isPrerelease = distTag !== 'latest';
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

  header('Summary');
  for (const r of results) {
    info(`${r.name}: ${r.previousVersion} → ${r.nextVersion}  (${r.tag})`);
  }
  divider();
  const npmWhoami = capture('npm', ['whoami']);
  if (npmWhoami) info(`npm user: ${npmWhoami}`);
  success('Done.');
}

main().catch((err) => {
  fail(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
