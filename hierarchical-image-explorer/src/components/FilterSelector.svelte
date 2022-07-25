<script lang="ts">
  import CancelButton from './icons/CancelButton.svelte';
  import type { filterDescriptor } from '../types';

  //!! TODO: grab categories, once arquero is on main
  // this is very much fake
  const hexagonCategories = ['clusterSize'];
  const categories = [
    'label',
    'probability',
    'outlier_score',
    ...hexagonCategories,
  ];

  let filterList: filterDescriptor[] = []; // list of all filters to be applied
  let concatenations: boolean[] = []; // list of concatenations of the filter operations (AND/OR) after selecting in the UI

  /**
   * Creates and adds a filter to the list of filters to be applied.
   */
  function addFilter(
    toBeFilteredOn: string,
    comparator: string,
    valueToBeComparedTo: string
  ) {
    const filter: filterDescriptor = {
      toBeFilteredOn,
      comparator,
      valueToBeComparedTo,
    };
    filterList = [...filterList, filter];
  }

  /**
   * Add a concatenation to the list of concatenations to be applied.
   * @param isOrSelected boolean indicating if the user selected the OR (else the AND) operation after adding filters
   */
  function addConcatenation(isOrSelected: boolean) {
    concatenations = [...concatenations, isOrSelected];
  }
</script>

<div>
  <div class="font-bold text-xl text-left pt-2">Filter</div>
  <div class="grid columns-1 w-full">
    {#each filterList as filter, index}
      <div
        class="w-80 h-28 bg-white rounded-md flex mt-2 mb-2 relative flex-col"
      >
        <div
          class="mr-2 mt-2 absolute top-0 right-0 order-1"
          on:click={() => {
            filterList = filterList.filter((e) => e !== filter);
            concatenations.splice(index, 1);
            concatenations = [...concatenations];
          }}
        >
          <CancelButton />
        </div>
        <div class="text-lg pl-2 pt-2 pb-2">Select the filters:</div>
        <div class="h-0.5 bg-neutral-200 order-2"></div >
        <div
          class="pl-2 pt-2 order-last flex-row justify-between items-stretch"
        >
          <select
            class="h-10 text-lg rounded-sm"
            bind:value={filter.toBeFilteredOn}
          >
            <option value="">to filter</option>
            {#each categories as cat}
              <option value={cat}>{cat}</option>
            {/each}
          </select>
          <select
            class="h-10 rounded-sm text-lg"
            bind:value={filter.comparator}
          >
            <option value="<="> ≤ </option>
            <option value=">="> ≥ </option>
            <option value="="> = </option>
            <option value="<"> {'<'} </option>
            <option value=">"> {'>'} </option>
            <option value="!="> ≠ </option>
          </select>
          <input
            bind:value={filter.valueToBeComparedTo}
            class="pr-2 rounded-sm h-10 bg-neutral-200 focus:outline-none focus:border-hie-orange 
            focus:ring-hie-orange focus:ring-2 w-2/5 placeholder:italic placeholder:text-slate-400 pl-2"
            placeholder="Insert class"
            type="text"
          />
        </div>
      </div>
      <div class="flex items-center mt-2 mb-2">
        <div class="mr-2 text-md font-medium text-black ">AND</div>
        <label
          for={'andor-toggle' + index}
          class="inline-flex relative cursor-pointer"
        >
          <input
            type="checkbox"
            value=""
            id={'andor-toggle' + index}
            class="sr-only peer"
            bind:checked={concatenations[index]}
          />
          <div
            class="w-11 h-6 bg-hie-orange peer-focus:outline-none peer-focus:ring-2
          peer-focus:ring-hie-orange rounded-full peer peer-checked:after:translate-x-full
          peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px]
          after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full
          after:h-5 after:w-5 after:transition-all peer-checked:bg-hie-red"></div >
        </label>
        <div class="ml-2 text-md font-medium text-black">OR</div>
      </div>
    {/each}
    <div class="text-left">
      <button
        class="bg-hie-orange hover:bg-hie-red text-white font-bold py-2 px-4 rounded pt-2"
        on:click={() => {
          addFilter('', '=', '');
          addConcatenation(false);
        }}
      >
        ADD FILTER
      </button>
      {#if filterList.length > 0}
        <button
          class="border-2 border-slate-400 hover:bg-slate-400 hover:text-white text-black font-bold py-2 px-4 rounded"
          on:click={() => console.log(filterList)}
        >
          {filterList.length === 1 ? 'APPLY FILTER' : 'APPLY FILTERS'}
        </button>
      {/if}
    </div>
  </div>
</div>
