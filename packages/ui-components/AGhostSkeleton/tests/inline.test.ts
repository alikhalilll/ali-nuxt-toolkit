import { expect, it } from 'vitest';
import { committed, inlineScript, source } from '../scripts/build-inline.mjs';

it('inline.generated.ts is built from current boot.ts', async () => {
  // `source()` is async since it runs the output through Prettier — the
  // double-quoted raw form breaks Nitro's Rollup re-parse on
  // `typeof window<"u"` during consumer validation.
  const current = await source(await inlineScript());
  expect(committed(), 'run `node scripts/build-inline.mjs`').toBe(current);
});
