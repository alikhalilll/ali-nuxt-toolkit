interface ComponentSpec {
  name: string;
  module: string;
  typesFile: string;
  props?: string;
  slots?: string;
  emits?: string;
}

const module = '@alikhalilll/a-drawer';

export const components: ComponentSpec[] = [
  {
    name: 'ADrawer',
    module,
    typesFile: 'src/types.ts',
    props: 'ADrawerProps',
    emits: 'ADrawerEmits',
  },
  { name: 'ADrawerTrigger', module, typesFile: 'src/types.ts', props: 'ADrawerTriggerProps' },
  {
    name: 'ADrawerContent',
    module,
    typesFile: 'src/types.ts',
    props: 'ADrawerContentProps',
    emits: 'ADrawerContentEmits',
  },
  { name: 'ADrawerOverlay', module, typesFile: 'src/types.ts', props: 'ADrawerOverlayProps' },
];
