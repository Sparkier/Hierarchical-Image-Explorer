<script lang="ts">
  import Tableview from './components/Tableview.svelte';
</script>

<main>
  <h1>
    Welcome to our website. We will present our hierarchical image explorer soon
  </h1>
  <p>
    This is a project by Niklas Gund, Niklas Weidl and Daniel Stucke @Ulm
    University
  </p>
  <div class="container">
    <Tableview />
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
    color: #d87472;
    font-size: 2em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
