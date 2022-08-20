<script lang="ts">
  import type ColumnTable from 'arquero/dist/types/table/column-table';
  import * as aq from 'arquero';
  import { VegaLite } from 'svelte-vega';

  export let barColor: string;
  export let selectedRows: ColumnTable;
  export let selectedColumnName: string;
  export let extent: { min: number; max: number };
  export let bins: number = 10;

  /**
   * Aggregates values from a given tables column into bins. Ensures that the extreme extent bins are always created
   * @param table data source
   * @param column column to aggregate values from
   * @param numBins amount of bins to (max) create
   * @param extent extent of the data
   */
  function createBins(
    table: ColumnTable,
    column: string,
    numBins: number,
    extent: { min: number; max: number }
  ): { bin: number; count: number }[] {
    const stepSize = Math.abs(extent.max - extent.min) / numBins;
    const binObject = table
      .groupby({ bin: aq.bin(column, { step: stepSize }) })
      .count()
      .objects() as { bin: number; count: number }[];
    // add minimum and maximum of extent to ensure the entire spectrum is covered
    if (binObject.find((e) => e.bin == extent.min) == undefined) {
      binObject.push({ bin: extent.min, count: 0 });
    }
    if (binObject.find((e) => e.bin == extent.max) == undefined) {
      binObject.push({ bin: extent.max, count: 0 });
    }

    return binObject;
  }

  $: data = {
    values: createBins(selectedRows, selectedColumnName, bins, extent).sort(
      (a, b) => (a.bin > b.bin ? 1 : -1)
    ),
  };

  $: spec = {
    data: data,
    mark: { type: 'bar', fill: barColor, binSpacing: 0, width: { band: 10 } },
    encoding: {
      x: { field: 'bin', type: 'quantitative' },
      y: { field: 'count', type: 'quantitative' },
      tooltip: { field: 'count', type: 'quantitative' },
    },
  };
</script>

<VegaLite {spec} />
