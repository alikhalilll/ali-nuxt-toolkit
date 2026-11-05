/**
 * Reveal-mode utilities — upfront duration bounds for a given mode.
 *
 * Port of `skullet/lib/reveals.ts`. Returns the longest-case ms a reveal
 * might take, used by the applier to size exit animations and by the
 * debug overlay to tag timing.
 */

import { CASCADE_SPREAD, FADE_DURATION, SKELETON_DELAY, type RevealMode } from './plan';

const DURATIONS: Record<RevealMode, number> = {
  instant: 0,
  together: FADE_DURATION,
  sequence: CASCADE_SPREAD + FADE_DURATION,
  smart: SKELETON_DELAY + CASCADE_SPREAD + FADE_DURATION,
};

/**
 * Upper bound on the reveal's total ms, including any skeleton-hold the
 * `smart` planner might apply. Callers use this to size pane exit timing.
 */
export function exitDuration(mode: RevealMode = 'smart'): number {
  return DURATIONS[mode] ?? DURATIONS.smart;
}
