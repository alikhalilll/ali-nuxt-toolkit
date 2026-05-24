<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { computed, onMounted, ref, watch } from 'vue';
import { Check, ChevronDown, Search } from 'lucide-vue-next';
import { cn } from '@/utils';
import {
  AResponsivePopover,
  AResponsivePopoverContent,
  AResponsivePopoverTrigger,
} from '@/entries/responsive-popover';
import {
  usePhoneValidation,
  localizeCountries,
  type CountryOption,
} from '../composables/usePhoneValidation';
import { controlPaddingX, controlTextSize, DEFAULT_SIZE, type Size } from '@/utils';
import ACountryFlag from './ACountryFlag.vue';

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class'];
    triggerClass?: HTMLAttributes['class'];
    contentClass?: HTMLAttributes['class'];
    popoverClass?: HTMLAttributes['class'];
    drawerClass?: HTMLAttributes['class'];
    searchPlaceholder?: string;
    emptyText?: string;
    loadingText?: string;
    suggestedLabel?: string;
    allCountriesLabel?: string;
    /** ISO2 codes that are selectable. Others are listed but disabled. */
    allowedDialCodes?: string[];
    disabled?: boolean;
    /** Drives the trigger button padding + text size. Matches ATellInput's `size`. */
    size?: Size;
    /** Max items rendered under the "Suggested" header (current + recents, deduped). */
    suggestedLimit?: number;
    /** Cap the number of matching countries shown in search results. */
    maxResults?: number;
    /** Override the flag URL builder, e.g. `(iso, w) => \`/flags/${iso}.svg\``. */
    flagUrl?: (iso2: string, width: number) => string;
    /**
     * Custom search predicate. Default: substring match on the precomputed `search_key`.
     * Return `true` to keep the country in results.
     */
    searcher?: (query: string, country: CountryOption) => boolean;
    /**
     * Provide your own country list (bypasses the REST Countries fetch). Useful when you
     * already have a curated subset, an i18n'd list, or want to avoid the network call.
     */
    countries?: CountryOption[];
    /** Override the right-side kbd hints. Pass `null` to hide. */
    kbdOpen?: string | null;
    kbdClose?: string | null;
    /** BCP-47 locale — country names render localized via `Intl.DisplayNames`. */
    locale?: string;
    /** Prefix of the trigger's `aria-label` when a country is selected, e.g. `"Country"`. */
    countryLabel?: string;
    /** Trigger's `aria-label` when no country is selected. */
    selectCountryLabel?: string;
    /**
     * How page scroll is blocked while the popover is open. Defaults to `'events'` — an
     * event-based lock that keeps the page scrollbar visible and `position: sticky` working.
     * Pass `'body'` for the legacy `body { overflow: hidden }` lock, or `'none'` to allow
     * the page to scroll freely.
     */
    scrollLock?: 'events' | 'body' | 'none';
  }>(),
  {
    searchPlaceholder: 'Search country or +code…',
    emptyText: 'No countries found.',
    loadingText: 'Loading countries…',
    suggestedLabel: 'Suggested',
    allCountriesLabel: 'All countries',
    countryLabel: 'Country',
    selectCountryLabel: 'Select country',
    size: DEFAULT_SIZE,
    suggestedLimit: 4,
    maxResults: 80,
    kbdOpen: '⌘K',
    kbdClose: 'Esc',
  }
);

defineSlots<{
  /** Replace the entire country picker trigger button. */
  trigger?: (props: {
    selectedCountry: CountryOption | null;
    open: boolean;
    sizeClasses: string;
  }) => unknown;
  /** Replace the chevron icon. */
  chevron?: (props: { open: boolean }) => unknown;
  /** Replace just the flag rendered in the trigger and items. */
  flag?: (props: { country: CountryOption; context: 'trigger' | 'item' }) => unknown;
  /** Replace the entire search bar (input + icon + kbd). */
  search?: (props: {
    value: string;
    setValue: (v: string) => void;
    isSearching: boolean;
  }) => unknown;
  /** Replace the search-bar leading icon. */
  'search-icon'?: () => unknown;
  /** Replace the loading state. */
  loading?: () => unknown;
  /** Replace the empty/no-results state. */
  empty?: (props: { query: string }) => unknown;
  /** Replace a section header. */
  'group-header'?: (props: { label: string; group: 'suggested' | 'all' }) => unknown;
  /** Replace each country list row. Default render still available via &lt;ACountrySelectItem /&gt;. */
  item?: (props: {
    country: CountryOption;
    selected: boolean;
    disabled: boolean;
    select: () => void;
  }) => unknown;
  /** Replace just the right-side check icon for the selected row. */
  'item-check'?: (props: { country: CountryOption }) => unknown;
}>();

