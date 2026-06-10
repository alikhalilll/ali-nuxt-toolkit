export default defineNuxtConfig({
  modules: ['@yourname/emoji-favicon/nuxt'],

  emojiFavicon: {
    emoji: '⚡',
    size: 64,
  },

  // The module reads route meta to override per-page (see app.vue).
  app: {
    head: {
      title: 'emoji-favicon playground',
    },
  },

  devtools: { enabled: true },
});
