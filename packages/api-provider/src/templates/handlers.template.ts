import type { ApiProviderModuleOptions } from '../types/module-options';

/**
 * Emit the virtual `#build/api-provider-handlers.mjs` module. Each handler
 * re-exports the user-provided default, or a no-op fallback.
 */
export function createHandlersTemplateContents(options: ApiProviderModuleOptions): string {
  const imports: string[] = [];
  const fallbacks: string[] = [];

  if (options.onRequestPath?.trim()) {
    imports.push(`export { default as onRequestHandler } from '${options.onRequestPath}';`);
  } else {
    fallbacks.push(`export function onRequestHandler() {}`);
  }

  if (options.onSuccessPath?.trim()) {
    imports.push(`export { default as onSuccessHandler } from '${options.onSuccessPath}';`);
  } else {
    fallbacks.push(`export function onSuccessHandler() {}`);
  }

  if (options.onErrorPath?.trim()) {
    imports.push(`export { default as onErrorHandler } from '${options.onErrorPath}';`);
  } else {
    fallbacks.push(`export function onErrorHandler() {}`);
  }

  return `${imports.join('\n')}\n${fallbacks.join('\n')}\n`;
}
