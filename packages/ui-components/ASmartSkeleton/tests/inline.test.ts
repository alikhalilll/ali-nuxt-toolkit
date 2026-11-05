import { expect, it } from 'vitest';
import { committed, inlineScript, source } from '../scripts/build-inline.mjs';

it('inline.generated.ts is built from current boot.ts', async () => {
  const current = source(await inlineScript());
  expect(committed(), 'run `node scripts/build-inline.mjs`').toBe(current);
});
