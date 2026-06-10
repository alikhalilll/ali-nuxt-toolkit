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
    name: 'ASkeleton',
    module: '@alikhalilll/a-skeleton',
    typesFile: 'src/types.ts',
    props: 'ASkeletonProps',
    slots: 'ASkeletonSlots',
  },
  {
    name: 'ASkeletonLayer',
    module: '@alikhalilll/a-skeleton',
    typesFile: 'src/types.ts',
    props: 'ASkeletonLayerProps',
  },
  {
    name: 'ASkeletonBlock',
    module: '@alikhalilll/a-skeleton',
    typesFile: 'src/types.ts',
    props: 'ASkeletonBlockProps',
  },
];
