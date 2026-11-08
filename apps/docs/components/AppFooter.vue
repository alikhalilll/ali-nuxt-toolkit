<script setup lang="ts">
const year = new Date().getFullYear();
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer__inner">
      <span>MIT © {{ year }} alikhalilll</span>
      <div class="app-footer__links">
        <a href="https://github.com/alikhalilll/ali-nuxt-toolkit" target="_blank" rel="noopener">
          GitHub
        </a>
        <a
          href="https://github.com/alikhalilll/ali-nuxt-toolkit/issues"
          target="_blank"
          rel="noopener"
        >
          Issues
        </a>
        <a href="https://www.npmjs.com/~alikhalilll" target="_blank" rel="noopener">npm</a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  margin-top: 4rem;
  box-shadow: inset 0 1px 0 var(--color-border);
}

.app-footer__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  max-width: 72rem;
  margin: 0 auto;
  padding: 1.25rem 1.5rem 2.5rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.app-footer__links {
  display: flex;
  gap: 1rem;
}

.app-footer__links a {
  color: inherit;
  transition: color 150ms ease;
}
.app-footer__links a:hover {
  color: var(--color-text);
}

@media (max-width: 640px) {
  .app-footer__inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem 1rem 2rem;
  }
}
</style>
