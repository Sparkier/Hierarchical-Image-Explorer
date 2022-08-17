<script lang="ts">
  import BackendService from '../../services/backendService';
  import { getSelection } from '../../services/arqueroUtils';
  import type ColumnTable from 'arquero/dist/types/table/column-table';
  import * as aq from 'arquero';
  import type { ArraySet } from '../../ArraySet';

  export let currentQuantizationLocal: ColumnTable;
  export let selection: ArraySet<[number, number]>;

  let selectedRow: { id: string };

  $: {
    if (
      currentQuantizationLocal != null &&
      currentQuantizationLocal != undefined
    ) {
      selectedRow = getSelection(currentQuantizationLocal, selection)
        .select(aq.not(['quantization', 'x', 'y']))
        .object() as { id: string };
    }
  }
</script>

<div class="font-bold text-xl text-left">Image Details</div>
{#if selectedRow != undefined && selectedRow != null}
  <div class="pt-2 pb-2 flex-col justify-center">
    <img
      alt="select hexagon first"
      class="max-w-64 max-h-64"
      src={BackendService.getImageUrl(selectedRow['id'])}
      style="image-rendering: pixelated;"
    />
    <div class="mb-2" />
    <div class="flex-col">
      {#each Object.entries(selectedRow) as entry}
        <div class="font-medium text-lg text-left flex">
          {entry[0]}:
          <div class="pl-2 text-slate-400">
            {entry[1]}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
