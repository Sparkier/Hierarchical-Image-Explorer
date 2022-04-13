<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ArrowUp from '../icons/ArrowUp.svelte';
  const dispatch = createEventDispatcher();
</script>

<!-- Background and Headline-->
<div class="bg-hie-orange pb-12">
  <div class="w-full h-screen pt-16 home-svg-bg-overlay bg-no-repeat bg-cover">
    <div class="text-center flex justify-center text-white">
      <div class="font-thin text-5xl">Hierarchical Image</div>
      <div class="font-bold text-5xl">&nbsp;Explorer</div>
    </div>
  </div>
  <div class="grid grid-cols-3 gap-4 px-24 -mt-64">
    <!-- Status -->
    <div class="bg-white bg-opacity-50 rounded-lg p-2">
      <b>STATUS (TBD)</b> <br />
      Dataset: flower <br />
      13.500 images loaded <br />
      10 different Categories
    </div>
    <!-- Design Philosophy -->
    <div class="bg-white bg-opacity-50 rounded-lg col-span-2 p-2">
      <b>Design Philosophy</b> <br />
      Our philosophy is a clean, simple and intuitive design. We want to enable a
      broad peer group to be able to use our explorer.
    </div>
    <!-- Hierarchical View -->
    <div class="bg-white bg-opacity-50 rounded-lg col-span-3 p-2">
      <div
        class="underline text-lg underline-offset-4 hover:text-hie-red cursor-pointer w-64"
        on:click={() => dispatch('navigate', 'hierarchical')}
      >
        Hierarchical View
      </div>
      <div class="mt-2 text-sm">
        In the "Hierarchical View" you can explore a tree resulting from
        hierarchical clustering.
      </div>
      <img
        class="mr-auto mt-2 rounded-lg w-[50rem]"
        src="/img/hierarchical.png"
        alt="hierarchical tree view"
      />
    </div>
    <!-- 2D-Visualizarion -->
    <div class="bg-white bg-opacity-50 rounded-lg col-span-3 p-2">
      <div
        class="underline text-lg underline-offset-4 hover:text-hie-red cursor-pointer w-64"
        on:click={() => dispatch('navigate', '2d')}
      >
        2D-Visualization
      </div>
      <div class="mt-2 text-sm">
        In the "2D-Visualization" you can explore the results of Dimensionality
        reduction on the dataset.
      </div>
      <img
        class="mr-auto w-[50rem] mt-2 rounded-lg"
        src="/img/2d.png"
        alt="2d view"
      />
    </div>
    <div class="col-span-2" />
    <!--Back to top Button-->
    <button
      type="button"
      data-mdb-ripple="true"
      data-mdb-ripple-color="light"
      class="ml-auto p-3 flex items-center bg-hie-red w-10 rounded-full hover:bg-hie-orange hover:outline hover:-outline-offset-2 hover:outline-4 hover:outline-hie-red transition duration-50 ease-in-out"
      on:click={() => window.scrollTo(0, 0)}
    >
      <ArrowUp />
    </button>
  </div>
</div>

<style>
  .home-svg-bg-overlay {
    background-image: url(/img/HIE_HERO_2.svg);
  }
</style>
