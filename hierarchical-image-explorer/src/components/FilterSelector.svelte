<script lang="ts">
  import CancelButton from './icons/CancelButton.svelte';
  import type { filterDescriptor } from '../types';
  import { TableService } from '../services/tableService';
  import { createEventDispatcher } from 'svelte';

  const hexagonCategories: string[] = []; // will be added once we aggregate with arquero
  const tableColumns: string[] = TableService.getAdditionalColumns();
  const categories: string[] = [...tableColumns, ...hexagonCategories];

  let filterList: filterDescriptor[] = []; // list of all filters to be applied
  let concatenations: boolean[] = []; // list of concatenations of the filter operations (AND/OR) after selecting in the UI true = AND, false = OR

  $: updateArqueroQueries(filterList);

  /**
   * Creates and adds a filter to the list of filters to be applied.
   */
  function addFilter(
    toBeFilteredOn: string,
    comparator: string,
    valueToBeComparedTo: string,
    arqueroQuery: string,
    arqueroQueryManuallyEdited: boolean
  ) {
    const filter: filterDescriptor = {
      toBeFilteredOn,
      comparator,
      valueToBeComparedTo,
      arqueroQuery,
      arqueroQueryManuallyEdited,
    };
    filterList = [...filterList, filter];
  }

  /**
   * Updates the arquero queries if the user is not manually setting them
   * @param filterList list of filters to update on
   */
  function updateArqueroQueries(filterList: filterDescriptor[]) {
    filterList.map((e) => {
      if (e.arqueroQueryManuallyEdited) return e;
      e.arqueroQuery = `d.${e.toBeFilteredOn} ${e.comparator} `;
      if (categories.includes(e.valueToBeComparedTo)) {
        e.arqueroQuery += `d.${e.valueToBeComparedTo}`;
      } else {
        e.arqueroQuery += `'${e.valueToBeComparedTo}'`;
      }
    });
  }

  /**
   * Add a concatenation to the list of concatenations to be applied.
   * @param isOrSelected boolean indicating if the user selected the OR (else the AND) operation after adding filters
   */
  function addConcatenation(isOrSelected: boolean) {
    concatenations = [...concatenations, isOrSelected];
  }
  const dispatch = createEventDispatcher();
</script>

<div class="flex flex-col justify-between grow p-2 min-h-0">
  <datalist id="filterColumns">
    <!-- Columns for right sided selection -->
    {#each categories as cat}
      <option>{cat}</option>
    {/each}
  </datalist>
  <div class="flex flex-col items-center w-full overflow-y-auto min-h-0">
    {#each filterList as filter, index}
      <div class="w-80 bg-white rounded-md flex mt-2 mb-2 relative flex-col">
        <div class="flex justify-between p-2">
          <div class="text-lg">Filter settings:</div>
          <div
            on:click={() => {
              filterList = filterList.filter((e) => e !== filter);
              concatenations.splice(index, 1);
              concatenations = [...concatenations];
              TableService.applyFilters(filterList, concatenations);
              dispatch('filterApplied');
            }}
          >
            <CancelButton />
          </div>
        </div>
        <div class="pl-2 pt-2 flex-row justify-between items-stretch">
          <select
            class="h-10 text-lg rounded-sm"
            bind:value={filter.toBeFilteredOn}
          >
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
            <option value="=="> = </option>
            <option value="<"> {'<'} </option>
            <option value=">"> {'>'} </option>
            <option value="!="> ≠ </option>
          </select>
          <input
            bind:value={filter.valueToBeComparedTo}
            class="pr-2 rounded-sm h-10 bg-neutral-200 focus:outline-none focus:border-hie-orange 
            focus:ring-hie-orange focus:ring-2 w-2/5 placeholder:italic placeholder:text-slate-400 pl-2"
            placeholder="Insert class"
            list="filterColumns"
            type="text"
          />
        </div>
        <div class="mb-3" />
      </div>
      {#if index !== filterList.length - 1}
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
          after:h-5 after:w-5 after:transition-all peer-checked:bg-hie-red"
            />
          </label>
          <div class="ml-2 text-md font-medium text-black">OR</div>
        </div>
      {/if}
    {/each}
  </div>
  <div class="flex justify-between">
    <button
      class="bg-hie-orange hover:bg-hie-red text-white font-bold py-2 px-4 rounded pt-2"
      on:click={() => {
        addFilter(categories[0], '==', '', '', false);
        addConcatenation(false);
      }}
    >
      ADD FILTER
    </button>
    {#if filterList.length > 0}
      <button
        class="border-2 border-slate-400 hover:bg-slate-400 hover:text-white text-black font-bold py-2 px-4 rounded"
        on:click={() => {
          TableService.applyFilters(filterList, concatenations);
          dispatch('filterApplied');
        }}
      >
        {filterList.length === 1 ? 'APPLY FILTER' : 'APPLY FILTERS'}
      </button>
    {/if}
  </div>
</div>
