<script lang="ts">
  import type ColumnTable from 'arquero/dist/types/table/column-table';
  import * as aq from 'arquero';
  import { VegaLite } from 'svelte-vega';
  import type { BoxPlotDatum } from '../../types';
  import { ColorUtil } from '../../services/colorUtil';

  export let selectedRowsA: ColumnTable;
  export let selectedRowsB: ColumnTable;
  export let selectedColumnName: string;

  let data: { values: BoxPlotDatum[] };

  $: {
    data = { values: [] };
    if (selectedRowsA.numRows() > 0) {
      data.values.push(
        getBoxplotStats(selectedRowsA, selectedColumnName, 'Group A')
      );
    }
    if (selectedRowsB.numRows() > 0) {
      data.values.push(
        getBoxplotStats(selectedRowsB, selectedColumnName, 'Group B')
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
        mark: {
          type: 'bar',
          size: 14,
        },
        encoding: {
          x: { field: 'q1', type: 'quantitative' },
          x2: { field: 'q3' },
          color: {
            field: 'name',
            type: 'nominal',
            legend: null,
            scale: {
              domain: ['Group A', 'Group B'],
              range: [
                ColorUtil.SELECTION_HIGHLIGHT_COLOR_A,
                ColorUtil.SELECTION_HIGHLIGHT_COLOR_B,
              ],
            },
          },
        },
      },
      {
        mark: { type: 'tick', color: 'white', size: 14 },
        encoding: {
          x: { field: 'median', type: 'quantitative' },
        },
      },
    ],
  };

  /**
   * Aggregates the stats needed for a boxplot (q_0,...,q_4) from a given table and column
   * @param table data source
   * @param column the column to use
   * @param name name to put in the boxplot object
   */
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
    return result;
  }
</script>

<main>
  <VegaLite {spec} />
</main>
