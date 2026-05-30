<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { cn } from '@alikhalilll/a-ui-base';
import {
  AResponsivePopover,
  AResponsivePopoverContent,
  AResponsivePopoverTrigger,
} from '@alikhalilll/a-responsive-popover';
import {
  usePhoneValidation,
  localizeCountries,
  type CountryOption,
} from '../composables/usePhoneValidation';
import { DEFAULT_SIZE } from '@alikhalilll/a-ui-base';
import type { ACountrySelectProps, ACountrySelectSlots } from '../types';
import ACountryFlag from './ACountryFlag.vue';
import { ChevronDownIcon, SearchIcon, CheckIcon } from '../icons';

const props = withDefaults(defineProps<ACountrySelectProps>(), {
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
});

defineSlots<ACountrySelectSlots>();

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

/** Trigger size — class is consumed by the scoped `<style>` block via `data-size`. The
 *  legacy `sizeClasses` slot prop is preserved for backwards compat but it's now an empty
 *  string (consumers should rely on `size` directly when overriding the trigger). */
const triggerSizeClasses = computed(() => '');

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
          :data-size="props.size"
          :class="cn('a-country-select__trigger', props.triggerClass)"
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
            <ChevronDownIcon class="a-country-select__chevron" :data-open="open ? '' : undefined" />
          </slot>
        </button>
      </slot>
    </AResponsivePopoverTrigger>

    <AResponsivePopoverContent
      align="end"
      :side-offset="6"
      :class="cn('a-country-select__content', props.contentClass)"
      :popover-class="cn('a-country-select__popover', props.popoverClass)"
      :drawer-class="cn('a-country-select__drawer', props.drawerClass)"
    >
      <!-- Search header -->
      <slot
        name="search"
        :value="search"
        :set-value="(v: string) => (search = v)"
        :is-searching="isSearching"
      >
        <div class="a-country-select__search">
          <div class="a-country-select__search-box">
            <slot name="search-icon">
              <SearchIcon class="a-country-select__search-icon" />
            </slot>
            <input
              v-model="search"
              type="text"
              data-slot="country-select-search"
              :placeholder="props.searchPlaceholder"
              class="a-country-select__search-input"
            />
            <kbd
              v-if="!isSearching && props.kbdOpen"
              class="a-country-select__kbd a-country-select__kbd--open"
            >
              {{ props.kbdOpen }}
            </kbd>
            <kbd
              v-else-if="isSearching && props.kbdClose"
              class="a-country-select__kbd a-country-select__kbd--close"
            >
              {{ props.kbdClose }}
            </kbd>
          </div>
        </div>
      </slot>

      <!-- List -->
      <div class="a-country-select__list">
        <slot v-if="isCountriesLoading && effectiveCountries.length === 0" name="loading">
          <div class="a-country-select__loading">
            {{ props.loadingText }}
          </div>
        </slot>

        <slot v-else-if="isSearching && filtered.length === 0" name="empty" :query="search">
          <div class="a-country-select__empty">
            {{ props.emptyText }}
          </div>
        </slot>

        <template v-else>
          <!-- Suggested group -->
          <section
            v-if="suggested.length > 0"
            data-slot="country-select-group"
            data-group="suggested"
            class="a-country-select__section"
          >
            <slot name="group-header" :label="props.suggestedLabel" group="suggested">
              <header class="a-country-select__group-header">
                {{ props.suggestedLabel }}
              </header>
            </slot>
            <ul
              role="listbox"
              :aria-label="props.suggestedLabel"
              class="a-country-select__group-list"
            >
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
                    class="a-country-select__item"
                    @click="selectCountry(option)"
                  >
                    <slot name="flag" :country="option" context="item">
                      <ACountryFlag
                        :iso2="option.raw_data.iso2"
                        :src="option.raw_data.flag"
                        :flag-url="props.flagUrl"
                      />
                    </slot>
                    <span class="a-country-select__item-name">{{ option.raw_data.name }}</span>
                    <span class="a-country-select__item-dial">{{ option.raw_data.dial_code }}</span>
                    <slot v-if="option.value === selected" name="item-check" :country="option">
                      <CheckIcon class="a-country-select__item-check" />
                    </slot>
                  </button>
                </slot>
              </li>
            </ul>
          </section>

          <!-- All countries / search results -->
          <section
            data-slot="country-select-group"
            data-group="all"
            class="a-country-select__section"
          >
            <slot
              v-if="!isSearching && allCountries.length > 0"
              name="group-header"
              :label="props.allCountriesLabel"
              group="all"
            >
              <header class="a-country-select__group-header">
                {{ props.allCountriesLabel }}
              </header>
            </slot>
            <ul
              role="listbox"
              :aria-label="isSearching ? props.searchPlaceholder : props.allCountriesLabel"
              class="a-country-select__group-list"
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
                    class="a-country-select__item"
                    @click="selectCountry(option)"
                  >
                    <slot name="flag" :country="option" context="item">
                      <ACountryFlag
                        :iso2="option.raw_data.iso2"
                        :src="option.raw_data.flag"
                        :flag-url="props.flagUrl"
                      />
                    </slot>
                    <span class="a-country-select__item-name">{{ option.raw_data.name }}</span>
                    <span class="a-country-select__item-dial">{{ option.raw_data.dial_code }}</span>
                    <slot v-if="option.value === selected" name="item-check" :country="option">
                      <CheckIcon class="a-country-select__item-check" />
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

