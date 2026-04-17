/**
 * A single mapping from one or more layouts to the middleware names that
 * should run when a page using that layout is navigated to.
 *
 * Each entry in `layouts` is treated as a glob:
 * - `*` matches any sequence of characters except `/`
 * - `**` matches any sequence of characters
 * - Regex objects are also supported.
 *
 * Each entry in `middlewares` is either a bare middleware name (resolved
 * against `~/middleware/<name>.ts`) or `@groupName` to reference a group
 * declared in `AutoMiddlewareOptions.groups`.
 */
export interface AutoMiddlewareRule {
  layouts: Array<string | RegExp>;
  middlewares: string[];
}

/**
 * Top-level options for the module.
 */
export interface AutoMiddlewareOptions {
  /** Mapping of layouts → middlewares. Order is preserved when middlewares are merged across rules. */
  rules: AutoMiddlewareRule[];
  /**
   * Named middleware groups. Reference from a rule via `@groupName`.
   * Example: `{ auth: ['auth', 'verify-role'] }`.
   */
  groups?: Record<string, string[]>;
  /**
   * When `true`, logs middleware resolution + execution at runtime.
   * Defaults to `false` (no logs even in dev). Separate from Nuxt dev mode.
   */
  debug?: boolean;
  /**
   * Name of the page-meta field that can be used to append extra middlewares
   * per page. Set to `false` to disable per-page overrides entirely.
   * Default: `'middlewares'`.
   */
  pageMetaField?: string | false;
}
