#!/usr/bin/env tsx
/**
 * tk — the ali-nuxt-toolkit CLI.
 *
 * One entry point that fans out to every common task in the repo. Each action
 * accepts either "all" or a single package name; if omitted, you get an
 * interactive picker.
 *
 *   build       Build one or all publishable packages
 *   typecheck   Typecheck one or all publishable packages
 *   clean       Remove dist + generated artifacts
 *   pack        Build + pack one or all packages into .tgz (→ ./artifacts)
 *   validate    Full validate (build + publint + attw + consumer install)
 *   consumer    Consumer-validate only (faster than `validate`)
 *   release    Interactive release: bump version, publish, tag (use `--dry-run`)
 *   dev         Boot a dev server: play | play:packed | play:restore | docs
 *
 * Two ways to call it:
 *   pnpm tk                              # interactive menu (no args)
 *   pnpm tk <action> [target] [--flags]  # non-interactive
 *
 * Examples:
 *   pnpm tk build a-tel-input
 *   pnpm tk pack all
 *   pnpm tk validate all
 *   pnpm tk consumer --pkg crypto
 *   pnpm tk release --dry-run
 *   pnpm tk dev play:packed
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { select } from '@inquirer/prompts';
import { execa, execaSync } from 'execa';
import minimist from 'minimist';
import pc from 'picocolors';
import {
  packageDir,
  PUBLISHABLE_PACKAGES,
  ROOT,
  type PublishablePackage,
} from './lib/constants.ts';

type Action =
  | 'build'
  | 'typecheck'
  | 'clean'
  | 'pack'
  | 'validate'
  | 'consumer'
  | 'release'
  | 'dev';
type PackageScope = 'all' | PublishablePackage;
type DevTarget = 'play' | 'play:packed' | 'play:restore' | 'docs';

const ACTIONS: readonly Action[] = [
  'build',
  'typecheck',
  'clean',
  'pack',
  'validate',
  'consumer',
  'release',
  'dev',
] as const;
const DEV_TARGETS: readonly DevTarget[] = ['play', 'play:packed', 'play:restore', 'docs'] as const;
const PNPM_FILTER = ['-r', '--filter', './packages/*', '--filter', './packages/ui-components/*'];

const HELP = `${pc.bold('tk')} — ali-nuxt-toolkit CLI

${pc.bold('Usage:')}
  pnpm tk                              ${pc.dim('# interactive menu')}
  pnpm tk <action> [target] [--flags]

${pc.bold('Actions:')}
  build      ${pc.dim('Build one or all publishable packages')}
  typecheck  ${pc.dim('Typecheck one or all packages')}
  clean      ${pc.dim('Remove dist + generated artifacts')}
  pack       ${pc.dim('Build + pack one or all packages → .tgz')}
  validate   ${pc.dim('Full validate (build + publint + attw + consumer install)')}
  consumer   ${pc.dim('Consumer-validate only (faster than validate)')}
  release    ${pc.dim('Interactive release; pass --dry-run to preview')}
  dev        ${pc.dim('Boot a dev server: play | play:packed | play:restore | docs')}

${pc.bold('Examples:')}
  pnpm tk build a-tel-input
  pnpm tk pack all
  pnpm tk consumer --pkg crypto
  pnpm tk release --dry-run
  pnpm tk dev play:packed

${pc.bold('Flags:')}
  --pkg <name>     ${pc.dim('Alternative to positional target (all|api-provider|crypto|...)')}
  --dry-run        ${pc.dim('(release only) preview without publishing')}
  -h, --help       ${pc.dim('Show this help')}
`;

/** Resolve a package target from positional/--pkg args, narrowed to a valid scope. */
function resolvePackageArg(
  positional: string | undefined,
  flag: string | undefined
): PackageScope | undefined {
  const raw = flag ?? positional;
  if (!raw) return undefined;
  if (raw === 'all') return 'all';
  if ((PUBLISHABLE_PACKAGES as readonly string[]).includes(raw)) return raw as PublishablePackage;
  console.error(
    pc.red('✖') +
      ` Unknown package "${raw}". Expected one of: all, ${PUBLISHABLE_PACKAGES.join(', ')}`
  );
  process.exit(1);
}

/** Resolve dev target from positional arg, narrowed to a valid target. */
function resolveDevArg(positional: string | undefined): DevTarget | undefined {
  if (!positional) return undefined;
  if ((DEV_TARGETS as readonly string[]).includes(positional)) return positional as DevTarget;
  console.error(
    pc.red('✖') + ` Unknown dev target "${positional}". Expected one of: ${DEV_TARGETS.join(', ')}`
  );
  process.exit(1);
}

/**
 * Pretty session header — branch, dirty-tree flag, and package count so the
 * user can orient themselves the moment `pnpm tk` launches.
 */
