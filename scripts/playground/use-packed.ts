#!/usr/bin/env node
/**
 * playground-use-packed.mjs
 *
 * Switches `playgrounds/nuxt` between two consumption modes:
 *
 *   default            workspace:* symlinks (HMR-friendly dev loop)
 *   --use-packed       file:.tarballs/<pkg>-<ver>.tgz (consumes built dist)
 *
 * Use --use-packed to reproduce consumer-only bugs in the actual browser dev
 * server — auto-import wiring, type-resolution, CSS bundling, etc. — exactly
 * as a published consumer would see them. After running, `pnpm play` boots
 * Nuxt against the tarballs.
 *
 * Use --restore to go back to workspace:* and clean up tarballs/lockfile.
 *
 * Usage:
 *   node scripts/playground-use-packed.mjs --use-packed   # pack + swap + install
 *   node scripts/playground-use-packed.mjs --restore      # back to workspace:*
 */
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';
import minimist from 'minimist';
import pc from 'picocolors';
import { PUBLISHABLE_PACKAGES, ROOT } from '../lib/constants.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLAYGROUND_DIR = path.join(ROOT, 'playgrounds', 'nuxt');
const TARBALL_DIR = path.join(PLAYGROUND_DIR, '.tarballs');
const PLAYGROUND_PKG = path.join(PLAYGROUND_DIR, 'package.json');
const PLAYGROUND_LOCK = path.join(PLAYGROUND_DIR, 'pnpm-lock.yaml');
const PLAYGROUND_NM = path.join(PLAYGROUND_DIR, 'node_modules');

const INTERNAL_PREFIX = '@alikhalilll/';

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readJson(p) {
  return JSON.parse(await fs.readFile(p, 'utf8'));
}

async function writeJson(p, value) {
  await fs.writeFile(p, JSON.stringify(value, null, 2) + '\n');
}

function depSections() {
  return ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
}

/**
 * Pack every publishable package into PLAYGROUND/.tarballs/ and return the
 * manifest (name → { filename, version, path }).
 */
async function packAllIntoPlayground() {
  await fs.rm(TARBALL_DIR, { recursive: true, force: true });
  await fs.mkdir(TARBALL_DIR, { recursive: true });

  const packArgs = [
    'tsx',
    path.join(__dirname, '..', 'pack', 'pack-all.ts'),
    '--all',
    '--outDir',
    TARBALL_DIR,
  ];
  console.log(pc.cyan('→') + ' Packing ' + pc.bold(PUBLISHABLE_PACKAGES.join(', ')));
  await execa(packArgs[0], packArgs.slice(1), { stdio: 'inherit', cwd: ROOT });

  const manifest = await readJson(path.join(TARBALL_DIR, 'manifest.json'));
  return manifest.tarballs;
}

async function rewriteToFileDeps(tarballs) {
  const pkg = await readJson(PLAYGROUND_PKG);
  let changed = 0;

  for (const section of depSections()) {
    const deps = pkg[section];
    if (!deps) continue;
    for (const [name, spec] of Object.entries(deps)) {
      if (!name.startsWith(INTERNAL_PREFIX)) continue;
      const t = tarballs[name];
      if (!t) {
        console.log(
          pc.yellow('  !') +
            ` ${name} is in package.json but wasn't packed — leaving spec "${spec}" alone`
        );
        continue;
      }
      const next = `file:./.tarballs/${t.filename}`;
      if (deps[name] !== next) {
        deps[name] = next;
        changed++;
      }
    }
  }

  await writeJson(PLAYGROUND_PKG, pkg);
  console.log(
    pc.green('✓') +
      ` Rewrote ${changed} dep(s) in ${path.relative(ROOT, PLAYGROUND_PKG)} → file:./.tarballs/...`
  );
}

