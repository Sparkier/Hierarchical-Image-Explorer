<script lang="ts">
  import type ColumnTable from 'arquero/dist/types/table/column-table';
  import { getSelection } from '../../services/arqueroUtils';
  import BackendService from '../../services/backendService';
  import GroupContentDistChart from './GroupContentDistChart.svelte';
  import GroupNumImgChart from './GroupNumImgChart.svelte';
  import * as aq from 'arquero';
  import type { ArraySet } from '../../ArraySet';
  import { TableService } from '../../services/tableService';
  import BoxPlot from './BoxPlot.svelte';
  import Histogram from './Histogram.svelte';
  import { ColorUtil } from '../../services/colorUtil';
  import BarChart from './BarChart.svelte';

  export let datagonsA: ArraySet<[number, number]>;
  export let datagonsB: ArraySet<[number, number]>;
  export let currentQuantizationLocal: ColumnTable;

  let possibleColumns: string[] = TableService.getAdditionalColumns();
  let selectedColumn: string = possibleColumns[0];
  let selectedExtent: { min: number; max: number } = { min: 0, max: 0 };

  $: sumOfSelectedImages = [
    { numberOfImg: selectedRowsA.numRows(), selection: 'A' },
    { numberOfImg: selectedRowsB.numRows(), selection: 'B' },
  ];
  $: selectedRowsA = getSelection(currentQuantizationLocal, datagonsA);
  $: selectedRowsB = getSelection(currentQuantizationLocal, datagonsB);
  $: repA = getSuperRepresentant(datagonsA, selectedRowsA);
  $: repB = getSuperRepresentant(datagonsB, selectedRowsB);
  $: columnType = typeof TableService.getTable().column(selectedColumn)?.get(1);

  $: {
    if (columnType == 'number')
      selectedExtent = selectedRowsA
        .union(selectedRowsB)
        .rollup({
          min: aq.op.min(selectedColumn),
          max: aq.op.max(selectedColumn),
        })
        .object() as { min: number; max: number };
  }

  /**
   * Gets the representantID for a selection.
   * @param selectedCoordinates set of selected hexagon coordinates
   * @param selection selected data
   * @returns ID for group (super) representative image, returns undefined when selection is empty
   */
  function getSuperRepresentant(
    selectedCoordinates: ArraySet<[number, number]>,
    selection: ColumnTable
  ): string | undefined {
    const datagons = [...selectedCoordinates.toArray()];
    if (datagons.length > 0) {
      const avgX = datagons.reduce((v, e) => v + e[0], 0) / datagons.length;
      const avgY = datagons.reduce((v, e) => v + e[1], 0) / datagons.length;

      const superRepresentant = selection
        .groupby('quantization')
        .rollup({
          representativeID: aq.op.mode('id'),
          quantization: aq.op.any('quantization'),
        })
        .derive({
          distance: aq.escape((d: { quantization: [number, number] }) => {
            return Math.sqrt(
              (avgX - d.quantization[0]) ** 2 + (avgY - d.quantization[0]) ** 2
            );
          }),
        })
        .orderby('distance')
        .object() as { representativeID: string };
      return superRepresentant.representativeID;
    }
    return undefined;
  }

  /**
   * Based on the type of the column to aggregate either the average is taken or a discrete distribution is returned.
   * @param column name of the column to aggregate
   * @param table data source
   * @param isASelection check for determining whether A or B is selected
   * @returns array containing the lable with its number of occurrences
   */
  function getColumnDistribution(
    column: string,
    table: ColumnTable,
    isASelection: boolean
  ): { label: string; amount: number }[] {
    if (columnType == 'number') {
      const avgObject = table
        .rollup({
          avg: aq.op.average(column),
        })
        .object() as { avg: number };
      return [
        {
          label: 'avg in ' + (isASelection ? 'A' : 'B'),
          amount: avgObject.avg,
        },
      ];
    } else {
      return getDistributionDiscrete(table, column);
    }
  }

  /**
   * returns a distribution for discrete values
   * @param table data source
   * @param column name of the column to aggregate
   * @returns list of values and their occurrence
   */
  function getDistributionDiscrete(
    table: ColumnTable,
    column: string
  ): { label: string; amount: number }[] {
    const groupedTable = table
      .groupby(column, 'quantization')
      .count()
      .groupby('quantization')
      .rollup({
        labels: aq.op.array_agg_distinct(column),
        distribution: aq.op.array_agg('count'),
      })
      .objects() as {
      quantization: [number, number];
      labels: string[];
      distribution: number[];
    }[];

    const aggregatedDistribution: { label: string; amount: number }[] = [];
    groupedTable.forEach((e) => {
      for (let i = 0; i < e.labels.length; i++) {
        if (aggregatedDistribution.find((f) => f.label == e.labels[i])) {
          const entry = aggregatedDistribution.find(
            (f) => f.label == e.labels[i]
          );
          if (entry == undefined) return;
          entry.amount += e.distribution[i];
        } else {
          aggregatedDistribution.push({
            label: e.labels[i],
            amount: e.distribution[i],
          });
        }
      }
    });
    return aggregatedDistribution;
  }