const triggerSizeClasses = computed(
  () => `${controlPaddingX[props.size]} ${controlTextSize[props.size]}`
);

const selected = defineModel<string>('selected', { default: '' });

const {
  countries: internalCountries,
  isCountriesLoading,
  getCountries,
  searchCountries: defaultSearch,
  getCountryByValue: lookupInternal,
} = usePhoneValidation();

const open = ref(false);
const search = ref('');

void getCountries();

/* ---------------------------------------------------------------
 * Country source — either the user-supplied list (props.countries)
 * or the internal REST Countries + localStorage cache. A `locale`
 * localizes the internal list's display names via `Intl.DisplayNames`;
 * a caller-supplied `countries` list is used verbatim (caller owns names).
 * ------------------------------------------------------------- */
const effectiveCountries = computed<CountryOption[]>(() =>
  props.countries && props.countries.length
    ? props.countries
    : localizeCountries(internalCountries.value, props.locale)
);

const effectiveByValue = computed<Map<string, CountryOption>>(
  () => new Map(effectiveCountries.value.map((c) => [c.value, c]))
);

function lookup(iso2: string): CountryOption | null {
  if (!iso2) return null;
  return effectiveByValue.value.get(iso2) ?? lookupInternal(iso2);
}

/* ---------------------------------------------------------------
 * Recent picks — persisted so subsequent visits surface the user's
 * actual countries above the long alphabetical list.
 * ------------------------------------------------------------- */
const RECENTS_KEY = 'ali_ui_country_recents_v1';
const recents = ref<string[]>([]);

function loadRecents() {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    recents.value = parsed.filter((v): v is string => typeof v === 'string').slice(0, 8);
  } catch {
    /* ignore corrupt cache */
  }
}

function pushRecent(iso2: string) {
  if (typeof window === 'undefined' || !iso2) return;
  const next = [iso2, ...recents.value.filter((x) => x !== iso2)].slice(0, 8);
  recents.value = next;
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    /* quota or storage disabled */
  }
}

onMounted(loadRecents);

/* ---------------------------------------------------------------
 * Section state
 * ------------------------------------------------------------- */
const isSearching = computed(() => search.value.trim().length > 0);

function defaultSearcher(q: string, c: CountryOption): boolean {
  return c.search_key.includes(q.toLowerCase());
}

const filtered = computed<CountryOption[]>(() => {
  if (!isSearching.value) return [];
  // When the caller didn't override the country source, the internal `searchCountries`
  // is already optimal (uses the precomputed search_key + early break). Fall back to a
  // manual filter when we need to honor a custom `searcher`/`countries` source, or a
  // `locale` (whose localized `search_key` lives only on `effectiveCountries`).
  if (!props.countries && !props.searcher && !props.locale) {
    return defaultSearch(search.value, props.maxResults);
  }
  const q = search.value.trim();
  const matcher = props.searcher ?? defaultSearcher;
  const out: CountryOption[] = [];
  for (const c of effectiveCountries.value) {
    if (matcher(q, c)) {
      out.push(c);
      if (out.length >= props.maxResults) break;
    }
  }
  return out;
});

const suggested = computed<CountryOption[]>(() => {
  if (isSearching.value) return [];
  const seen = new Set<string>();
  const out: CountryOption[] = [];
  const candidate = (iso: string) => {
    if (!iso || seen.has(iso)) return;
    const c = lookup(iso);
    if (!c) return;
    seen.add(iso);
    out.push(c);
  };
  candidate(selected.value);

  const allowed = props.allowedDialCodes;
  const hasAllowed = Array.isArray(allowed) && allowed.length > 0;
  if (hasAllowed) {
    // Surface every whitelisted country in the Suggested group — they're the only
    // selectable options, so they belong at the top and the recents/limit logic is
    // irrelevant here.
    for (const c of effectiveCountries.value) {
      if (allowed.includes(c.raw_data.dial_digits)) candidate(c.value);
    }
    return out;
  }

  for (const r of recents.value) {
    candidate(r);
    if (out.length >= props.suggestedLimit) break;
  }
  return out.slice(0, props.suggestedLimit);
});

