<script lang="ts">
  import HieNav from './components/HieNav.svelte';
  import GraphicalView from './components/views/GraphicalView.svelte';
  import Hierarchical from './components/views/Hierarchical.svelte';
  import HomeScreen from './components/views/HomeScreen.svelte';

  let currentView = 'home';
</script>

<main>
  <HieNav
    currentSelection={currentView}
    on:navigate={(v) => (currentView = v.detail)}
  />
  <div class="container">
    {#if currentView === 'home'}
      <HomeScreen on:navigate={(v) => (currentView = v.detail)} />
    {/if}
    {#if currentView === '2d'}
      <GraphicalView />
    {/if}
    {#if currentView === 'hierarchical'}
      <Hierarchical />
    {/if}
  </div>
</main>

<style global lang="postcss">
  @tailwind base;
  @tailwind elements;
  @tailwind utilities;

  * {
    font-family: 'Quicksand';
    font-size: 22px;
  }
</style>
