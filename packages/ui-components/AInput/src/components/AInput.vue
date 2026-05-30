<script setup lang="ts">
import { computed, useSlots } from 'vue';
import { useVModel } from '@vueuse/core';
import { cn } from '@alikhalilll/a-ui-base';
import { DEFAULT_SIZE } from '@alikhalilll/a-ui-base';
import type { AInputEmits, AInputProps, AInputSlots } from '../types';

const props = withDefaults(defineProps<AInputProps>(), { size: DEFAULT_SIZE });
const emits = defineEmits<AInputEmits>();
defineSlots<AInputSlots>();

const slots = useSlots();
const hasPrefix = computed(() => !!slots.prefix);
const hasSuffix = computed(() => !!slots.suffix);
const hasAdornment = computed(() => hasPrefix.value || hasSuffix.value);

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
});
</script>

<template>
  <!--
    With prefix/suffix slots the visible "input" is a wrapper that owns the border,
    background and focus ring. Without them we render the plain native input directly so
    AInput stays a drop-in for <input>.
  -->
  <div v-if="hasAdornment" :data-size="props.size" :class="cn('a-input', props.class)">
    <span v-if="hasPrefix" :class="cn('a-input__adornment', props.prefixClass)">
      <slot name="prefix" />
    </span>

    <input v-model="modelValue" data-slot="input" :class="cn('a-input__input', props.inputClass)" />

    <span v-if="hasSuffix" :class="cn('a-input__adornment', props.suffixClass)">
      <slot name="suffix" />
    </span>
  </div>

  <input
    v-else
    v-model="modelValue"
    data-slot="input"
    :data-size="props.size"
    :class="cn('a-input', 'a-input--bare', props.class)"
  />
</template>

<style scoped>
/* Wrapper variant — input with prefix/suffix adornments. */
.a-input {
  display: inline-flex;
  width: 100%;
  align-items: center;
  border-radius: calc(var(--ak-ui-radius) - 2px);
  border: 1px solid hsl(var(--ak-ui-input));
  background: hsl(var(--ak-ui-background));
  color: hsl(var(--ak-ui-foreground));
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: border-color 150ms;
}
.a-input:focus-within {
  outline: none;
  box-shadow: 0 0 0 1px hsl(var(--ak-ui-ring));
}

.a-input__adornment {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: hsl(var(--ak-ui-muted-foreground));
}
.a-input__adornment:first-child {
  padding-inline-end: 0.5rem;
}
.a-input__adornment:last-child {
  padding-inline-start: 0.5rem;
}

.a-input__input {
  height: 100%;
  min-width: 0;
  flex: 1;
  background: transparent;
  border: 0;
  outline: none;
  color: inherit;
  font: inherit;
}
.a-input__input::placeholder {
  color: hsl(var(--ak-ui-muted-foreground));
}
.a-input__input:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Bare variant — plain input element. */
.a-input--bare {
  display: flex;
  width: 100%;
  border-radius: calc(var(--ak-ui-radius) - 2px);
  border: 1px solid hsl(var(--ak-ui-input));
  background: hsl(var(--ak-ui-background));
  color: hsl(var(--ak-ui-foreground));
  padding-block: 0.25rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: border-color 150ms;
  outline: none;
}
.a-input--bare::placeholder {
  color: hsl(var(--ak-ui-muted-foreground));
}
.a-input--bare:focus-visible {
  box-shadow: 0 0 0 1px hsl(var(--ak-ui-ring));
}
.a-input--bare:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Sizes — driven by `data-size`. Heights/paddings/font sizes mirror the shared scale
   in @alikhalilll/a-ui-base (xs 28 · sm 36 · md 43 · lg 52 · xl 60 px). */
[data-size='xs'] {
  height: 1.75rem;
  padding-inline: 0.5rem;
  font-size: 0.75rem;
}
[data-size='sm'] {
  height: 2.25rem;
  padding-inline: 0.625rem;
  font-size: 0.875rem;
}
[data-size='md'] {
  height: 43px;
  padding-inline: 0.75rem;
  font-size: 0.875rem;
}
[data-size='lg'] {
  height: 52px;
  padding-inline: 0.875rem;
  font-size: 1rem;
}
[data-size='xl'] {
  height: 60px;
  padding-inline: 1rem;
  font-size: 1rem;
}
</style>
