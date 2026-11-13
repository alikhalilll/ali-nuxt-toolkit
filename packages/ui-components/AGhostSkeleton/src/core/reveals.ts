import { CASCADE_SPREAD, FADE_DURATION } from './constants';
import {
  instant,
  MAX_DELAY,
  MAX_DURATION,
  sequence,
  smart,
  together,
  type RevealMode,
  type RevealSpec,
} from './plan';
import { sweep, SWEEP_SPREAD } from './sweep';

// `instant` is advertised as a string mode in the README and is exported as a
// `RevealSpec`, but was previously missing from this map, so passing
// `reveal="instant"` returned `undefined` and crashed `arrive()` with
// "Cannot read properties of undefined (reading 'hold')".
const NAMED = { together, sequence, smart, sweep, instant };

// Unknown strings fall back to `smart` instead of crashing — a stale template
// or a typo should quietly do the right thing, not blow up the reveal.
export const revealSpec = (mode: RevealMode = 'smart'): RevealSpec => {
  if (typeof mode !== 'string') return mode;
  return (NAMED as Record<string, RevealSpec>)[mode] ?? smart;
};

/** Longest a pane can take to leave under `mode`, for a framework that has to know up front. */
export function exitDuration(mode?: RevealMode) {
  const spec = revealSpec(mode);
  const hold = spec.hold ?? 0;
  if (spec === together) return FADE_DURATION;
  if (spec === sequence) return CASCADE_SPREAD + FADE_DURATION;
  if (spec === smart) return hold + CASCADE_SPREAD + FADE_DURATION;
  if (spec === sweep) return hold + SWEEP_SPREAD + FADE_DURATION;
  if (spec.duration === 0) return 0;
  // A choice can bring its own delay, as long as the cap allows
  const delay = spec.choose ? MAX_DELAY : Math.min(Math.max(spec.delay ?? 0, 0), MAX_DELAY);
  return hold + delay + MAX_DELAY + MAX_DURATION;
}
