interface ComponentSpec {
  name: string;
  module: string;
  typesFile: string;
  props?: string;
  slots?: string;
  emits?: string;
}

const module = '@alikhalilll/a-tel-input';
const typesFile = 'utils/types.ts';

export const components: ComponentSpec[] = [
  {
    name: 'ATelInput',
    module,
    typesFile,
    props: 'ATelInputProps',
    slots: 'ATelInputSlots',
    emits: 'ATelInputEmits',
  },
  {
    name: 'ACountrySelect',
    module,
    typesFile,
    props: 'ACountrySelectProps',
    slots: 'ACountrySelectSlots',
    emits: 'ACountrySelectEmits',
  },
  {
    name: 'ACountryFlag',
    module,
    typesFile,
    props: 'ACountryFlagProps',
    slots: 'ACountryFlagSlots',
  },
];
