<script lang="ts">
  import HieNav from './components/HieNav.svelte';
  import HomeScreen from './components/views/HomeScreen.svelte';
  import AppView from './components/views/AppView.svelte';
  import type { SettingsObject } from './types';
  import { DEFAULT_SETTINGS } from './config';

  let currentView: string = 'appview';
  let settingsObject: SettingsObject = DEFAULT_SETTINGS;
</script>

<main class="font-body">
  <div class="z-10 w-full">
    <HieNav bind:currentView bind:settingsObject />
  </div>
  <div class="relative container z-0 fixed overflow-hidden">
    <div class={currentView === 'home' ? '' : 'hidden'}>
      <HomeScreen bind:currentView />
    </div>
    <div class={currentView === 'appview' ? '' : 'hidden'}>
      <AppView {settingsObject} />
    </div>
  </div>
</main>

<style global lang="postcss">
  @tailwind base;
  @tailwind elements;
  @tailwind utilities;
</style>
