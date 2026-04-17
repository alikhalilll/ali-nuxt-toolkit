<template>
  <aside
    class="sticky top-20 hidden max-h-[calc(100vh-6rem)] self-start overflow-y-auto text-sm md:block"
  >
    <h4 class="mb-1.5 mt-4 text-[11px] font-bold uppercase tracking-widest text-text-dim first:mt-0">
      Overview
    </h4>
    <ul class="m-0 mb-2 list-none p-0">
      <li><SidebarLink to="/">Introduction</SidebarLink></li>
    </ul>

    <h4 class="mb-1.5 mt-4 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      api-provider
    </h4>
    <ul class="m-0 mb-2 list-none p-0">
      <li><SidebarLink to="/api-provider">Guide</SidebarLink></li>
    </ul>

    <h4 class="mb-1.5 mt-4 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      crypto
    </h4>
    <ul class="m-0 mb-2 list-none p-0">
      <li><SidebarLink to="/crypto">Guide</SidebarLink></li>
    </ul>

    <h4 class="mb-1.5 mt-4 text-[11px] font-bold uppercase tracking-widest text-text-dim">
      auto-middleware
    </h4>
    <ul class="m-0 mb-2 list-none p-0">
      <li><SidebarLink to="/auto-middleware">Guide</SidebarLink></li>
    </ul>
  </aside>
</template>