const allCountries = computed<CountryOption[]>(() => {
  if (isSearching.value) return [];
  return effectiveCountries.value;
});

const selectedCountry = computed<CountryOption | null>(() => lookup(selected.value));

function isAllowed(option: CountryOption) {
  const allowed = props.allowedDialCodes;
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(option.raw_data.dial_digits);
}

function selectCountry(option: CountryOption) {
  if (!isAllowed(option)) return;
  selected.value = option.value;
  pushRecent(option.value);
  open.value = false;
}

watch(open, (isOpen) => {
  if (!isOpen) search.value = '';
});

defineExpose({
  open,
  setOpen: (v: boolean) => (open.value = v),
  search,
  setSearch: (v: string) => (search.value = v),
  selectedCountry,
  selectCountry,
  countries: effectiveCountries,
  recents,
});
</script>

<template>
  <AResponsivePopover v-model:open="open" :scroll-lock="props.scrollLock">
    <AResponsivePopoverTrigger as-child>
      <slot
        name="trigger"
        :selected-country="selectedCountry"
        :open="open"
        :size-classes="triggerSizeClasses"
      >
        <button
          type="button"
          :disabled="props.disabled"
          data-slot="country-select-trigger"
          :data-state="open ? 'open' : 'closed'"
          :class="
            cn(
              'bg-transparent hover:bg-muted focus-visible:bg-muted data-[state=open]:bg-muted focus-visible:ring-ring inline-flex h-full shrink-0 items-center gap-1.5 transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
              triggerSizeClasses,
              props.triggerClass
            )
          "
          :aria-label="
            selectedCountry
              ? `${props.countryLabel}: ${selectedCountry.raw_data.name}`
              : props.selectCountryLabel
          "
        >
          <slot v-if="selectedCountry" name="flag" :country="selectedCountry" context="trigger">
            <ACountryFlag
              :iso2="selectedCountry.raw_data.iso2"
              :src="selectedCountry.raw_data.flag"
              :flag-url="props.flagUrl"
            />
          </slot>
          <slot name="chevron" :open="open">
            <ChevronDown
              class="text-muted-foreground size-3.5 shrink-0 transition-transform duration-200"
              :class="open && 'rotate-180'"
            />
          </slot>
        </button>
      </slot>
    </AResponsivePopoverTrigger>

    <AResponsivePopoverContent
      align="end"
      :side-offset="6"
      :class="cn('flex flex-col overflow-hidden p-0', props.contentClass)"
      :popover-class="
        cn(
          'w-[min(20rem,calc(100vw-2rem))] max-h-[min(22rem,var(--reka-popover-content-available-height))]',
          props.popoverClass
        )
      "
      :drawer-class="cn('max-h-[80vh] pb-4', props.drawerClass)"
    >
      <!-- Search header -->
      <slot
        name="search"
        :value="search"
        :set-value="(v: string) => (search = v)"
        :is-searching="isSearching"
      >
        <div class="border-border/70 border-b p-1.5">
          <div
            class="bg-muted/40 ring-border/70 focus-within:ring-ring/50 relative flex items-center rounded-md ring-1 transition-shadow"
          >
            <slot name="search-icon">
              <Search
                class="text-muted-foreground absolute top-1/2 start-2.5 size-3.5 -translate-y-1/2"
              />
            </slot>
            <input
              v-model="search"
              type="text"
              data-slot="country-select-search"
              :placeholder="props.searchPlaceholder"
              class="placeholder:text-muted-foreground h-10 w-full bg-transparent pe-14 ps-8 text-sm outline-none"
            />
            <kbd
              v-if="!isSearching && props.kbdOpen"
              class="bg-background text-muted-foreground border-border absolute top-1/2 end-2 hidden -translate-y-1/2 items-center gap-0.5 rounded border px-1.5 py-0.5 font-mono text-[10px] tracking-tight md:inline-flex"
            >
              {{ props.kbdOpen }}
            </kbd>
            <kbd
              v-else-if="isSearching && props.kbdClose"
              class="bg-background text-muted-foreground border-border absolute top-1/2 end-2 hidden -translate-y-1/2 rounded border px-1.5 py-0.5 font-mono text-[10px] tracking-tight md:inline-block"
            >
              {{ props.kbdClose }}
            </kbd>
          </div>
        </div>
      </slot>

      <!-- List -->
      <div class="flex-1 overflow-y-auto">
        <slot v-if="isCountriesLoading && effectiveCountries.length === 0" name="loading">
          <div class="text-muted-foreground p-4 text-center text-sm">
            {{ props.loadingText }}
          </div>
        </slot>

        <slot v-else-if="isSearching && filtered.length === 0" name="empty" :query="search">
          <div class="text-muted-foreground p-4 text-center text-sm">
            {{ props.emptyText }}
          </div>
        </slot>

        <template v-else>
          <!-- Suggested group -->
          <section
            v-if="suggested.length > 0"
            data-slot="country-select-group"
            data-group="suggested"
          >
            <slot name="group-header" :label="props.suggestedLabel" group="suggested">
              <header
                class="text-muted-foreground bg-popover sticky top-0 z-10 px-3 py-1.5 text-[10px] font-medium tracking-wider uppercase"
              >
                {{ props.suggestedLabel }}
              </header>
            </slot>
            <ul role="listbox" :aria-label="props.suggestedLabel" class="pb-1">
              <li
                v-for="option in suggested"
                :key="`s-${option.value}`"
                role="option"
                :aria-selected="option.value === selected"
                :aria-disabled="!isAllowed(option)"
              >
                <slot
                  name="item"
                  :country="option"
                  :selected="option.value === selected"
                  :disabled="!isAllowed(option)"
                  :select="() => selectCountry(option)"
                >
                  <button
                    type="button"
                    :disabled="!isAllowed(option)"
                    data-slot="country-select-item"
                    :data-selected="option.value === selected ? '' : undefined"
                    class="hover:bg-muted/60 focus-visible:bg-muted/60 data-[selected]:bg-muted flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                    @click="selectCountry(option)"
                  >
                    <slot name="flag" :country="option" context="item">
                      <ACountryFlag
                        :iso2="option.raw_data.iso2"
                        :src="option.raw_data.flag"
                        :flag-url="props.flagUrl"
                      />
                    </slot>
                    <span class="flex-1 truncate">{{ option.raw_data.name }}</span>
                    <span class="text-muted-foreground tabular-nums">{{
                      option.raw_data.dial_code
                    }}</span>
                    <slot v-if="option.value === selected" name="item-check" :country="option">
                      <Check class="text-foreground size-3.5 shrink-0" />
                    </slot>
                  </button>
                </slot>
              </li>
            </ul>
          </section>

          <!-- All countries / search results -->
          <section data-slot="country-select-group" data-group="all">
            <slot
              v-if="!isSearching && allCountries.length > 0"
              name="group-header"
              :label="props.allCountriesLabel"
              group="all"
            >
              <header
                class="text-muted-foreground bg-popover sticky top-0 z-10 px-3 py-1.5 text-[10px] font-medium tracking-wider uppercase"
              >
                {{ props.allCountriesLabel }}
              </header>
            </slot>
            <ul
              role="listbox"
              :aria-label="isSearching ? props.searchPlaceholder : props.allCountriesLabel"
              class="pb-1"
            >
              <li
                v-for="option in isSearching ? filtered : allCountries"
                :key="option.value"
                role="option"
                :aria-selected="option.value === selected"
                :aria-disabled="!isAllowed(option)"
              >
                <slot
                  name="item"
                  :country="option"
                  :selected="option.value === selected"
                  :disabled="!isAllowed(option)"
                  :select="() => selectCountry(option)"
                >
                  <button
                    type="button"
                    :disabled="!isAllowed(option)"
                    data-slot="country-select-item"
                    :data-selected="option.value === selected ? '' : undefined"
                    class="hover:bg-muted/60 focus-visible:bg-muted/60 data-[selected]:bg-muted flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                    @click="selectCountry(option)"
                  >
                    <slot name="flag" :country="option" context="item">
                      <ACountryFlag
                        :iso2="option.raw_data.iso2"
                        :src="option.raw_data.flag"
                        :flag-url="props.flagUrl"
                      />
                    </slot>
                    <span class="flex-1 truncate">{{ option.raw_data.name }}</span>
                    <span class="text-muted-foreground tabular-nums">{{
                      option.raw_data.dial_code
                    }}</span>
                    <slot v-if="option.value === selected" name="item-check" :country="option">
                      <Check class="text-foreground size-3.5 shrink-0" />
                    </slot>
                  </button>
                </slot>
              </li>
            </ul>
          </section>
        </template>
      </div>
    </AResponsivePopoverContent>
  </AResponsivePopover>
</template>
