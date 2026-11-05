import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// One source for the stylesheet: the string the library injects at runtime.
const { SMART_SKELETON_CSS } = await import(
  pathToFileURL(resolve(root, 'dist/core/index.js')).href
);

writeFileSync(resolve(root, 'dist/styles.css'), `${SMART_SKELETON_CSS.trim()}\n`);
