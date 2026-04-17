import { capture, run } from './exec.mjs';

export function ghAvailable() {
  if (!capture('gh', ['--version'])) return { ok: false, reason: 'gh CLI not installed' };
  const status = capture('gh', ['auth', 'status']);
  if (!status) return { ok: false, reason: 'gh CLI not authenticated (run: gh auth login)' };
  return { ok: true };
}

export function githubReleaseExists(tag) {
  return !!capture('gh', ['release', 'view', tag]);
}

export function deleteGithubRelease(tag) {
  run('gh', ['release', 'delete', tag, '--yes', '--cleanup-tag=false'], { allowFail: true });
}

export function createGithubRelease(
  tag,
  { title, prerelease = false, force = false, dryRun = false } = {}
) {
  if (dryRun) return;
  if (force && githubReleaseExists(tag)) deleteGithubRelease(tag);
  const args = ['release', 'create', tag, '--title', title || tag, '--generate-notes'];
  if (prerelease) args.push('--prerelease');
  run('gh', args);
}
