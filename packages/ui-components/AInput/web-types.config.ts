interface ComponentSpec {
  name: string;
  module: string;
  typesFile: string;
  props?: string;
  slots?: string;
  emits?: string;
}

export const components: ComponentSpec[] = [
  {
    name: 'AInput',
    module: '@alikhalilll/a-input',
    typesFile: 'types.ts',
    props: 'AInputProps',
    slots: 'AInputSlots',
    emits: 'AInputEmits',
  },
];
