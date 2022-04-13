<script lang="ts">
  import GraphicalView from './components/GraphicalView.svelte';
  import Hierarchical from './components/Hierarchical.svelte';
</script>

<main class="text-center p-4">
  <div class="container">
    <div class="text-center text-5xl uppercase font-thin text-hie-red">
      Hierarchical Demo
    </div>
    <GraphicalView />
    <Hierarchical />
  </div>
</main>

<style global lang="postcss">
  @tailwind base;
  @tailwind elements;
  @tailwind utilities;
</style>
