<script lang="ts">
  import Hierarchical from "./components/Hierarchical.svelte";
</script>

<main>
  <h1>Hierarchical Demo</h1>
  <div class="container">
    <Hierarchical></Hierarchical>
  </div>
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }


  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 3em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
