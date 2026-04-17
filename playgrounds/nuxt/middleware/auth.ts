export default defineNuxtRouteMiddleware((to) => {
  console.log('[mw:auth]', to.fullPath, '— (stub) would check auth cookie');
});
