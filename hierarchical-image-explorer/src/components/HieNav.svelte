<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import GitHubLogo from './icons/GitHubLogo.svelte';
  import HieLogo from './icons/HIELogo.svelte';

  export let currentSelection: string;

  const dispatch = createEventDispatcher();

  $: getClasses = (v: string) =>
    currentSelection == v
      ? 'text-hie-red'
      : 'text-white text-lg hover:text-hie-red';
</script>

<nav class="bg-neutral-800">
  <div class="w-full flex py-2 px-48 items-center">
    <div
      class="h-8 w-8 cursor-pointer"
      on:click={() => dispatch('navigate', 'home')}
    >
      <HieLogo />
    </div>
    <div class="h-8 w-8 ml-4">
      <a
        href="https://github.com/Sparkier/Hierarchical-Image-Explorer"
        target="_blank"><GitHubLogo /></a
      >
    </div>
    <div
      class={`ml-auto text-lg cursor-pointer transition ease-in-out duration-100 ${getClasses(
        'first-idea'
      )}`}
      on:click={() => dispatch('navigate', 'first-idea')}
    >
      First Idea
    </div>
    <div
      class={`ml-8 text-lg  cursor-pointer transition ease-in-out duration-100 ${getClasses(
        'hierarchical'
      )}`}
      on:click={() => dispatch('navigate', 'hierarchical')}
    >
      Tree
    </div>
    <div
      class={`ml-8 text-lg cursor-pointer transition ease-in-out duration-100 ${getClasses(
        '2d'
      )}`}
      on:click={() => dispatch('navigate', '2d')}
    >
      2D-Visualization
    </div>
  </div>
</nav>
