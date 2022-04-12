<script lang="ts">
  import GraphicalView from './components/GraphicalView.svelte';
  import Hierarchical from './components/Hierarchical.svelte';
</script>

<main>
  <div class="container">
    <div class="text-center text-5xl uppercase font-thin text-hie">
      Hierarchical Demo
    </div>
    <GraphicalView />
  </div>
</main>

<style global lang="postcss">
  @tailwind base;
  @tailwind elements;
  @tailwind utilities;

  :root {
    --HIE-red: #ff3e00;
  }

  .text-hie {
    color: var(--HIE-red);
  }

  .bg-hie {
    background: var(--HIE-red);
  }

  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
