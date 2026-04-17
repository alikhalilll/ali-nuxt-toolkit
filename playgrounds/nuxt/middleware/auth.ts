export default defineNuxtRouteMiddleware((to) => {
  // eslint-disable-next-line no-console
  console.log('[mw:auth]', to.fullPath, '— (stub) would check auth cookie');
});
