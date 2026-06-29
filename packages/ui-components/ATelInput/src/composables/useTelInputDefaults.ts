import { inject, provide, type App, type InjectionKey } from 'vue';

/**
 * Globally-configurable defaults for `<ATelInput>` / `<ACountrySelect>`. Set once
 * (via `provideTelInputDefaults` in a setup block or `installTelInputDefaults`
 * during app bootstrap) and every instance picks them up via `inject`. Per-
 * component props always win over an injected default.
 *
 * The Nuxt module ships a plugin that reads its module options and calls
 * `installTelInputDefaults` at app startup, so Nuxt consumers only configure the
 * key once in `nuxt.config.ts` (`aTelInput: { apiKey: '...' }`).
 */
export interface TelInputDefaults {
  /** REST Countries v5 API key — enables the one-shot v5 fetch upgrade path. */
  apiKey?: string;
  /** Override the v5 base URL (rarely useful). */
  restCountriesBaseUrl?: string;
}

const TEL_INPUT_DEFAULTS_KEY: InjectionKey<TelInputDefaults> = Symbol('a-tel-input-defaults');

/** Call from a parent component's `setup()` to provide defaults to descendants. */
export function provideTelInputDefaults(defaults: TelInputDefaults): void {
  provide(TEL_INPUT_DEFAULTS_KEY, defaults);
}

/** Call during app bootstrap (`app.use(...)` / Nuxt plugin) for app-wide defaults. */
export function installTelInputDefaults(app: App, defaults: TelInputDefaults): void {
  app.provide(TEL_INPUT_DEFAULTS_KEY, defaults);
}

/** Component-side accessor. Returns an empty object when no defaults were provided. */
export function injectTelInputDefaults(): TelInputDefaults {
  return inject(TEL_INPUT_DEFAULTS_KEY, {});
}