function printWelcomeBanner(): void {
  const branch =
    execaSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { reject: false }).stdout?.trim() ||
    '?';
  const dirty =
    execaSync('git', ['status', '--porcelain'], { reject: false }).stdout?.trim().length || 0;
  const dirtyTag =
    dirty > 0 ? pc.yellow(`${dirty} file${dirty === 1 ? '' : 's'} changed`) : pc.green('clean');
  console.log(
    pc.bold(pc.cyan('▸ tk')) +
      pc.dim('  ·  ') +
      pc.bold(`${PUBLISHABLE_PACKAGES.length} packages`) +
      pc.dim('  ·  ') +
      `${pc.bold('branch:')} ${branch}` +
      pc.dim('  ·  ') +
      `${pc.bold('tree:')} ${dirtyTag}`
  );
  console.log();
}

async function pickAction(): Promise<Action> {
  return select<Action>({
    message: 'What do you want to do?',
    choices: [
      // Compile/check
      { name: `${pc.cyan('build')}      compile package dist`, value: 'build' },
      { name: `${pc.cyan('typecheck')}  vue-tsc / tsc --noEmit`, value: 'typecheck' },
      { name: `${pc.cyan('clean')}      wipe dist + generated artifacts`, value: 'clean' },
      // Package/validate
      { name: `${pc.magenta('pack')}       build + npm pack into .tgz`, value: 'pack' },
      {
        name: `${pc.magenta('validate')}   build + publint + attw + consumer install`,
        value: 'validate',
      },
      {
        name: `${pc.magenta('consumer')}   consumer-validate only (faster)`,
        value: 'consumer',
      },
      // Ship
      {
        name: `${pc.green('release')}    interactive release ${pc.dim('(--dry-run supported)')}`,
        value: 'release',
      },
      // Run
      { name: `${pc.yellow('dev')}        boot a dev server`, value: 'dev' },
    ],
  });
}

/** Read a package's current version for the picker label. */
function readVersionLabel(name: string): string {
  try {
    const pj = JSON.parse(readFileSync(path.join(packageDir(name), 'package.json'), 'utf8'));
    return pj.version || '?';
  } catch {
    return '?';
  }
}

async function pickPackage(verb: string): Promise<PackageScope> {
  return select<PackageScope>({
    message: `Which package to ${verb}?`,
    choices: [
      { name: `${pc.bold('all')}  ${pc.dim('— every publishable package')}`, value: 'all' },
      ...PUBLISHABLE_PACKAGES.map((p) => ({
        name: `${p.padEnd(22)} ${pc.dim('v' + readVersionLabel(p))}`,
        value: p as PackageScope,
      })),
    ],
  });
}

async function pickDevTarget(): Promise<DevTarget> {
  return select<DevTarget>({
    message: 'Which dev target?',
    choices: [
      {
        name: `${pc.cyan('play')}           playgrounds/nuxt ${pc.dim('(workspace HMR)')}`,
        value: 'play',
      },
      {
        name: `${pc.cyan('play:packed')}    playgrounds/nuxt against built tarballs`,
        value: 'play:packed',
      },
      {
        name: `${pc.cyan('play:restore')}   restore playground to workspace symlinks`,
        value: 'play:restore',
      },
      {
        name: `${pc.cyan('docs')}           apps/docs ${pc.dim('(Nuxt content site)')}`,
        value: 'docs',
      },
    ],
  });
}

/** Spawn a child command with the repo root as cwd; inherit stdio. */
async function spawn(cmd: string, args: string[]): Promise<void> {
  console.log(pc.dim(`$ ${cmd} ${args.join(' ')}`));
  await execa(cmd, args, { cwd: ROOT, stdio: 'inherit' });
}

/** Path to a package's pnpm workspace dir (UI components are nested under ui-components/). */
function pkgPath(scope: PublishablePackage): string {
  const nested = ['a-input', 'a-popover', 'a-drawer', 'a-responsive-popover', 'a-tel-input'];
  return nested.includes(scope) ? `packages/ui-components/${pkgDir(scope)}` : `packages/${scope}`;
}
function pkgDir(scope: PublishablePackage): string {
  const map: Record<string, string> = {
    'a-input': 'AInput',
    'a-popover': 'APopover',
    'a-drawer': 'ADrawer',
    'a-responsive-popover': 'AResponsivePopover',
    'a-tel-input': 'ATelInput',
  };
  return map[scope] ?? scope;
}

async function runRecursive(script: string): Promise<void> {
  await spawn('pnpm', [...PNPM_FILTER, 'run', script]);
}

async function runBuild(scope: PackageScope): Promise<void> {
  if (scope === 'all') return runRecursive('build');
  await spawn('pnpm', ['-C', pkgPath(scope), 'build']);
}

async function runTypecheck(scope: PackageScope): Promise<void> {
  if (scope === 'all') return runRecursive('typecheck');
  await spawn('pnpm', ['-C', pkgPath(scope), 'typecheck']);
}

