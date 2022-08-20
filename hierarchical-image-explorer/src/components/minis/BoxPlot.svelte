<script lang="ts">
  import type ColumnTable from 'arquero/dist/types/table/column-table';
  import * as aq from 'arquero';
  import { VegaLite } from 'svelte-vega';
  import type { BoxPlotDatum } from '../../types';

  export let selectedRowsA: ColumnTable;
  export let selectedRowsB: ColumnTable;
  export let selectedColumnName: string;

  let data: { values: BoxPlotDatum[] };

  function getBoxplotStats(
    table: ColumnTable,
    column: string,
    name: string
  ): BoxPlotDatum {
    const result = table
      .rollup({
        min: aq.op.min(column),
        max: aq.op.max(column),
        median: aq.op.median(column),
        q1: aq.op.quantile(column, 0.25),
        q3: aq.op.quantile(column, 0.75),
      })
      .object() as BoxPlotDatum;
    result.name = name;
    result.outliers = [];
    return result;
  }

  $: {
    data = { values: [] };
    if (selectedRowsA.numRows() > 0) {
      data.values.push(
        getBoxplotStats(selectedRowsA, selectedColumnName, 'Cluster A')
      );
    }
    if (selectedRowsB.numRows() > 0) {
      data.values.push(
        getBoxplotStats(selectedRowsB, selectedColumnName, 'Cluster B')
      );
    }
  }

  $: spec = {
    title: `Boxplot for ${selectedColumnName}`,
    data: data,
    encoding: { y: { field: 'name', type: 'nominal', title: null } },
    layer: [
      {
        mark: { type: 'rule' },
        encoding: {
          x: {
            field: 'min',
            type: 'quantitative',
            scale: { zero: false },
            title: null,
          },
          x2: { field: 'max' },
        },
      },
      {
        mark: { type: 'bar', size: 14 },
        encoding: {
          x: { field: 'q1', type: 'quantitative' },
          x2: { field: 'q3' },
          color: { field: 'name', type: 'nominal', legend: null },
        },
      },
      {
        mark: { type: 'tick', color: 'white', size: 14 },
        encoding: {
          x: { field: 'median', type: 'quantitative' },
        },
      },
      {
        transform: [{ flatten: ['outliers'] }],
        mark: { type: 'point', style: 'boxplot-outliers' },
        encoding: {
          x: { field: 'outliers', type: 'quantitative' },
        },
      },
    ],
  };
</script>

<main>
  <VegaLite {spec} />
</main>
