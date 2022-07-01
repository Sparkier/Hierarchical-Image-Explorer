<script lang="ts">

  import GitHubLogo from './icons/GitHubLogo.svelte';
  import HieLogo from './icons/HIELogo.svelte';

  export let currentView: string;

  $: isCurrentViewClasses = (v: string) =>
    currentView == v ? 'text-hie-red' : 'text-white text-lg hover:text-hie-red';
</script>

<nav class="bg-neutral-800">
  <div class="w-screen flex flex-row items-center h-14">
    <div class="ml-4 h-8 w-8 cursor-pointer basis-1/32" on:click={() => (currentView = 'home')}>
      <HieLogo />
    </div>
    <div class="h-8 w-8 ml-4 basis-1/32">
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
