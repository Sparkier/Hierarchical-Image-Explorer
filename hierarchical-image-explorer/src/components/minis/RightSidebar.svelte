<script lang="ts">
  import FilterSelector from '../FilterSelector.svelte';

  let isSidebarExpanded: boolean = false;
</script>

<div
  class={isSidebarExpanded
    ? 'duration-2000 transition translate-x-0 fixed right-0 h-full z-20'
    : 'duration-2000 transition translate-x-96 fixed right-0 h-full'}
>
  <div
    class="relative flex flex-row min-h-full max-h-screen overflow-hidden fixed"
  >
    <button
      class="static justify-start"
      on:click={() => (isSidebarExpanded = !isSidebarExpanded)}
    >
      <div class={isSidebarExpanded ? 'w-8 -scale-x-100' : ' w-8'}>
        <div class="mr-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="hover:fill-hie-red w-8 h-8"
          >
            <path
              d="M23.375 30 13.333 19.958l10.042-10 1.958 1.959-8.041 8.041 8.041 8.084Z"
            />
          </svg>
        </div>
      </div>
    </button>
    <div
      class="inline-block flex-col w-96 border-l-2 border-y-2 border-slate-200 bg-slate-50 overflow-y-auto"
    >
      <div class="flex flex-row items-center">
        <div class="top-0 left-0 flex mt-4 ml-4">
          <button
            type="button"
            on:click={() => (isSidebarExpanded = !isSidebarExpanded)}
          >
            <svg
              class="h-6 w-6 stroke-slate-600 hover:stroke-hie-red"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div class="flex text-xl text-left mt-4 ml-2 text-slate-600">
          Filtering
        </div>
      </div>
      <div class="flex mt-2 ml-4">
        <FilterSelector on:filterApplied />
      </div>
    </div>
  </div>
</div>
