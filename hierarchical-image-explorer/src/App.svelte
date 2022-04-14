<script lang="ts">
  import HieNav from './components/HieNav.svelte';
  import GraphicalView from './components/views/GraphicalView.svelte';
  import Hierarchical from './components/views/Hierarchical.svelte';
  import HomeScreen from './components/views/HomeScreen.svelte';

  let currentView = 'home';
</script>

<main class="font-body">
  <HieNav bind:currentView />
  <div class="container">
    {#if currentView === 'home'}
      <HomeScreen bind:currentView />
    {:else if currentView === '2d'}
      <GraphicalView />
    {:else if currentView === 'hierarchical'}
      <Hierarchical />
    {/if}
  </div>
</main>

<style global lang="postcss">
  @tailwind base;
  @tailwind elements;
  @tailwind utilities;
</style>
