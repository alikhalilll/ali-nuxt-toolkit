#!/usr/bin/env tsx
/**
 * tk — the ali-nuxt-toolkit CLI.
 *
 * One entry point that fans out to every common task in the repo:
 *   - build      pnpm build (all packages) or one package
 *   - validate   full validate pipeline (build + dist gates + consumer install)
 *   - consumer   consumer-validate only (skip per-package validate-dist)
 *   - dev        boot a dev server: playground (workspace HMR) /
 *                playground (packed tarballs) / docs site
 *
 * Two ways to call it:
 *   pnpm tk                              # interactive menu (no args)
 *   pnpm tk <action> [target] [--flags]  # non-interactive
 *
 * Examples:
 *   pnpm tk build                  # interactive package picker
 *   pnpm tk build all              # everything
 *   pnpm tk build ui               # one package
 *   pnpm tk validate ui            # full validate of one package
 *   pnpm tk consumer all           # consumer-validate the lot
 *   pnpm tk dev play               # playground (workspace symlinks)
 *   pnpm tk dev play:packed        # playground against built tarballs
 *   pnpm tk dev docs               # docs site
 *
 * Missing required choices fall back to the interactive picker, so
 * `pnpm tk build` alone still works.
 */
import { select } from '@inquirer/prompts';
import { execa } from 'execa';
import minimist from 'minimist';
import pc from 'picocolors';
import { PUBLISHABLE_PACKAGES, ROOT, type PublishablePackage } from './lib/constants.ts';

type Action = 'build' | 'validate' | 'consumer' | 'dev';
type PackageScope = 'all' | PublishablePackage;
type DevTarget = 'play' | 'play:packed' | 'docs';

const ACTIONS: readonly Action[] = ['build', 'validate', 'consumer', 'dev'] as const;
const DEV_TARGETS: readonly DevTarget[] = ['play', 'play:packed', 'docs'] as const;

const HELP = `${pc.bold('tk')} — ali-nuxt-toolkit CLI

${pc.bold('Usage:')}
  pnpm tk                              ${pc.dim('# interactive menu')}
  pnpm tk <action> [target] [--flags]

${pc.bold('Actions:')}
  build      ${pc.dim('Build one or all publishable packages')}
  validate   ${pc.dim('Full validate (build + publint + attw + consumer install)')}
  consumer   ${pc.dim('Consumer-validate only (skip per-package dist gates)')}
  dev        ${pc.dim('Boot a dev server: play | play:packed | docs')}

${pc.bold('Examples:')}
  pnpm tk build ui
  pnpm tk validate all
  pnpm tk consumer --pkg crypto
  pnpm tk dev play:packed

${pc.bold('Flags:')}
  --pkg <name>     ${pc.dim('Alternative to positional target (all|api-provider|crypto|...)')}
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

async function pickAction(): Promise<Action> {
  return select<Action>({
    message: 'What do you want to do?',
    choices: [
      { name: 'build      — compile packages', value: 'build' },
      { name: 'validate   — build + publint + attw + consumer install', value: 'validate' },
      { name: 'consumer   — consumer-validate only (faster)', value: 'consumer' },
      { name: 'dev        — boot a dev server', value: 'dev' },
    ],
  });
}

async function pickPackage(verb: string): Promise<PackageScope> {
  return select<PackageScope>({
    message: `Which package to ${verb}?`,
    choices: [
      { name: 'all (every publishable package)', value: 'all' },
      ...PUBLISHABLE_PACKAGES.map((p) => ({ name: p, value: p as PackageScope })),
    ],
  });
}

async function pickDevTarget(): Promise<DevTarget> {
  return select<DevTarget>({
    message: 'Which dev target?',
    choices: [
      { name: 'play           — playgrounds/nuxt (workspace HMR)', value: 'play' },
      {
        name: 'play:packed    — playgrounds/nuxt against built tarballs',
        value: 'play:packed',
      },
      { name: 'docs           — apps/docs (Nuxt content site)', value: 'docs' },
    ],
  });
}

/** Spawn a child command with the repo root as cwd; inherit stdio. */
async function spawn(cmd: string, args: string[]): Promise<void> {
  console.log(pc.dim(`$ ${cmd} ${args.join(' ')}`));
  await execa(cmd, args, { cwd: ROOT, stdio: 'inherit' });
}

async function runBuild(scope: PackageScope): Promise<void> {
  if (scope === 'all') {
    await spawn('pnpm', ['-r', '--filter', './packages/*', 'build']);
    return;
  }
  await spawn('pnpm', ['-C', `packages/${scope}`, 'build']);
}

async function runValidate(scope: PackageScope): Promise<void> {
  if (scope === 'all') {
    await spawn('pnpm', ['validate']);
    return;
  }
  await spawn('pnpm', [`validate:${scope}`]);
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
