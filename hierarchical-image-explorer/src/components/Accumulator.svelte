<script lang="ts">
  import type { PointData } from '../services/backendService';
  import Hexagon from './minis/Hexagon.svelte';
  import { ColorUtil } from '../services/colorUtil';

  export let data: PointData[];

  export let columns = 30;
  export let rows = 20;

  let svgWidth: number;
  let svgHeight: number;

  var quantisedData: PointData[][][] = calculateQuantisation(data);
  $: hexaSide = svgWidth == undefined ? 0 : svgWidth / (3 * rows);

  $: scaleQuantisedX = (v: number, width: number, row: number) => {
    return svgWidth == undefined
      ? 0
      : v * 3 * hexaSide + (row % 2 == 0 ? 0 : 1.5 * hexaSide);
  };

  $: scaleQuantisedY = (v: number) => {
    return (Math.sqrt(3) / 2) * hexaSide * v;
  };

  /**
   * Calculate a quantisation of our values, to combine multiple points
   * @param input PointData array containing data points
   * @returns quantised PointData with x and y coordinates and an array of included data points
   */
  function calculateQuantisation(input: PointData[]): PointData[][][] {
    const quantised: PointData[][][] = [];
    for (var x = 0; x < rows; x++) {
      quantised.push([]);
      for (var y = 0; y < columns; y++) {
        quantised[x].push([]);
      }
    }

    input.forEach((e) => {
      const quantisedX = Math.floor(((e.x + 100) / 200) * rows);
      const quantisedY = Math.floor(((e.y + 100) / 200) * columns);
      quantised[quantisedX][quantisedY].push(e);
    });
    return quantised;
  }
</script>

<div bind:clientWidth={svgWidth} bind:clientHeight={svgHeight}>
  <svg class="w-full h-[80vh] mt-10">
    {#if hexaSide != 0}
      {#each quantisedData as row, x}
        {#each row as cell, y}
          {#if cell.length > 0}
            <Hexagon
              side={hexaSide}
              x={scaleQuantisedX(x, quantisedData.length, y)}
              y={scaleQuantisedY(y)}
              color={ColorUtil.getCellColor(quantisedData[x][y])}
            />
          {/if}
        {/each}
      {/each}
    {/if}
  </svg>
</div>
