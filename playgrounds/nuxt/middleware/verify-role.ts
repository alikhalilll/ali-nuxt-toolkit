export default defineNuxtRouteMiddleware((to) => {
  console.log('[mw:verify-role]', to.fullPath, '— (stub) would verify role');
});
