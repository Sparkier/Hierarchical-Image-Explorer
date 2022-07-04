<script lang="ts">
  import HieNav from './components/HieNav.svelte';
  import HomeScreen from './components/views/HomeScreen.svelte';
  import AppView from './components/views/AppView.svelte';

  let currentView = 'appview';
</script>

<main class="font-body">
  <HieNav bind:currentView />
  <div class="container">
    {#if currentView === 'home'}
      <HomeScreen bind:currentView />
    {:else if currentView === 'appview'}
      <AppView />
    {/if}
  </div>
</main>

<style global lang="postcss">
  @tailwind base;
  @tailwind elements;
  @tailwind utilities;
</style>
