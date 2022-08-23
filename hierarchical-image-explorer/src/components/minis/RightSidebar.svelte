<script lang="ts">
  import { ColorUtil } from '../../services/colorUtil';
  import { TableService } from '../../services/tableService';

  import {
    colorPropertyType,
    colorQueryMaxima,
    hexagonPropertiesMap,
    selectedColorPalette,
  } from '../../stores';

  import FilterSelector from '../FilterSelector.svelte';

  let isSidebarExpanded: boolean = false;
  let colorQuery = '';
  let colorPropertyTypeLocal = '';
  let selectedGradient = 'Cinema';

  $: selectedColorPalette.set(selectedGradient);

  hexagonPropertiesMap.subscribe((v) => {
    if (colorQuery == '') colorQuery = v.color;
  });
  colorPropertyType.subscribe((v) => (colorPropertyTypeLocal = v));

  function updateColorProperty() {
    hexagonPropertiesMap.update((e) => {
      e.color = colorQuery;
      return e;
    });
    // update the type
    const dataType = TableService.getType(colorQuery);
    colorPropertyType.set(dataType);
    if (dataType == 'number') {
      colorQueryMaxima.set(TableService.getQueryExtentQuantized(colorQuery));
    }
  }
</script>

<div
  class={isSidebarExpanded
    ? 'duration-2000 transition translate-x-0 fixed right-0 h-full z-10'
    : 'duration-2000 transition translate-x-96 fixed right-0 h-full'}
>
  <div class="relative flex flex-row min-h-full max-h-screen overflow-hidden">
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
      class="w-96 border-l-2 flex flex-col border-y-2 border-slate-200 bg-slate-50 h-screen"
    >
      <div class="overflow-y-auto flex flex-col h-full">
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
        </div>
        <!-- color query section -->
        <div class="px-4 pb-2 border-b-2 border-slate-200">
          <form
            class="flex flex-row justify-between mt-4"
            on:submit|preventDefault={() => {
              updateColorProperty();
            }}
          >
            <div class="text-lg pr-2 ">Color by:</div>
            <input
              class="w-48 rounded-md focus:outline-none focus:border-hie-orange
            focus:ring-hie-orange focus:ring-2 pl-2"
              type="text"
              name="colorQuery"
              id="colorQuery"
              bind:value={colorQuery}
            />
            <input
              class="pl-2 text-lg hover:text-hie-red"
              type="submit"
              value="apply"
            />
          </form>
          {#if colorPropertyTypeLocal === 'number'}
            <div class="flex mt-2">
              <div class="mr-4">Color scheme</div>
              <select bind:value={selectedGradient}>
                {#each ColorUtil.gradients as gradient}
                  <option value={gradient.name}>{gradient.name}</option>
                {/each}
              </select>
            </div>
          {/if}
        </div>
        <!-- filtering section -->
        <div class="flex mt-2 ml-4">
          <FilterSelector on:filterApplied />
        </div>
      </div>

      <div class="mb-[380px] border-t-2 border-slate-200" />
    </div>
  </div>
</div>
