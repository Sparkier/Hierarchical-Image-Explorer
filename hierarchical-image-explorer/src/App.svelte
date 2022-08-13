<script lang="ts">
  import HieNav from './components/HieNav.svelte';
  import HomeScreen from './components/views/HomeScreen.svelte';
  import AppView from './components/views/AppView.svelte';
  import type { SettingsObject } from './types';
  import { ArraySet } from './ArraySet';

  let currentView = 'appview';
  let settingsObject: SettingsObject;
</script>

<main class="font-body">
  <div class="z-10 w-full">
    <HieNav bind:currentView bind:settingsObject />
  </div>
  <div class="relative container z-0 fixed overflow-hidden">
    {#if currentView === 'home'}
      <HomeScreen bind:currentView />
    {:else if currentView === 'appview'}
      <AppView {settingsObject} />
    {/if}
  </div>
</main>

<style global lang="postcss">
  @tailwind base;
  @tailwind elements;
  @tailwind utilities;
</style>
