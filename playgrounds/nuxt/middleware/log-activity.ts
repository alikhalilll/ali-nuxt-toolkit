export default defineNuxtRouteMiddleware((to) => {
  // eslint-disable-next-line no-console
  console.log('[mw:log-activity]', to.fullPath);
});
