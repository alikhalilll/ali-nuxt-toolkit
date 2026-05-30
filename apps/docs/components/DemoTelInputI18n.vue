<script setup lang="ts">
import { computed, ref } from 'vue';
import { ATelInput } from '@alikhalilll/a-tel-input';

const phone = ref('');
const country = ref<number | null>(null);

const tellRef = ref<InstanceType<typeof ATelInput> | null>(null);
const validation = computed(() => tellRef.value?.validation);

const arabicMessages = {
  searchPlaceholder: 'ابحث عن دولة أو +رمز…',
  emptyText: 'لا توجد دول.',
  loadingText: 'جارٍ تحميل الدول…',
  suggestedLabel: 'مقترحة',
  allCountriesLabel: 'كل الدول',
  phoneInputLabel: 'رقم الهاتف',
  selectCountryLabel: 'اختر دولة',
  countryLabel: 'الدولة',
  errorMessages: {
    too_short: 'الرقم قصير جدًا',
    too_long: 'الرقم طويل جدًا',
    invalid_phone: 'الرقم غير صحيح',
  },
};

const source = `<script setup lang="ts">
import { ref } from 'vue';
import { ATelInput } from '@alikhalilll/a-tel-input';

const phone = ref('');
const country = ref<number | null>(null);
\u003c/script>

<template>
  <div dir="rtl">
    <ATelInput
      v-model:phone="phone"
      v-model:country="country"
      locale="ar"
      default-country="20"
      show-validation
      :messages="{
        searchPlaceholder: 'ابحث عن دولة أو +رمز…',
        emptyText: 'لا توجد دول.',
        loadingText: 'جارٍ تحميل الدول…',
        suggestedLabel: 'مقترحة',
        allCountriesLabel: 'كل الدول',
        phoneInputLabel: 'رقم الهاتف',
        selectCountryLabel: 'اختر دولة',
        errorMessages: {
          too_short: 'الرقم قصير جدًا',
          invalid_phone: 'الرقم غير صحيح',
        },
      }"
    />
  </div>
</template>`;
</script>

<template>
  <div class="my-4 rounded-lg border border-border bg-surface p-5">
    <h4 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      Live · Arabic locale + messages
    </h4>

    <p class="mb-4 text-sm text-text-dim">
      <code>locale="ar"</code> localises country names via <code>Intl.DisplayNames</code> and the
      format hint's numerals; <code>:messages</code> localises every UI string. Open the picker —
      country names render in Arabic and search matches both Arabic and English spellings.
    </p>

    <DemoTabs :code="source">
      <div class="p-5">
        <div class="max-w-sm" dir="rtl">
          <ATelInput
            ref="tellRef"
            v-model:phone="phone"
            v-model:country="country"
            locale="ar"
            default-country="20"
            show-validation
            :messages="arabicMessages"
          />
        </div>

        <pre
          class="mt-4 whitespace-pre-wrap break-all rounded-md border border-border bg-code-bg p-3 font-mono text-[12px] text-text-dim"
          >{{
            JSON.stringify(
              {
                country,
                phone,
                validation: validation && { ok: validation.ok, full_phone: validation.full_phone },
              },
              null,
              2
            )
          }}</pre
        >
      </div>
    </DemoTabs>
  </div>
</template>
