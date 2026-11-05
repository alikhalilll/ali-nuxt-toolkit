/**
 * Framework-agnostic engine classes — measure/ghost/reveal core.
 *
 * `Ghost` manages the loading pane; `Memory` manages the shown pane.
 * Both are plain ES2022 classes with no Vue dependency, so a React /
 * Svelte / vanilla adapter can wire them up the same way the Vue
 * adapter here does.
 */

export { Ghost } from './Ghost';
export type { GhostOptions } from './Ghost';
export { Memory } from './Memory';
export type { MemoryOptions } from './Memory';
export { setLoadingSize, takeLoadingSize } from './loadingSize';
export type { LoadingSize } from './loadingSize';