<style scoped>
/* ------------------------------------------------------------
 * In-tree (non-teleported) styles — only the trigger button.
 * ---------------------------------------------------------- */
.a-country-select__trigger {
  display: inline-flex;
  height: 100%;
  flex-shrink: 0;
  align-items: center;
  gap: 0.375rem;
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: background-color 150ms;
  outline: none;
  color: inherit;
  font: inherit;
}
.a-country-select__trigger:hover,
.a-country-select__trigger:focus-visible,
.a-country-select__trigger[data-state='open'] {
  background: hsl(var(--ak-ui-muted));
}
.a-country-select__trigger:focus-visible {
  box-shadow: inset 0 0 0 1px hsl(var(--ak-ui-ring));
}
.a-country-select__trigger:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.a-country-select__trigger[data-size='xs'] {
  padding: 0 0.5rem;
  font-size: 0.75rem;
}
.a-country-select__trigger[data-size='sm'] {
  padding: 0 0.625rem;
  font-size: 0.875rem;
}
.a-country-select__trigger[data-size='md'] {
  padding: 0 0.75rem;
  font-size: 0.875rem;
}
.a-country-select__trigger[data-size='lg'] {
  padding: 0 0.875rem;
  font-size: 1rem;
}
.a-country-select__trigger[data-size='xl'] {
  padding: 0 1rem;
  font-size: 1rem;
}

.a-country-select__chevron {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
  color: hsl(var(--ak-ui-muted-foreground));
  transition: transform 200ms;
}
.a-country-select__chevron[data-open] {
  transform: rotate(180deg);
}
</style>

<!--
  The popover content is teleported to <body> by AResponsivePopoverContent (reka-ui Popover
  or vaul-vue Drawer). Vue's `<style scoped>` data-attribute does NOT propagate to teleported
  nodes, so the dropdown UI is styled in this unscoped block. Class names are uniquely
  prefixed `a-country-select__*` to avoid collisions.
-->
<style>
.a-country-select__content {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}
.a-country-select__popover {
  width: min(20rem, calc(100vw - 2rem));
  max-height: min(22rem, var(--reka-popover-content-available-height));
}
.a-country-select__drawer {
  max-height: 80vh;
  padding-bottom: 1rem;
}

