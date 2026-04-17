export default defineNuxtRouteMiddleware((to) => {
  // eslint-disable-next-line no-console
  console.log('[mw:verify-role]', to.fullPath, '— (stub) would verify role');
});
