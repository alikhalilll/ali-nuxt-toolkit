import fs from 'node:fs';
import path from 'node:path';
import { packageDir, type BumpType } from '../lib/constants.ts';
import { capture } from '../lib/exec.ts';

export function readPackageJson(dir: string) {
  const file = path.join(packageDir(dir), 'package.json');
  return { file, data: JSON.parse(fs.readFileSync(file, 'utf8')) };
}

/** Compute the next semver for a `patch | minor | major` bump. */
export function bumpVersion(version: string, type: BumpType): string {
  const [core] = version.split('-');
  const [maj = '0', min = '0', pat = '0'] = core.split('.');
  const n = { maj: Number(maj), min: Number(min), pat: Number(pat) };

  if (type === 'major') return `${n.maj + 1}.0.0`;
  if (type === 'minor') return `${n.maj}.${n.min + 1}.0`;
  if (type === 'patch') return `${n.maj}.${n.min}.${n.pat + 1}`;
  throw new Error(`Unknown bump type: ${type}`);
}

/** True if `<name>@<version>` is already on the npm registry. */
export function versionPublished(name: string, version: string): boolean {
  const out = capture('npm', ['view', `${name}@${version}`, 'version']);
  return out.trim() === version;
}
