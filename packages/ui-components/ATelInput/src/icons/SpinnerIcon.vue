<template>
  <svg
    class="a-tel-input-icon-spinner"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
</template>

<style>
@keyframes a-tel-input-icon-spin {
  to {
    transform: rotate(360deg);
  }
}
.a-tel-input-icon-spinner {
  animation: a-tel-input-icon-spin 1s linear infinite;
  transform-origin: center;
}
</style>
