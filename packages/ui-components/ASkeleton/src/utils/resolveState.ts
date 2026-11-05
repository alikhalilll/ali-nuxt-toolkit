/**
 * Resolve which pane an `<ASkeleton>` should render.
 *
 * Four exclusive states, resolved in priority order:
 *
 *   1. `loading` (prop forced true)                    → 'skeleton'
 *   2. `error` is non-null                              → 'error'
 *   3. `empty` is true                                  → 'empty'
 *   4. data-driven mode AND `data == null`              → 'skeleton'
 *   5. otherwise                                        → 'content'
 *
 * Data-driven mode is detected by whether the consumer bound a `data` prop
 * at all (even to `null`). Skullet's trick: inspect
 * `instance.vnode.props?.data in instance.vnode.props`. We pass `driven`
 * as an input to keep this helper pure and testable without a Vue instance.
 */

export type ASkeletonState = 'skeleton' | 'content' | 'error' | 'empty';

export interface ResolveStateInput {
  /** User set `:loading="true"` — force the skeleton pane regardless of data. */
  loading?: boolean;
  /** Non-null error → render the error pane; wins over `empty` + data presence. */
  error?: unknown;
  /** Explicit empty flag → render the empty pane; wins over data presence. */
  empty?: boolean;
  /**
   * The data value. Only meaningful when `driven` is true — a consumer that
   * never binds `data` passes `undefined` and `driven: false` and the state
   * is derived from `loading`/`error`/`empty` alone.
   */
  data?: unknown;
  /**
   * True when the consumer bound a `data` prop at the call site (even to
   * `null`). Without this flag we can't distinguish "user didn't pass data"
   * from "user passed `undefined`"; the former is the control-via-`loading`
   * API, the latter is the data-driven API.
   */
  driven?: boolean;
}

export function resolveState(input: ResolveStateInput): ASkeletonState {
  if (input.loading === true) return 'skeleton';
  if (input.error != null) return 'error';
  if (input.empty === true) return 'empty';
  if (input.driven && input.data == null) return 'skeleton';
  return 'content';
}
