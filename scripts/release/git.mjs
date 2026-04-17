import { capture, run } from './exec.mjs';
import { die } from './logger.mjs';

export function currentBranch() {
  return capture('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
}

export function ensureGitClean() {
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

export function ensureOnBranch(expected) {
  const actual = currentBranch();
  if (actual !== expected) {
    die(`Expected to be on branch "${expected}" but you are on "${actual}".`);
  }
}

export function tagExists(tag) {
  const out = capture('git', ['tag', '-l', tag]);
  return out.trim() === tag;
}

export function commitAll(message, { dryRun = false } = {}) {
  if (dryRun) return;
  run('git', ['add', '.']);
  run('git', ['commit', '-m', message]);
}

export function createTag(tag, message, { dryRun = false } = {}) {
  if (dryRun) return;
  run('git', ['tag', '-a', tag, '-m', message]);
}

export function pushBranch(branch, { dryRun = false } = {}) {
  if (dryRun) return;
  run('git', ['push', 'origin', branch]);
}

export function pushTag(tag, { dryRun = false } = {}) {
  if (dryRun) return;
  run('git', ['push', 'origin', tag]);
}
