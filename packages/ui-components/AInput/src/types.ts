import type { HTMLAttributes } from 'vue';
import type { Size } from '@alikhalilll/a-ui-base';

export interface AInputProps {
  defaultValue?: string | number;
  modelValue?: string | number;
  class?: HTMLAttributes['class'];
  /** Classes for the inner `<input>` element (useful when prefix/suffix are present). */
  inputClass?: HTMLAttributes['class'];
  /** Classes for the prefix wrapper. */
  prefixClass?: HTMLAttributes['class'];
  /** Classes for the suffix wrapper. */
  suffixClass?: HTMLAttributes['class'];
  size?: Size;
}

export interface AInputSlots {
  /** Content rendered inside the input's border, left of the field. */
  prefix?: () => unknown;
  /** Content rendered inside the input's border, right of the field. */
  suffix?: () => unknown;
}

export type AInputEmits = {
  'update:modelValue': [payload: string | number];
};
