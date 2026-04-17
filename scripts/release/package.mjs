import fs from 'node:fs';
import path from 'node:path';
import { PACKAGES_DIR } from './constants.mjs';
import { capture, run } from './exec.mjs';

export function packagePath(dir) {
  return path.join(PACKAGES_DIR, dir);
}

export function readPackageJson(dir) {
  const file = path.join(packagePath(dir), 'package.json');
  return { file, data: JSON.parse(fs.readFileSync(file, 'utf8')) };
}

export function writePackageJson(dir, data) {
  const file = path.join(packagePath(dir), 'package.json');
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

/**
 * Compute the next semver for a given bump type. `prerelease` bumps a
 * `-rc.N` identifier (or adds `-rc.0` if none exists).
 */
export function bumpVersion(version, type) {
  if (type === 'none') return version;
  const [core, pre] = version.split('-');
  const [maj = '0', min = '0', pat = '0'] = core.split('.');
  const n = { maj: Number(maj), min: Number(min), pat: Number(pat) };

  if (type === 'major') return `${n.maj + 1}.0.0`;
  if (type === 'minor') return `${n.maj}.${n.min + 1}.0`;
  if (type === 'patch') return `${n.maj}.${n.min}.${n.pat + 1}`;

  if (type === 'prerelease') {
    if (pre && pre.startsWith('rc.')) {
      const idx = Number(pre.slice(3));
      return `${n.maj}.${n.min}.${n.pat}-rc.${idx + 1}`;
    }
    return `${n.maj}.${n.min}.${n.pat + 1}-rc.0`;
  }

  throw new Error(`Unknown bump type: ${type}`);
}

export function setVersion(dir, version) {
  const { data } = readPackageJson(dir);
  data.version = version;
  writePackageJson(dir, data);
}

export function runPnpm(args, opts = {}) {
  return run('pnpm', args, opts);
}

/** True if `<name>@<version>` is already on the npm registry. */
export function versionPublished(name, version) {
  const out = capture('npm', ['view', `${name}@${version}`, 'version']);
  return out.trim() === version;
}
