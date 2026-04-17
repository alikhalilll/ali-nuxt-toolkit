export default defineNuxtRouteMiddleware((to) => {
  console.log('[mw:log-activity]', to.fullPath);
});
