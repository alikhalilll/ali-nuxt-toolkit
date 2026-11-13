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
    name: 'AGhostSkeleton',
    module: '@alikhalilll/a-ghost-skeleton',
    typesFile: 'src/types.ts',
    props: 'AGhostSkeletonProps',
    slots: 'AGhostSkeletonSlots',
    emits: 'AGhostSkeletonEmits',
  },
  {
    name: 'AGhostSkeletonBox',
    module: '@alikhalilll/a-ghost-skeleton',
    typesFile: 'src/types.ts',
    props: 'AGhostSkeletonBoxProps',
  },
  {
    name: 'AGhostSkeletonSuspense',
    module: '@alikhalilll/a-ghost-skeleton',
    typesFile: 'src/types.ts',
    props: 'AGhostSkeletonSuspenseProps',
    slots: 'AGhostSkeletonSuspenseSlots',
    emits: 'AGhostSkeletonSuspenseEmits',
  },
  {
    name: 'AGhostSkeletonProvider',
    module: '@alikhalilll/a-ghost-skeleton',
    typesFile: 'src/types.ts',
    props: 'AGhostSkeletonProviderProps',
    slots: 'AGhostSkeletonProviderSlots',
  },
];
