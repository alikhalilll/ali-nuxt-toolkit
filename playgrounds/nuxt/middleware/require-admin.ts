export default defineNuxtRouteMiddleware((to) => {
  // eslint-disable-next-line no-console
  console.log('[mw:require-admin]', to.fullPath, '— (stub) would enforce admin role');
});