async function runClean(scope: PackageScope): Promise<void> {
  if (scope === 'all') return runRecursive('clean');
  await spawn('pnpm', ['-C', pkgPath(scope), 'clean']);
}

async function runPack(scope: PackageScope): Promise<void> {
  const args = ['scripts/pack/pack-all.ts', scope === 'all' ? '--all' : `--pkg=${scope}`];
  await spawn('tsx', args);
}

async function runRelease(extra: string[]): Promise<void> {
  await spawn('tsx', ['scripts/release/index.ts', '--interactive', ...extra]);
}

async function runValidate(scope: PackageScope): Promise<void> {
  if (scope === 'all') {
    // build → per-package validate-dist (publint + attw) → consumer-validate
    await runRecursive('build');
    await runRecursive('validate-dist');
    await spawn('tsx', ['scripts/validate/consumer-validate.ts', '--all']);
    return;
  }
  await spawn('pnpm', ['-C', pkgPath(scope), 'validate']);
}

async function runConsumer(scope: PackageScope): Promise<void> {
  const script = 'scripts/validate/consumer-validate.ts';
  if (scope === 'all') {
    await spawn('tsx', [script, '--all']);
    return;
  }
  await spawn('tsx', [script, '--pkg', scope]);
}

async function runDev(target: DevTarget): Promise<void> {
  switch (target) {
    case 'play':
      await spawn('pnpm', ['-C', 'playgrounds/nuxt', 'dev']);
      return;
    case 'play:packed':
      await spawn('tsx', ['scripts/playground/use-packed.ts', '--use-packed']);
      console.log(
        '\n' +
          pc.green('✓') +
          ' Playground now consumes tarballs. Boot with: ' +
          pc.bold('pnpm -C playgrounds/nuxt dev')
      );
      return;
    case 'play:restore':
      await spawn('tsx', ['scripts/playground/use-packed.ts', '--restore']);
      return;
    case 'docs':
      await spawn('pnpm', ['-C', 'apps/docs', 'dev']);
      return;
  }
}

async function main(): Promise<void> {
  const args = minimist(process.argv.slice(2), {
    string: ['pkg'],
    boolean: ['help'],
    alias: { h: 'help' },
  });

  if (args.help) {
    console.log(HELP);
    return;
  }

  const positional = args._;
  const rawAction = positional[0] as Action | undefined;
  // Welcome banner only when entering interactive mode (no action passed).
  if (!rawAction) printWelcomeBanner();
  const action: Action =
    rawAction && (ACTIONS as readonly string[]).includes(rawAction)
      ? rawAction
      : await pickAction();

  if (rawAction && !(ACTIONS as readonly string[]).includes(rawAction)) {
    console.error(
      pc.red('✖') + ` Unknown action "${rawAction}". Expected one of: ${ACTIONS.join(', ')}`
    );
    process.exit(1);
  }

  switch (action) {
    case 'build': {
      const scope = resolvePackageArg(positional[1], args.pkg) ?? (await pickPackage('build'));
      await runBuild(scope);
      return;
    }
    case 'typecheck': {
      const scope = resolvePackageArg(positional[1], args.pkg) ?? (await pickPackage('typecheck'));
      await runTypecheck(scope);
      return;
    }
    case 'clean': {
      const scope = resolvePackageArg(positional[1], args.pkg) ?? (await pickPackage('clean'));
      await runClean(scope);
      return;
    }
    case 'pack': {
      const scope = resolvePackageArg(positional[1], args.pkg) ?? (await pickPackage('pack'));
      await runPack(scope);
      return;
    }
    case 'validate': {
      const scope = resolvePackageArg(positional[1], args.pkg) ?? (await pickPackage('validate'));
      await runValidate(scope);
      return;
    }
    case 'consumer': {
      const scope =
        resolvePackageArg(positional[1], args.pkg) ?? (await pickPackage('consumer-validate'));
      await runConsumer(scope);
      return;
    }
    case 'release': {
      // Pass through additional flags (--dry-run, --pkg, etc.) to the release script.
      const extras: string[] = [];
      if (args['dry-run']) extras.push('--dry-run');
      if (args.pkg) extras.push('--pkg', String(args.pkg));
      const positionalScope = positional[1];
      if (positionalScope)
        extras.push(positionalScope === 'all' ? '--all' : `--pkg=${positionalScope}`);
      await runRelease(extras);
      return;
    }
    case 'dev': {
      const target = resolveDevArg(positional[1]) ?? (await pickDevTarget());
      await runDev(target);
      return;
    }
  }
}

main().catch((err: unknown) => {
  if (err instanceof Error && err.name === 'ExitPromptError') {
    // User pressed Ctrl+C in @inquirer/prompts — exit quietly.
    process.exit(130);
  }
  console.error('\n' + pc.red('✖') + ' ' + (err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