</script>

<div class="pl-4 pt-4 font-medium text-lg text-left">Representative images</div>
<div class="flex flex-row justify-between">
  <figure>
    {#if repA !== undefined}
      <img
        alt="selectedA"
        class="ml-4 mt-2 mb-2 w-32 h-32"
        src={BackendService.getImageUrl(repA)}
        style="image-rendering: pixelated;"
      />
    {/if}
    <figcaption class="text-center">Group A</figcaption>
  </figure>
  {#if repB !== undefined}
    <figure>
      {#if repB !== undefined}
        <img
          alt="selectedB"
          class="ml-4 mt-2 mb-2 w-32 h-32"
          src={BackendService.getImageUrl(repB)}
          style="image-rendering: pixelated;"
        />
      {/if}
      <figcaption class="text-center">Group B</figcaption>
    </figure>
  {/if}
</div>
<div
  class="mt-4 pl-4 w-full flex flex-col font-medium text-lg text-left overflow-hidden"
>
  {#if selectedRowsA.numRows() > 0 && selectedRowsB.numRows() > 0}
    <div>Number of images:</div>
    <GroupNumImgChart numberOfGroupImages={sumOfSelectedImages} />
  {:else}
    <div>
      Number of images:
      {selectedRowsA.numRows() > 0
        ? selectedRowsA.numRows()
        : selectedRowsB.numRows()}
    </div>
  {/if}
  <div class="mt-2 mb-2 ">Data distribution:</div>
  <select class="h-10 text-lg rounded-sm mb-4" bind:value={selectedColumn}>
    {#each possibleColumns as col}
      <option value={col}>{col}</option>
    {/each}
  </select>
  {#if columnType == 'number'}
    <BoxPlot
      {selectedRowsA}
      {selectedRowsB}
      selectedColumnName={selectedColumn}
    />
    {#if selectedRowsA.numRows() > 0}
      <Histogram
        extent={selectedExtent}
        selectedRows={selectedRowsA}
        selectedColumnName={selectedColumn}
        barColor={ColorUtil.SELECTION_HIGHLIGHT_COLOR_A}
      />
    {/if}
    {#if selectedRowsB.numRows() > 0}
      <Histogram
        extent={selectedExtent}
        selectedRows={selectedRowsB}
        selectedColumnName={selectedColumn}
        barColor={ColorUtil.SELECTION_HIGHLIGHT_COLOR_B}
      />
    {/if}
  {:else}
    {#if selectedRowsA.numRows() > 0 && selectedRowsB.numRows() == 0}
      <BarChart
        data={getColumnDistribution(selectedColumn, selectedRowsA, true)}
      />
    {/if}
    {#if selectedRowsA.numRows() == 0 && selectedRowsB.numRows() > 0}
      <BarChart
        data={getColumnDistribution(selectedColumn, selectedRowsB, false)}
      />
    {:else if selectedRowsA.numRows() > 0 && selectedRowsB.numRows() > 0}
      <GroupContentDistChart
        distributionA={getColumnDistribution(
          selectedColumn,
          selectedRowsA,
          true
        )}
        distributionB={getColumnDistribution(
          selectedColumn,
          selectedRowsB,
          false
        )}
        columnName={selectedColumn}
      />
    {/if}
  {/if}
</div>
