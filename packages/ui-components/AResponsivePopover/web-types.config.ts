interface ComponentSpec {
  name: string;
  module: string;
  typesFile: string;
  props?: string;
  slots?: string;
  emits?: string;
}

const module = '@alikhalilll/a-responsive-popover';

export const components: ComponentSpec[] = [
  {
    name: 'AResponsivePopover',
    module,
    typesFile: 'src/types.ts',
    props: 'AResponsivePopoverProps',
    emits: 'AResponsivePopoverEmits',
    slots: 'AResponsivePopoverSlots',
  },
  { name: 'AResponsivePopoverTrigger', module, typesFile: 'src/types.ts' },
  { name: 'AResponsivePopoverContent', module, typesFile: 'src/types.ts' },
];