async function rewriteToWorkspaceDeps() {
  const pkg = await readJson(PLAYGROUND_PKG);
  let changed = 0;

  for (const section of depSections()) {
    const deps = pkg[section];
    if (!deps) continue;
    for (const [name, spec] of Object.entries(deps)) {
      if (!name.startsWith(INTERNAL_PREFIX)) continue;
      if (spec === 'workspace:*') continue;
      deps[name] = 'workspace:*';
      changed++;
    }
  }

  await writeJson(PLAYGROUND_PKG, pkg);
  console.log(
    pc.green('✓') +
      ` Restored ${changed} dep(s) in ${path.relative(ROOT, PLAYGROUND_PKG)} → workspace:*`
  );
}

/**
 * Install in --ignore-workspace mode so pnpm resolves the file: tarballs
 * instead of symlinking back into packages/. This produces a local lockfile +
 * node_modules under playgrounds/nuxt/ — both are torn down by --restore.
 */
async function installAgainstTarballs() {
  console.log(pc.cyan('→') + ' pnpm install (--ignore-workspace, against tarballs)');
  await execa(
    'pnpm',
    ['install', '--ignore-workspace', '--no-frozen-lockfile', '--config.strict-dep-builds=false'],
    { cwd: PLAYGROUND_DIR, stdio: 'inherit' }
  );
}

async function restoreWorkspaceInstall() {
  console.log(pc.cyan('→') + ' Cleaning playground-local install artifacts');
  await fs.rm(TARBALL_DIR, { recursive: true, force: true });
  await fs.rm(PLAYGROUND_LOCK, { force: true });
  await fs.rm(PLAYGROUND_NM, { recursive: true, force: true });

  console.log(pc.cyan('→') + ' pnpm install (root workspace)');
  await execa('pnpm', ['install'], { cwd: ROOT, stdio: 'inherit' });
}

function detectMode() {
  const pkg = JSON.parse(fsSync.readFileSync(PLAYGROUND_PKG, 'utf8'));
  for (const section of depSections()) {
    const deps = pkg[section];
    if (!deps) continue;
    for (const [name, spec] of Object.entries(deps)) {
      if (!name.startsWith(INTERNAL_PREFIX)) continue;
      if (spec.startsWith('file:')) return 'packed';
    }
  }
  return 'workspace';
}

async function main() {
  const args = minimist(process.argv.slice(2), {
    boolean: ['use-packed', 'restore'],
    default: { 'use-packed': false, restore: false },
  });

  if (args['use-packed'] && args.restore) {
    console.error(pc.red('✖') + ' Pass either --use-packed or --restore, not both.');
    process.exit(1);
  }

  if (!args['use-packed'] && !args.restore) {
    const mode = detectMode();
    console.log(pc.bold('playground-use-packed') + ' — current mode: ' + pc.bold(mode));
    console.log('\nUsage:');
    console.log('  pnpm play:packed              # switch to packed tarballs');
    console.log('  pnpm play:packed:restore      # back to workspace:*');
    return;
  }

  if (args['use-packed']) {
    console.log(pc.bold(pc.blue('\n▶ playground → packed tarballs\n')));
    const tarballs = await packAllIntoPlayground();
    await rewriteToFileDeps(tarballs);
    await installAgainstTarballs();
    console.log(
      '\n' +
        pc.green('✓') +
        ' Playground now consumes built tarballs. Run ' +
        pc.bold('pnpm -C playgrounds/nuxt dev') +
        ' to test.'
    );
    console.log(
      pc.dim('  When done, run ') +
        pc.bold('pnpm play:packed:restore') +
        pc.dim(' to return to the workspace dev loop.')
    );
    return;
  }

  console.log(pc.bold(pc.blue('\n▶ playground → workspace:*\n')));
  await rewriteToWorkspaceDeps();
  await restoreWorkspaceInstall();
  console.log('\n' + pc.green('✓') + ' Playground restored to workspace dev loop.');
}

main().catch((err) => {
  console.error('\n' + pc.red('✖') + ' ' + (err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
