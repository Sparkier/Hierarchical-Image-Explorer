<script lang="ts">
  import GitHubLogo from './icons/GitHubLogo.svelte';
  import HieLogo from './icons/HIELogo.svelte';

  export let currentView: string;

  $: isCurrentViewClasses = (v: string) =>
    currentView == v
      ? 'text-hie-red hover:text-white'
      : 'text-white text-lg hover:text-hie-red';
</script>

<nav class="bg-neutral-800">
  <div class="flex flex-row items-center gap-4 h-14">
    <div
      class="ml-4 h-8 w-8 cursor-pointer"
      on:click={() => (currentView = 'home')}
    >
      <HieLogo />
    </div>
    <div class="h-8 w-8">
      <a
        href="https://github.com/Sparkier/Hierarchical-Image-Explorer"
        target="_blank"><GitHubLogo /></a
      >
    </div>
    <div
      class={`ml-auto mr-8 text-2xl cursor-pointer transition ease-in-out duration-100 ${isCurrentViewClasses(
        'appview'
      )}`}
      on:click={() => (currentView = 'appview')}
    >
      Appview
    </div>
  </div>
</nav>
