import { spawnSync, type SpawnSyncReturns } from 'node:child_process';

export type RunOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  stdio?: 'inherit' | 'pipe' | 'ignore';
  allowFail?: boolean;
};

/**
 * Run a shell command synchronously, inheriting stdio by default.
 * Throws on non-zero exit unless `allowFail: true`.
 */
export function run(cmd: string, args: string[], opts: RunOptions = {}): SpawnSyncReturns<string> {
  const { cwd, env, stdio = 'inherit', allowFail = false } = opts;
  const result = spawnSync(cmd, args, {
    cwd,
    env: { ...process.env, ...(env || {}) },
    stdio,
    encoding: 'utf8',
  });
  if (result.status !== 0 && !allowFail) {
    const line = `${cmd} ${args.join(' ')}`;
    throw new Error(`Command failed (${result.status}): ${line}`);
  }
  return result;
}

/** Capture stdout of a command (trimmed). Returns empty string on failure. */
export function capture(
  cmd: string,
  args: string[],
  opts: Pick<RunOptions, 'cwd' | 'env'> = {}
): string {
  const result = spawnSync(cmd, args, {
    cwd: opts.cwd,
    env: { ...process.env, ...(opts.env || {}) },
    encoding: 'utf8',
  });
  if (result.status !== 0) return '';
  return (result.stdout || '').trim();
}
