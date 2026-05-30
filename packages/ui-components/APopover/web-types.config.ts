interface ComponentSpec {
  name: string;
  module: string;
  typesFile: string;
  props?: string;
  slots?: string;
  emits?: string;
}

const module = '@alikhalilll/a-popover';

export const components: ComponentSpec[] = [
  {
    name: 'APopover',
    module,
    typesFile: 'src/types.ts',
    props: 'APopoverProps',
    emits: 'APopoverEmits',
  },
  { name: 'APopoverTrigger', module, typesFile: 'src/types.ts', props: 'APopoverTriggerProps' },
  {
    name: 'APopoverContent',
    module,
    typesFile: 'src/types.ts',
    props: 'APopoverContentProps',
    emits: 'APopoverContentEmits',
  },
  { name: 'APopoverOverlay', module, typesFile: 'src/types.ts', props: 'APopoverOverlayProps' },
];
