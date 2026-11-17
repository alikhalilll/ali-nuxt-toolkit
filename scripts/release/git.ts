import { capture, run } from '../lib/exec.ts';
import { die } from '../lib/logger.ts';

export function currentBranch(): string {
  return capture('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
}

export function ensureGitClean(): void {
  const status = capture('git', ['status', '--porcelain']);
  if (status) {
    die(
      `Git working tree is not clean. Commit or stash first:\n${status
        .split('\n')
        .map((l) => '    ' + l)
        .join('\n')}`
    );
  }
}

export function ensureOnBranch(expected: string): void {
  const actual = currentBranch();
  if (actual !== expected) {
    die(`Expected to be on branch "${expected}" but you are on "${actual}".`);
  }
}

export function commitAll(message: string, { dryRun = false }: { dryRun?: boolean } = {}): void {
  if (dryRun) return;
  run('git', ['add', '.']);
  run('git', ['commit', '-m', message]);
}

export function pushBranch(branch: string, { dryRun = false }: { dryRun?: boolean } = {}): void {
  if (dryRun) return;
  run('git', ['push', 'origin', branch]);
}
