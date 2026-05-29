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
    typesFile: 'types.ts',
    props: 'AResponsivePopoverProps',
    emits: 'AResponsivePopoverEmits',
    slots: 'AResponsivePopoverSlots',
  },
  { name: 'AResponsivePopoverTrigger', module, typesFile: 'types.ts' },
  { name: 'AResponsivePopoverContent', module, typesFile: 'types.ts' },
];
