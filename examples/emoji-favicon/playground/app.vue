<script setup lang="ts">
// useEmojiFavicon and EmojiFavicon are auto-imported by the Nuxt module.
const { emoji } = useEmojiFavicon('⚡');

const presets = ['⚡', '✅', '🔥', '🚀', '🌈', '💎', '☕', '🌙'];
</script>

<template>
  <main>
    <h1>emoji-favicon playground</h1>
    <p>Click an emoji to update the favicon — watch the browser tab.</p>

    <div class="grid">
      <button v-for="e in presets" :key="e" :class="{ active: emoji === e }" @click="emoji = e">
        {{ e }}
      </button>
    </div>

    <p class="current">
      Current: <code>{{ emoji }}</code>
    </p>

    <h2>Inline preview component</h2>
    <EmojiFavicon :emoji="emoji" :size="96" />
  </main>
</template>

<style scoped>
main {
  max-width: 640px;
  margin: 4rem auto;
  padding: 0 1rem;
  font-family: system-ui, sans-serif;
}
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin: 1.5rem 0;
}
button {
  font-size: 2.5rem;
  padding: 1rem;
  background: #f5f5f7;
  border: 1px solid #ddd;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.1s;
}
button:hover {
  transform: scale(1.05);
}
button.active {
  background: #fef3c7;
  border-color: #f59e0b;
}
.current {
  color: #666;
}
.current code {
  background: #f5f5f7;
  padding: 2px 8px;
  border-radius: 4px;
}
</style>
