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
    name: 'ASmartSkeleton',
    module: '@alikhalilll/a-smart-skeleton',
    typesFile: 'src/types.ts',
    props: 'ASmartSkeletonProps',
    slots: 'ASmartSkeletonSlots',
    emits: 'ASmartSkeletonEmits',
  },
  {
    name: 'ASmartSkeletonBox',
    module: '@alikhalilll/a-smart-skeleton',
    typesFile: 'src/types.ts',
    props: 'ASmartSkeletonBoxProps',
  },
  {
    name: 'ASmartSkeletonSuspense',
    module: '@alikhalilll/a-smart-skeleton',
    typesFile: 'src/types.ts',
    props: 'ASmartSkeletonSuspenseProps',
    slots: 'ASmartSkeletonSuspenseSlots',
    emits: 'ASmartSkeletonSuspenseEmits',
  },
  {
    name: 'ASmartSkeletonProvider',
    module: '@alikhalilll/a-smart-skeleton',
    typesFile: 'src/types.ts',
    props: 'ASmartSkeletonProviderProps',
    slots: 'ASmartSkeletonProviderSlots',
  },
];
