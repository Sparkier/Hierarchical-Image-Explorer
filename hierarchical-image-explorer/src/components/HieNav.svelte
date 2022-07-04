<script lang="ts">
  import GitHubLogo from './icons/GitHubLogo.svelte';
  import HieLogo from './icons/HIELogo.svelte';

  export let currentView: string;

  $: isCurrentViewClasses = (v: string) =>
    currentView == v ? 'text-hie-red' : 'text-white text-lg hover:text-hie-red';
</script>

<nav class="bg-neutral-800">
  <div class="w-full flex py-2 px-48 items-center">
    <div class="h-8 w-8 cursor-pointer" on:click={() => (currentView = 'home')}>
      <HieLogo />
    </div>
    <div class="h-8 w-8 ml-4">
      <a
        href="https://github.com/Sparkier/Hierarchical-Image-Explorer"
        target="_blank"><GitHubLogo /></a
      >
    </div>
    <div
      class={`ml-8 text-lg cursor-pointer transition ease-in-out duration-100 ${isCurrentViewClasses(
        'appview'
      )}`}
      on:click={() => (currentView = 'appview')}
    >
      Appview
    </div>
  </div>
</nav>
