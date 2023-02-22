<script lang="ts">
  import type { SettingsObject } from '../types';

  import GitHubLogo from './icons/GitHubLogo.svelte';
  import HieLogo from './icons/HIELogo.svelte';
  import SettingsIcon from './icons/SettingsIcon.svelte';
  import Settings from './minis/Settings.svelte';

  export let settingsObject: SettingsObject;

  let isSettingsExpanded: boolean = false;
</script>

<nav class="bg-neutral-800">
  <div class="flex flex-row items-center h-14">
    <div class="ml-4 h-8 w-8">
      <HieLogo />
    </div>
    <div class="h-8 w-8 ml-auto mr-2">
      <a
        href="https://github.com/Sparkier/Hierarchical-Image-Explorer"
        target="_blank"><GitHubLogo /></a
      >
    </div>
    <button
      type="button"
      class="mr-4 cursor-pointer fill-hie-orange transition duration-300 hover:rotate-180 hover:fill-hie-red"
      on:click={() => (isSettingsExpanded = !isSettingsExpanded)}
    >
      <SettingsIcon />
    </button>
  </div>
  <Settings {isSettingsExpanded} bind:settingsObject />
</nav>
