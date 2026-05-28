<!--
  Validation fixture: every auto-imported component from `@alikhalilll/ui/nuxt`
  is used here WITHOUT an explicit `import`. If a consumer's editor would fail
  to surface a component via auto-completion (i.e. it's missing from the Nuxt
  module's registry), vue-tsc fails on this file with "Cannot find name"
  or "is not a known element" — same signal the consumer would get in their
  IDE.

  Each component is used with at least one prop that exercises its public type
  so a shape regression (e.g. `size` losing the `'md'` literal) trips here.

  Do NOT add explicit `import` statements — that would defeat the test. The
  whole point is to validate the Nuxt auto-import surface end-to-end.
-->
<script setup lang="ts">
const phone = ref('');
const country = ref<number | null>(null);
const popOpen = ref(false);
const drawerOpen = ref(false);
const respOpen = ref(false);
const text = ref('');
</script>

<template>
  <div>
    <!-- tell-input subpath -->
    <ATellInput
      v-model:phone="phone"
      v-model:country="country"
      size="md"
      show-validation
      detect-country="auto"
    />
    <ACountrySelect v-model:selected="text" size="md" />
    <ACountryFlag iso2="US" :width="40" />

    <!-- input subpath -->
    <AInput v-model="text" placeholder="hello" />

    <!-- popover subpath -->
    <APopover v-model:open="popOpen">
      <APopoverTrigger>Open</APopoverTrigger>
      <APopoverContent>
        <APopoverOverlay />
        Content
      </APopoverContent>
    </APopover>

    <!-- drawer subpath -->
    <ADrawer v-model:open="drawerOpen">
      <ADrawerTrigger>Open</ADrawerTrigger>
      <ADrawerContent>
        <ADrawerOverlay />
        Content
      </ADrawerContent>
    </ADrawer>

    <!-- responsive-popover subpath -->
    <AResponsivePopover v-model:open="respOpen">
      <AResponsivePopoverTrigger>Open</AResponsivePopoverTrigger>
      <AResponsivePopoverContent>Content</AResponsivePopoverContent>
    </AResponsivePopover>
  </div>
</template>
