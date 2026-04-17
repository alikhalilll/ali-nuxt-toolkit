export default defineNuxtRouteMiddleware((to) => {
  console.log('[mw:require-admin]', to.fullPath, '— (stub) would enforce admin role');
});
