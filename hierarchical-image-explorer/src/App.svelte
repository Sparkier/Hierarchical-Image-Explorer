<script lang="ts">
  import HieNav from './components/HieNav.svelte';
  import AppView from './components/views/AppView.svelte';
  import type { SettingsObject } from './types';
  import { DEFAULT_SETTINGS } from './config';

  let settingsObject: SettingsObject = DEFAULT_SETTINGS;
</script>

<main class="flex flex-col font-body h-full w-full">
  <div class="z-10 w-full">
    <HieNav bind:settingsObject />
  </div>
  <div class="relative container z-0 fixed overflow-hidden grow">
    <AppView {settingsObject} />
  </div>
</main>

<style global lang="postcss">
  @tailwind base;
  @tailwind elements;
  @tailwind utilities;
</style>
