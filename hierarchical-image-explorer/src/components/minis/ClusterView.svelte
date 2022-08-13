<script lang="ts">
  import type ColumnTable from 'arquero/dist/types/table/column-table';

  import { getSelection } from '../../services/arqueroUtils';

  import BackendService from '../../services/backendService';
  import ClusterContentDistChart from './ClusterContentDistChart.svelte';
  import ClusterNumImgChart from './ClusterNumImgChart.svelte';
  import * as aq from 'arquero';
  import type { ArraySet } from '../../ArraySet';
  import { TableService } from '../../services/tableService';

  export let datagonsA: ArraySet<[number, number]>;
  export let datagonsB: ArraySet<[number, number]>;
  export let currentQuantizationLocal: ColumnTable;

  let possibleColumns = TableService.getAdditionalColumns();
  let selectedColumn = possibleColumns[0];

  $: sumOfSelectedImages = [
    { numberOfImg: selectedRowsA.numRows(), selection: 'A' },
    { numberOfImg: selectedRowsB.numRows(), selection: 'B' },
  ];

  $: selectedRowsA = getSelection(currentQuantizationLocal, datagonsA);
  $: selectedRowsB = getSelection(currentQuantizationLocal, datagonsB);

  $: repA = getSuperRepresentant(datagonsA, selectedRowsA);
  $: repB = getSuperRepresentant(datagonsB, selectedRowsB);
  /**
   * Gets the representantID for a selection.
   * @param {DataHexagon[]} datagons
   */
  function getSuperRepresentant(
    datagonsMap: ArraySet<[number, number]>,
    selection: ColumnTable
  ) {
    const datagons = [...datagonsMap.toArray()];
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
  }

  /**
   * Gets the cluster content distribution by summing up all entries.
   * @param {DataHexagon[]} datagons
   */
  function getColumnDistribution(
    column: string,
    table: ColumnTable,
    isASelection: boolean
  ): { label: string; amount: number }[] {
    const columnType = typeof table.column(column)?.get(1);

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
      const aggregatedDistribution: { label: string; amount: number }[] =
        getDistributionDiscrete(table, column);
      return aggregatedDistribution;
    }
  }

  function getDistributionDiscrete(table: ColumnTable, column: string) {
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
      for (var i = 0; i < e.labels.length; i++) {
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
    {#if repA != undefined}
      <img
        alt="selectedA"
        class="ml-4 mt-2 mb-2 w-32 h-32"
        src={BackendService.getImageUrl(repA)}
        style="image-rendering: pixelated;"
      />
    {/if}
    <figcaption class="text-center">Cluster A</figcaption>
  </figure>
  {#if repB !== undefined}
    <figure>
      {#if repB != undefined}
        <img
          alt="selectedB"
          class="ml-4 mt-2 mb-2 w-32 h-32"
          src={BackendService.getImageUrl(repB)}
          style="image-rendering: pixelated;"
        />
      {/if}
      <figcaption class="text-center">Cluster B</figcaption>
    </figure>
  {/if}
</div>
<div
  class="mt-4 pl-4 w-full flex flex-col font-medium text-lg text-left overflow-hidden"
>
  <div>Number of images in clusters</div>
  <ClusterNumImgChart numberOfClusterImages={sumOfSelectedImages} />
  <div class="mt-2 mb-2 font-semibold">
    {selectedColumn} distribution in clusters
  </div>
  <select class="h-10 text-lg rounded-sm mb-4" bind:value={selectedColumn}>
    {#each possibleColumns as col}
      <option value={col}>{col}</option>
    {/each}
  </select>
  <ClusterContentDistChart
    distributionA={getColumnDistribution(selectedColumn, selectedRowsA, true)}
    distributionB={getColumnDistribution(selectedColumn, selectedRowsB, false)}
    columnName={selectedColumn}
  />
</div>
