<script setup lang="ts">
import { computed, useSlots } from 'vue';
import { useVModel } from '@vueuse/core';
import { cn } from '@alikhalilll/a-ui-base';
import {
  controlHeight,
  controlPaddingX,
  controlTextSize,
  DEFAULT_SIZE,
} from '@alikhalilll/a-ui-base';
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

const sizeHeight = computed(() => controlHeight[props.size]);
const sizePaddingX = computed(() => controlPaddingX[props.size]);
const sizeText = computed(() => controlTextSize[props.size]);
</script>

<template>
  <!--
    When prefix or suffix slots are filled we render a wrapper that owns the border,
    background and focus ring — so the visible "input" is the whole bar, not just the
    native element. Otherwise we render the plain native input directly so consumers
    can use AInput as a drop-in for <input>.
  -->
  <div
    v-if="hasAdornment"
    :data-size="props.size"
    :class="
      cn(
        'border-input bg-background ring-offset-background focus-within:ring-ring inline-flex w-full items-center rounded-md border shadow-sm transition-colors focus-within:ring-1',
        sizeHeight,
        sizePaddingX,
        sizeText,
        props.class
      )
    "
  >
    <span
      v-if="hasPrefix"
      :class="cn('text-muted-foreground flex shrink-0 items-center pr-2', props.prefixClass)"
    >
      <slot name="prefix" />
    </span>

    <input
      v-model="modelValue"
      data-slot="input"
      :class="
        cn(
          'placeholder:text-muted-foreground h-full min-w-0 flex-1 bg-transparent outline-none disabled:cursor-not-allowed disabled:opacity-50',
          props.inputClass
        )
      "
    />

    <span
      v-if="hasSuffix"
      :class="cn('text-muted-foreground flex shrink-0 items-center pl-2', props.suffixClass)"
    >
      <slot name="suffix" />
    </span>
  </div>

  <input
    v-else
    v-model="modelValue"
    data-slot="input"
    :data-size="props.size"
    :class="
      cn(
        'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border py-1 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        sizeHeight,
        sizePaddingX,
        sizeText,
        props.class
      )
    "
  />
</template>