.a-country-select__search {
  border-bottom: 1px solid hsl(var(--ak-ui-border) / 0.7);
  padding: 0.375rem;
}
.a-country-select__search-box {
  position: relative;
  display: flex;
  align-items: center;
  background: hsl(var(--ak-ui-muted) / 0.4);
  border-radius: calc(var(--ak-ui-radius) - 2px);
  box-shadow: 0 0 0 1px hsl(var(--ak-ui-border) / 0.7);
  transition: box-shadow 150ms;
}
.a-country-select__search-box:focus-within {
  box-shadow: 0 0 0 1px hsl(var(--ak-ui-ring) / 0.5);
}
.a-country-select__search-icon {
  position: absolute;
  top: 50%;
  inset-inline-start: 0.625rem;
  width: 0.875rem;
  height: 0.875rem;
  transform: translateY(-50%);
  color: hsl(var(--ak-ui-muted-foreground));
  pointer-events: none;
}
.a-country-select__search-input {
  height: 2.5rem;
  width: 100%;
  background: transparent;
  border: 0;
  padding-inline-start: 2rem;
  padding-inline-end: 3.5rem;
  font-size: 0.875rem;
  outline: none;
  color: inherit;
  font-family: inherit;
}
.a-country-select__search-input::placeholder {
  color: hsl(var(--ak-ui-muted-foreground));
}
.a-country-select__kbd {
  position: absolute;
  top: 50%;
  inset-inline-end: 0.5rem;
  display: none;
  align-items: center;
  gap: 0.125rem;
  background: hsl(var(--ak-ui-background));
  color: hsl(var(--ak-ui-muted-foreground));
  border: 1px solid hsl(var(--ak-ui-border));
  border-radius: 0.25rem;
  padding: 0.125rem 0.375rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  letter-spacing: -0.025em;
  transform: translateY(-50%);
}
@media (min-width: 768px) {
  .a-country-select__kbd--open {
    display: inline-flex;
  }
  .a-country-select__kbd--close {
    display: inline-block;
  }
}

.a-country-select__list {
  flex: 1;
  overflow-y: auto;
  /* Themed scrollbar — Firefox + WebKit/Blink. Resolves the browser-default
     light-grey scrollbar that didn't match the popover surface in dark mode. */
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--ak-ui-muted-foreground) / 0.4) transparent;
}
.a-country-select__list::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.a-country-select__list::-webkit-scrollbar-track {
  background: transparent;
}
.a-country-select__list::-webkit-scrollbar-thumb {
  background-color: hsl(var(--ak-ui-muted-foreground) / 0.4);
  border-radius: 4px;
}
.a-country-select__list::-webkit-scrollbar-thumb:hover {
  background-color: hsl(var(--ak-ui-muted-foreground) / 0.6);
}
.a-country-select__loading,
.a-country-select__empty {
  color: hsl(var(--ak-ui-muted-foreground));
  padding: 1rem;
  text-align: center;
  font-size: 0.875rem;
}

.a-country-select__group-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: hsl(var(--ak-ui-popover));
  color: hsl(var(--ak-ui-muted-foreground));
  padding: 0.375rem 0.75rem;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin: 0;
}

.a-country-select__group-list {
  list-style: none;
  margin: 0;
  padding: 0 0 0.25rem;
}

.a-country-select__item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  text-align: start;
  font-size: 0.875rem;
  background: transparent;
  border: 0;
  cursor: pointer;
  color: inherit;
  transition: background-color 150ms;
  outline: none;
  font-family: inherit;
}
.a-country-select__item:hover,
.a-country-select__item:focus-visible {
  background: hsl(var(--ak-ui-muted) / 0.6);
}
.a-country-select__item[data-selected] {
  background: hsl(var(--ak-ui-muted));
}
.a-country-select__item:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}
.a-country-select__item:disabled:hover {
  background: transparent;
}

.a-country-select__item-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.a-country-select__item-dial {
  color: hsl(var(--ak-ui-muted-foreground));
  font-variant-numeric: tabular-nums;
}
.a-country-select__item-check {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
  color: hsl(var(--ak-ui-foreground));
}
</style>
