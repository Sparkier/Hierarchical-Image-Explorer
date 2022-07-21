<script lang="ts">
  type filterDescriptor = {
    toBeFilteredOn: string; // type to be filtered on
    comparator: string; // comparison operator to be used
    valutoBeComparedTo: string; // value to be compared with
  };

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
  let concatinations: string[] = []; // concatinations of the filter operations

  /**
   * Creates and adds a filter to the list of filters to be applied.
   */
  function addFilter(
    toBeFilteredOn: string,
    comparator: string,
    valutoBeComparedTo: string
  ) {
    const filter: filterDescriptor = {
      toBeFilteredOn,
      comparator,
      valutoBeComparedTo,
    };
    filterList = [...filterList, filter];
  }

  /**
   * Add a concatination to the list of concatinations to be applied.
   */
  function addConcatination(comparator: string) {
    concatinations = [...concatinations, comparator];
  }
</script>

<div>
  <div class="font-bold text-xl text-left">Filter</div>
  <div class="grid columns-1 w-full">
    {#each filterList as filter, index}
      <div class="w-48 h-10 bg-slate-400 flex flex-row mb-2 pr-2 ">
        <div
          class="mt-auto mb-auto mr-2"
          on:click={() => {
            filterList = filterList.filter((e) => e != filter);
            concatinations = concatinations.splice(index, 0);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="currentColor"
            class="bi bi-x-circle"
            viewBox="0 0 16 16"
          >
            <path
              d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"
            />
            <path
              d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"
            />
          </svg>
        </div>
        <select class="px-2 py-2 text-lg" bind:value={filter.toBeFilteredOn}>
          <option value="">to filter</option>
          {#each categories as cat}
            <option value={cat}>{cat}</option>
          {/each}
        </select>
        <select class="ml-2" bind:value={filter.comparator}>
          <option value="<="> ≤ </option>
          <option value=">="> ≥ </option>
          <option value="="> = </option>
          <option value="<"> {'<'} </option>
          <option value=">"> {'>'} </option>
          <option value="!="> ≠ </option>
        </select>
        <input
          bind:value={filter.valutoBeComparedTo}
          class="focus:outline-none focus:border-hie-orange focus:ring-hie-orange focus:ring-2 w-24 placeholder:italic placeholder:text-slate-400"
          placeholder="Insert class"
          type="text"
        />
      </div>
      <div
        class="w-8 h-8 bg-pink-500 text-center"
        on:click={() =>
          (concatinations[index] =
            concatinations[index] == 'AND' ? 'OR' : 'AND')}
      >
        {concatinations[index]}
      </div>
    {/each}
    <div class="text-left">
      <button
        class="bg-hie-orange hover:bg-hie-red text-white font-bold py-2 px-4 rounded"
        on:click={() => {
          addFilter('', '=', '');
          addConcatination('AND');
        }}
      >
        ADD FILTER
      </button>
      {#if filterList.length > 0}
        <button
          class="bg-hie-orange hover:bg-hie-red text-white font-bold py-2 px-4 rounded"
          on:click={() => console.log(filterList)}
        >
          {filterList.length == 1 ? 'APPLY FILTER' : 'APPLY FILTERS'}
        </button>
      {/if}
    </div>
  </div>
</div>
