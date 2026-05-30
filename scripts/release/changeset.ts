/**
 * Auto-emit a Changesets entry for each release run.
 *
 * The release script bumps versions and publishes directly, so we don't call
 * `changeset version` (that would double-bump). Instead we write a frontmatter
 * file under `.changeset/` documenting which packages shipped at which bump
 * type. Later, `pnpm changeset version` consumes it to regenerate CHANGELOG.md
 * for each affected package — keeping a paper trail of every release without
 * making the release flow depend on the Changesets state machine.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../lib/constants.ts';

export type ChangesetEntry = {
  /** Published npm name, e.g. `@alikhalilll/a-tel-input`. */
  name: string;
  /** Bump kind — Changesets only recognises major/minor/patch. */
  bump: 'major' | 'minor' | 'patch';
};

/**
 * Write a single `.changeset/<id>.md` documenting this release. Returns the
 * file path so the caller can stage/commit it. No-op if `entries` is empty.
 *
 * Skips `none` bumps automatically — the changeset format has no concept of
 * "no-op" entries.
 */
export function writeChangeset(
  entries: ChangesetEntry[],
  summary: string,
  opts: { dryRun?: boolean } = {}
): string | null {
  const real = entries.filter((e) => e.bump !== ('none' as unknown));
  if (real.length === 0) return null;

  const dir = path.join(ROOT, '.changeset');
  if (!fs.existsSync(dir)) return null; // changesets not initialised — silently skip

  const id = `release-${stamp()}-${randSlug()}`;
  const filePath = path.join(dir, `${id}.md`);
  const frontmatter = real.map((e) => `'${e.name}': ${e.bump}`).join('\n');
  const body = `---\n${frontmatter}\n---\n\n${summary.trim()}\n`;

  if (opts.dryRun) return filePath;

  fs.writeFileSync(filePath, body);
  return filePath;
}

function stamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function randSlug(): string {
  // Six-char base36 — collision-resistant enough for per-minute releases.
  return Math.floor(Math.random() * 36 ** 6)
    .toString(36)
    .padStart(6, '0');
}
