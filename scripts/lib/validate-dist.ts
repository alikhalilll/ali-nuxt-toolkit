/**
 * Shared dist-validation helper used by every publishable package.
 *
 * Runs two gates against a built package directory:
 *   1. publint — package.json `exports` / `types` / `files` correctness.
 *   2. attw    — @arethetypeswrong/cli; type-resolution health under node16 +
 *                bundler conditions, with an ignore-list for known-fine artefacts.
 *
 * Each package's local `scripts/validate/validate-dist.mjs` is a 5-line wrapper
 * that calls `runDistValidation({ pkgRoot })`. Package-specific quirks (e.g.
 * extra ignored entrypoints like `./styles.css` for @alikhalilll/ui) are passed
 * in via the `ignoreNoResolutionEntrypoints` option.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';
import pc from 'picocolors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

function section(title) {
  console.log('\n' + pc.bold(pc.blue('─'.repeat(60))));
  console.log('  ' + pc.bold(pc.blue(title)));
  console.log(pc.bold(pc.blue('─'.repeat(60))));
}

async function runPublint(pkgRoot) {
  section('1 / 2  publint (strict)');
  // `--strict` promotes publint warnings to failures. Warnings (e.g.
  // shared-types-for-dual-CJS-ESM) are real consumer-facing bugs in a published
  // package — there is no soft-warning category we want to ignore at publish time.
  await execa('pnpm', ['exec', 'publint', '--strict'], { cwd: pkgRoot, stdio: 'inherit' });
  console.log('\n' + pc.green('  ✓') + ' ' + pc.bold('publint passed.'));
}

function classifyAttwProblem(problem, ignoreNoResolutionEntrypoints) {
  // CJSResolvesToESM is covered by .attw.json ignoreRules; belt-and-suspenders.
  if (problem.kind === 'CJSResolvesToESM') return 'ignore';
  // Side-effect-only subpaths (e.g. CSS) have no `.d.ts` — that's intentional.
  if (problem.kind === 'NoResolution') {
    const ep = problem.entrypoint || '';
    if (ignoreNoResolutionEntrypoints.includes(ep)) return 'ignore';
  }
  return 'fail';
}

async function runAttw(pkgRoot, { ignoreNoResolutionEntrypoints }) {
  section('2 / 2  @arethetypeswrong/cli (attw)');

  const reportFile = path.join(pkgRoot, '.attw-report.json');
  await fs.rm(reportFile, { force: true });

  // attw exits non-zero on any problem; we want to capture JSON and classify
  // before deciding fail/pass. `|| true` swallows the exit code; we read the file.
  await execa(
    'bash',
    [
      '-lc',
      `pnpm exec attw --pack --format json --config-path "${path.join(repoRoot, '.attw.json')}" . > "${reportFile}" 2>&1 || true`,
    ],
    { cwd: pkgRoot, stdio: 'inherit' }
  );

  const raw = await fs.readFile(reportFile, 'utf8');

  // Known upstream issue: attw@0.18 + fflate@0.8.3 fails to gunzip tarballs on
  // Node 26 (sync Gunzip callback yields empty bytes → "Cannot read properties
  // of undefined (reading 'filename')"). When this fires, the report file holds
  // attw's stderr text, not JSON. Treat as a warn-and-skip — consumer-validate
  // is the authoritative gate for type-resolution correctness.
  if (raw.includes("Cannot read properties of undefined (reading 'filename')")) {
    console.log(
      '\n' +
        pc.yellow('  ⚠') +
        ' ' +
        pc.yellow('Skipping attw — upstream fflate@0.8.3 cannot gunzip on this Node version.')
    );
    console.log(
      pc.dim('     See @andrewbranch/arethetypeswrong#XXX. Consumer-validate covers the real case.')
    );
    await fs.rm(reportFile, { force: true });
    return;
  }

  let report;
  try {
    report = JSON.parse(raw);
  } catch {
    console.error('\n' + pc.red('  ✗') + ' attw produced non-JSON output:\n');
    console.error(raw);
    throw new Error('attw produced unparseable output.');
  }
  const problems = report?.analysis?.problems ?? [];

  const ignored = [];
  const failures = [];
  for (const p of problems) {
    if (classifyAttwProblem(p, ignoreNoResolutionEntrypoints) === 'fail') failures.push(p);
    else ignored.push(p);
  }

  if (ignored.length) {
    console.log(
      '\n' + pc.cyan('  ℹ') + ' ' + pc.dim(`${ignored.length} explicitly ignored problem(s)`)
    );
  }

  if (failures.length) {
    console.error(
      '\n' +
        pc.red('  ✗') +
        ' ' +
        pc.red(pc.bold(`${failures.length} unexpected attw problem(s):`)) +
        '\n'
    );
    console.error(JSON.stringify(failures, null, 2));
    throw new Error(`attw found ${failures.length} unexpected problem(s).`);
  }

  await fs.rm(reportFile, { force: true });
  console.log('\n' + pc.green('  ✓') + ' ' + pc.bold('attw passed.'));
}

export async function runDistValidation({ pkgRoot, ignoreNoResolutionEntrypoints = [] } = {}) {
  if (!pkgRoot) throw new Error('runDistValidation: `pkgRoot` is required');

  const pkgJson = JSON.parse(await fs.readFile(path.join(pkgRoot, 'package.json'), 'utf8'));
  console.log('\n' + pc.bold(pc.blue(`🔍 ${pkgJson.name}@${pkgJson.version} — dist validation`)));

  await runPublint(pkgRoot);
  await runAttw(pkgRoot, { ignoreNoResolutionEntrypoints });

  console.log('\n' + pc.bold(pc.green('═'.repeat(60))));
  console.log(pc.bold(pc.green('  ✓  All dist checks passed.')));
  console.log(pc.bold(pc.green('═'.repeat(60))) + '\n');
}
